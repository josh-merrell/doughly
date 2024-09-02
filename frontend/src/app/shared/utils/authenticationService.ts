import { Injectable, WritableSignal, effect, signal } from '@angular/core';
import { RealtimeChannel, Session, User } from '@supabase/supabase-js';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';

import { first, from, Observable } from 'rxjs';
import { PushTokenService } from './pushTokenService';
import { Capacitor } from '@capacitor/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import {
  SignInWithApple,
  SignInWithAppleResponse,
  SignInWithAppleOptions,
} from '@capacitor-community/apple-sign-in';

export interface Profile {
  user_id: string;
  username: string;
  email: string;
  name_first?: string;
  name_last?: string;
  photo_url?: string;
  joined_at?: Date;
  darkMode: string;
  onboardingState?: number;
  checkIngredientStock?: boolean;
  autoDeleteExpiredStock?: boolean;
  notifyOnLowStock?: string;
  notifyOnNoStock?: string;
  notifyUpcomingStockExpiry?: string;
  notifyExpiredStock?: string;
  notifyFriendCreateRecipe?: string;
  notifyFolloweeCreateRecipe?: string;
  notifyFriendRequest?: string;
  notifyNewFollower?: string;
  lastPermRefreshDate?: string | null;

  //permissions
  isPremium: boolean;
  permRecipeSubscribeUnlimited: boolean;
  permRecipeCreateUnlimited: boolean;
  permDataBackupDaily6MonthRetention: boolean;
  permAITokenCount: number;
  permAITokenLastRefreshDate: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public supabase!: SupabaseClient;
  private user: WritableSignal<User | null> = signal(null);
  private user_id: WritableSignal<string | null | undefined> =
    signal(undefined);
  public profile: WritableSignal<Profile | null | undefined> =
    signal(undefined);
  private profileRealtime: RealtimeChannel | null = null;

  private usernameToSet: WritableSignal<string | null> = signal(null);

  isProfile(obj: any): obj is Profile {
    return (
      obj && typeof obj.user_id === 'string' && typeof obj.email === 'string'
    );
  }

  constructor(
    private pushTokenService: PushTokenService,
    private router: Router
  ) {
    this.supabase = createClient(
      environment.SUPABASE_DOUGHLEAP_URL,
      environment.SUPABASE_DOUGHLEAP_KEY
    );

    // Check the current session on initialization
    this.supabase.auth.getSession().then(({ data, error }) => {
      if (data && data.session && !error) {
        this.handleAuthStateChange('SIGNED_IN', data.session);
      }
    });

    // Listen for future auth state changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.handleAuthStateChange(event, session);
    });

    // Set username to new profile after creating it. Refer to this.signUp()
    effect(() => {
      const profile = this.profile();
      const usernameToSet = this.usernameToSet();

      if (profile && usernameToSet) {
        this.updateProfile({ ...profile, username: usernameToSet })
          .pipe(first())
          .subscribe((res) => {
            if (res) {
              this.usernameToSet.set(null);
            }
          });
      }
    });

    // Initialize profile of user: The state of the user's profile requires a user. If none is set, there shouldn't be a profile.
    effect(
      () => {
        const user = this.user();
        if (user) {
          // We only make changes if the user is different
          if (user.id !== this.user_id()) {
            this.user_id.set(user.id);

            // One-time API call to supabase to get the user profile
            this.supabase
              .from('profiles')
              .select('*')
              .match({ user_id: user.id })
              .single()
              .then((res) => {
                // Update our profile with the current value
                this.profile.set(this.isProfile(res.data) ? res.data : null);

                // If there is an unsaved pushToken, update the profile with it
                if (this.pushTokenService.unsavedPushToken()) {
                  // console.log(
                  //   'save pushToken: ' +
                  //     this.pushTokenService.unsavedPushToken()
                  // );
                  this.pushTokenService.savePushToken(
                    this.pushTokenService.unsavedPushToken()!
                  );
                }

                //Listen to any changes to the user profile using supabase's Realtime
                this.profileRealtime = this.supabase
                  .channel('public:profiles')
                  .on(
                    'postgres_changes',
                    {
                      event: '*',
                      schema: 'public',
                      table: 'profiles',
                      filter: 'user_id=eq.' + user.id,
                    },
                    (payload: any) => {
                      // Update the profile with the newest value
                      this.profile.set(
                        this.isProfile(payload.new) ? payload.new : null
                      );

                      // If there is an unsaved pushToken, update the profile with it
                      if (this.pushTokenService.unsavedPushToken()) {
                        // console.log(
                        //   'save pushToken: ' +
                        //     this.pushTokenService.unsavedPushToken()
                        // );
                        this.pushTokenService.savePushToken(
                          this.pushTokenService.unsavedPushToken()!
                        );
                      }
                    }
                  )
                  .subscribe();
              });
          }
        } else {
          // If there is no user, we clear the profile and stop listening to changes
          this.profile.set(null);
          this.user_id.set(null);
          if (this.profileRealtime) {
            this.supabase.removeChannel(this.profileRealtime);
          }
        }
      },
      { allowSignalWrites: true }
    );
  }

  private handleAuthStateChange(event: string, session: Session | null) {
    // console.log('onAuthStateChange: ', JSON.stringify(event));
    if (event === 'PASSWORD_RECOVERY') {
      this.router.navigate(['/reset-password']);
    }
    if (event === 'USER_UPDATED') {
      if (!Capacitor.isNativePlatform()) {
        this.router.navigate(['/web']);
      } else {
        this.router.navigate(['/login']);
      }
    }
    if (session) {
      this.getUserFromSession(session).then((user) => {
        if (user) {
          this.user.set(user);
          this.getUserProfile(user.id, session);
        } else {
          this.clearUserData();
        }
      });
    } else {
      this.clearUserData();
    }
  }

  public async setSession(access_token, refresh_token) {
    return this.supabase.auth.setSession({ access_token, refresh_token });
  }

  private async getUserFromSession(session: Session): Promise<User | null> {
    const { data, error } = await this.supabase.auth.getUser(
      session.access_token
    );
    if (error || !data) {
      return null;
    }
    return data.user;
  }

  public refreshProfile() {
    const user = this.user();
    if (user) {
      this.supabase
        .from('profiles')
        .select('*')
        .match({ user_id: user.id })
        .single()
        .then((res) => {
          this.profile.set(this.isProfile(res.data) ? res.data : null);
        });
    }
  }

  private getUserProfile(user_id: string, session: Session) {
    this.supabase
      .from('profiles')
      .select('*')
      .match({ user_id: user_id })
      .single()
      .then((res) => {
        if (res.data && this.isProfile(res.data)) {
          this.profile.set(res.data);
          this.profileRealtime = this.supabase
            .channel('public:profiles')
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'profiles',
                filter: 'user_id=eq.' + user_id,
              },
              (payload: any) => {
                this.profile.set(
                  this.isProfile(payload.new) ? payload.new : null
                );
              }
            )
            .subscribe();
        } else {
          // If no profile is found, create a new one
          this.createNewProfile(user_id, session);
        }
      });
  }

  private async createNewProfile(user_id: string, session: Session) {
    // Get user details
    const newUser = await this.getUserFromSession(session);
    if (!newUser) {
      return;
    }

    // check whether the user_id exists in the profiles table
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .match({ user_id: user_id })
      .maybeSingle();
    if (error) {
      console.error('Error getting profile: ', error);
      return;
    }

    // oauth raw data
    let nameFirst;
    let nameLast;
    if (newUser.user_metadata) {
      console.log('oauth raw data: ', newUser.user_metadata);
      nameFirst = newUser.user_metadata['full_name']
        ? newUser.user_metadata['full_name'].split(' ')[0]
        : newUser.user_metadata['name']
        ? newUser.user_metadata['name'].split(' ')[0]
        : null;
      nameLast = newUser.user_metadata['full_name']
        ? newUser.user_metadata['full_name'].split(' ')[1]
        : newUser.user_metadata['name']
        ? newUser.user_metadata['name'].split(' ')[1]
        : null;
    }

    // Define the new profile based on the user details
    const newProfile = {
      user_id: newUser.id,
      name_first: nameFirst,
      name_last: nameLast,
      email: newUser.email,
      joined_at: new Date(),
      onboardingState: 0.5,
      checkIngredientStock: false,
      autoDeleteExpiredStock: true,
      notifyOnLowStock: 'Enabled',
      notifyOnNoStock: 'Enabled',
      notifyUpcomingStockExpiry: 'Enabled',
      notifyExpiredStock: 'Enabled',
      notifyFriendCreateRecipe: 'Enabled',
      notifyFolloweeCreateRecipe: 'Enabled',
      notifyFriendRequest: 'Enabled',
      notifyNewFollower: 'Enabled',
    };

    // Insert the new profile into the profiles table if the user_id doesn't exist yet
    if (error || !data) {
      this.supabase
        .from('profiles')
        .insert([newProfile])
        .select('*')
        .then(({ data, error }) => {
          if (error && error.code !== '406') {
            console.error('Error creating new profile: ', error);
            return;
          }
          if (data && data.length > 0) {
            this.profile.set({
              user_id: data[0].user_id,
              email: data[0].email,
              username: data[0].username,
              onboardingState: data[0].onboardingState,
              isPremium: false,
              darkMode: 'System Default',
              //permissions
              permRecipeSubscribeUnlimited: false,
              permRecipeCreateUnlimited: false,
              permDataBackupDaily6MonthRetention: false,
              permAITokenCount: 7,
              permAITokenLastRefreshDate: null,
            });
          }
        });
    }
    // Initialize the profile Realtime
    this.profileRealtime = this.supabase
      .channel('public:profiles')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: 'user_id=eq.' + user_id,
        },
        (payload: any) => {
          this.profile.set(this.isProfile(payload.new) ? payload.new : null);
        }
      )
      .subscribe();
  }

  private clearUserData() {
    this.user.set(null);
    this.profile.set(null);
    this.user_id.set(null);

    if (this.profileRealtime) {
      this.supabase.removeChannel(this.profileRealtime).then((res) => {
        // console.log('Removed profileRealtime: ', res);
      });
    }
  }

  async signIn(email: string, password: string, rememberMe: boolean) {
    // Set profile back to undefined to trigger the effect to fetch the profile
    this.profile.set(undefined);
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return error;
    }
    if (rememberMe) {
      this.setPersistentSession(data);
    }
    return data;
  }

  signUp(email: string, password: string, username: string) {
    // Set profile back to undefined to trigger the effect to fetch the profile
    this.profile.set(undefined);
    const redirectTo = 'https://doughly.co';
    this.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
      },
    });
    this.usernameToSet.set(username);
  }

  async updateUser(password: string) {
    await this.supabase.auth.updateUser({
      password,
    });
  }

  updateProfile(profileProperties: any): Observable<any> {
    const update = {
      updated_at: new Date(),
    };
    Object.keys(profileProperties).forEach((key) => {
      if (profileProperties[key]) {
        update[key] = profileProperties[key];
      }
    });
    return from(
      this.supabase
        .from('profiles')
        .update(update)
        .eq('user_id', this.user_id())
        .select('*')
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error updating profile: ', error);
            throw error;
          }
          const newProfile = {
            user_id: data.user_id,
            email: data.email,
            username: data.username,
            name_first: data.name_first,
            name_last: data.name_last,
            photo_url: data.photo_url,
            joined_at: data.joined_at,
            city: data.city,
            state: data.state,
            isPremium: data.isPremium,
            darkMode: data.darkMode,
            lastPermRefreshDate: data.lastPermRefreshDate,
            //permissions
            permRecipeSubscribeUnlimited: data.permRecipeSubscribeUnlimited,
            permRecipeCreateUnlimited: data.permRecipeCreateUnlimited,
            permDataBackupDaily6MonthRetention:
              data.permDataBackupDaily6MonthRetention,
            permAITokenCount: data.permAITokenCount,
            permAITokenLastRefreshDate: data.permAITokenLastRefreshDate,
          };
          this.profile.set(newProfile);
          return data;
        })
    );
  }

  logout() {
    this.clearPersistentSession();
    return this.supabase.auth.signOut();
  }

  async resetPassword(email: string) {
    const redirectTo = Capacitor.isNativePlatform()
      ? 'https://doughly.co/login'
      : 'https://doughly.co/login?admin=true';
    const { data, error } = await this.supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: redirectTo,
      }
    );
    if (error) {
      return error.message;
    }
    return 'success';
  }

  isUsernameUnique(username: string): Observable<boolean> {
    return from(
      this.supabase
        .from('profiles')
        .select('*')
        .match({ username: username })
        .then(({ data, error }) => {
          if (error) throw error;
          return data?.length === 0;
        })
    );
  }

  isEmailUnique(email: string): Observable<boolean> {
    return from(
      this.supabase
        .from('profiles')
        .select('*')
        .match({ email: email })
        .then(({ data, error }) => {
          if (error) throw error;
          return data?.length === 0;
        })
    );
  }

  isUsernameValid(username: string): boolean {
    //should require that the username is at least 5 characters long and contains only letters, numbers, and underscores.
    return /^[a-zA-Z0-9_]{5,}$/.test(username);
  }

  updateField(field: string, value: string | null) {
    const update = {
      [field]: value,
      updated_at: new Date(),
    };
    return from(
      this.supabase
        .from('profiles')
        .update(update)
        .eq('user_id', this.user_id())
        .select('*')
        .single()
        .then(({ data, error }) => {
          if (error) throw error;
          const newProfile = {
            user_id: data.user_id,
            email: data.email,
            username: data.username,
            name_first: data.name_first,
            name_last: data.name_last,
            photo_url: data.photo_url,
            joined_at: data.joined_at,
            city: data.city,
            state: data.state,
            darkMode: data.darkMode,
            lastPermRefreshDate: data.lastPermRefreshDate,
            //permissions
            isPremium: data.isPremium,
            permRecipeSubscribeUnlimited: data.permRecipeSubscribeUnlimited,
            permRecipeCreateUnlimited: data.permRecipeCreateUnlimited,
            permDataBackupDaily6MonthRetention:
              data.permDataBackupDaily6MonthRetention,
            permAITokenCount: data.permAITokenCount,
            permAITokenLastRefreshDate: data.permAITokenLastRefreshDate,
          };
          this.profile.set(newProfile);
          return data;
        })
    );
  }

  // async signInWithGoogle(token: string): Promise<void> {
  //   try {
  //     // Set _$profile back to undefined. This will mean that $profile will wait to emit a value
  //     this.profile.set(undefined);

  //     // Use the token to sign in with Supabase
  //     const { data, error } = await this.supabase.auth.signInWithIdToken({
  //       provider: 'google',
  //       token: token,
  //     });

  //     if (error) throw error;

  //     // Check if the user is successfully returned
  //     if (data && data.user) {
  //       this.user.set(data.user);
  //     }
  //   } catch (error) {
  //     console.error('Error during Google sign-in:', error);
  //     throw error;
  //   }
  // }
  async signInWithGoogle(): Promise<void> {
    try {
      const redirectTo = 'https://doughly.co';
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error during Google sign-in:', error);
      throw error;
    }
  }

  async signInWithFacebook(): Promise<void> {
    try {
      const redirectTo = 'https://doughly.co';
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: redirectTo,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error during Facebook sign-in:', error);
      throw error;
    }
  }

  // USING NATIVE INSTEAD SINCE THIS OPENS IN BROWSER, DOESN'T REDIRECT BACK TO APP
  // async signInWithApple(): Promise<void> {
  //   try {
  //     const redirectTo = 'https://doughly.co';
  //     const { data, error } = await this.supabase.auth.signInWithOAuth({
  //       provider: 'apple',
  //       options: {
  //         redirectTo: redirectTo,
  //       },
  //     });

  //     if (error) throw error;
  //   } catch (error) {
  //     console.error('Error during Apple sign-in:', error);
  //     throw error;
  //   }
  // }

  async signInWithAppleNative(): Promise<void> {
    try {
      let options: SignInWithAppleOptions = {
        clientId: 'co.doughly.app',
        redirectURI: 'https://doughly.co',
        scopes: 'email',
        state: '12345',
      };

      const result: SignInWithAppleResponse = await SignInWithApple.authorize(
        options
      );

      const token = result.response.identityToken;

      const { data, error } = await this.supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: token,
      });

      // now add the first and last name to the new supabase user profile using the raw data from the apple sign in
      console.log('APPLE SIGN IN RAW DATA: ', result.response);
      const nameFirst = result.response.givenName;
      const nameLast = result.response.familyName;

      // use supabase.auth.updateUser to update the user's profile with the first and last name
      if (
        nameFirst &&
        nameFirst !== 'null' &&
        nameLast &&
        nameLast !== 'null'
      ) {
        await this.supabase.auth.updateUser({
          data: {
            full_name: nameFirst + ' ' + nameLast,
          },
        });
      }

      if (error) throw error;
    } catch (error) {
      console.error('Error during Apple Native sign-in:', error);
      throw error;
    }
  }

  // 'Remember Me' feature
  setPersistentSession(data: any) {
    localStorage.setItem(
      'supabase.auth.token',
      data.currentSession.access_token
    );
    localStorage.setItem(
      'supabase.auth.refreshToken',
      data.currentSession.refresh_token
    );
  }

  clearPersistentSession() {
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('supabase.auth.refreshToken');
  }

  getPersistentSession() {
    const access_token = localStorage.getItem('supabase.auth.token');
    const refresh_token = localStorage.getItem('supabase.auth.refreshToken');
    return { access_token, refresh_token };
  }

  deleteProfile() {
    // server will delete the supabase user and profile, here we just need to clear profile state which will clear the session and require fresh login
    this.profile.set(null);
  }
}
