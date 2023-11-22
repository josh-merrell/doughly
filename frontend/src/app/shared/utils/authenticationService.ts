import { Injectable } from '@angular/core';
import { RealtimeChannel, Session, User } from '@supabase/supabase-js';
import {
  BehaviorSubject,
  filter,
  first,
  from,
  Observable,
  skipWhile,
  tap,
} from 'rxjs';
import { SupabaseService } from './supabase.service';

export interface Profile {
  user_id: string;
  username: string;
  email: string;
  name_first?: string;
  name_last?: string;
  photo_url?: string;
  joined_at?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Supabase user state
  private _$user = new BehaviorSubject<User | null | undefined>(undefined);
  $user = this._$user.pipe(
    skipWhile((_) => typeof _ === 'undefined')
  ) as Observable<User | null>;
  public user_id?: string;

  // Profile state
  private _$profile = new BehaviorSubject<Profile | null | undefined>(
    undefined
  );
  $profile = this._$profile.pipe(
    skipWhile((_) => typeof _ === 'undefined' || !_)
  ) as Observable<Profile | null>;
  private profile_subscription?: RealtimeChannel;

  isProfile(obj: any): obj is Profile {
    return (
      obj && typeof obj.user_id === 'string' && typeof obj.email === 'string'
    );
  }

  constructor(private supabase: SupabaseService) {
    // Check the current session on initialization
    this.supabase.supabase.auth.getSession().then(({ data, error }) => {
      if (data && data.session && !error) {
        this.handleAuthStateChange('SIGNED_IN', data.session);
      }
    });
    // Listen for future auth state changes
    this.supabase.supabase.auth.onAuthStateChange(
      this.handleAuthStateChange.bind(this)
    );

    // Initialize the user's profile
    // The state of the user's profile is dependent on their being a user. If no user is set, there shouldn't be a profile.
    this.$user.subscribe((user) => {
      if (user) {
        // We only make changes if the user is different
        if (user.id !== this.user_id) {
          const user_id = user.id;
          this.user_id = user_id;

          // One-time API call to Supabase to get the user's profile
          this.supabase.supabase
            .from('profiles')
            .select('*')
            .match({ user_id: user_id })
            .single()
            .then((res) => {
              // Update our profile BehaviorSubject with the current value
              this._$profile.next(this.isProfile(res.data) ? res.data : null);

              // Listen to any changes to our user's profile using Supabase Realtime
              this.profile_subscription = this.supabase.supabase
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
                    // Update our profile BehaviorSubject with the newest value
                    this._$profile.next(payload.new);
                  }
                )
                .subscribe();
            });
        }
      } else {
        // If there is no user, update the profile BehaviorSubject, delete the user_id, and unsubscribe from Supabase Realtime
        this._$profile.next(null);
        delete this.user_id;
        if (this.profile_subscription) {
          this.supabase.supabase.removeChannel(this.profile_subscription);
        }
      }
    });
  }

  private handleAuthStateChange(event: string, session: Session | null) {
    if (session) {
      this.getUserFromSession(session).then((user) => {
        if (user) {
          this._$user.next(user);
          this.getUserProfile(user.id, session);
        } else {
          this.clearUserData();
        }
      });
    } else {
      this.clearUserData();
    }
  }

  private async getUserFromSession(session: Session): Promise<User | null> {
    const { data, error } = await this.supabase.supabase.auth.getUser(
      session.access_token
    );
    if (error || !data) return null;
    return data.user;
  }

  private getUserProfile(user_id: string, session: Session) {
    // One-time API call to Supabase to get the user's profile
    this.supabase.supabase
      .from('profiles')
      .select('*')
      .match({ user_id: user_id })
      .single()
      .then((res) => {
        if (res.data && this.isProfile(res.data)) {
          // If profile exists, update our profile BehaviorSubject
          this._$profile.next(res.data);

          // Initialize profile_subscription
          this.profile_subscription = this.supabase.supabase
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
                // Update profile BehaviorSubject with the newest value
                this._$profile.next(payload.new);
              }
            )
            .subscribe();
        } else {
          // If no profile exists, create a new one
          this.createNewProfile(user_id, session);
        }
      });
  }

  private async createNewProfile(user_id: string, session: Session) {
    // Get User Details:
    const newUser = await this.getUserFromSession(session);

    if (!newUser) {
      return;
    }

    // check whether the user_id exists in the profiles table
    const { data, error } = await this.supabase.supabase
      .from('profiles')
      .select('*')
      .match({ user_id: user_id })
      .single();

    // Define the new profile based on the user details
    const newProfile = {
      user_id: newUser.id,
      email: newUser.email,
      joined_at: new Date(),
    };

    // Insert the new profile into the profiles table if it the user_id is not yet present
    if (error || !data) {
      this.supabase.supabase
        .from('profiles')
        .insert(newProfile)
        .select('*')
        .then(({ data, error }) => {
          if (error && error.code !== '406') {
            console.error('Error creating new profile:', error);
            return;
          }
          if (data && data.length > 0) {
            this._$profile.next({
              user_id: data[0].user_id,
              email: data[0].email,
              username: data[0].username,
            });
          }
        });
    }
    // Initialize profile_subscription
    this.profile_subscription = this.supabase.supabase
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
          // Update profile BehaviorSubject with the newest value
          this._$profile.next(payload.new);
        }
      )
      .subscribe();
  }

  private clearUserData() {
    this._$user.next(null);
    this._$profile.next(null);
    delete this.user_id;

    if (this.profile_subscription) {
      this.supabase.supabase
        .removeChannel(this.profile_subscription)
        .then((res) => {
          console.log(
            'Removed profile channel subscription with status: ',
            res
          );
        });
    }
  }

  signIn(email: string, password: string) {
    return new Promise<void>((resolve, reject) => {
      // Set _$profile back to undefined. This will mean that $profile will wait to emit a value
      this._$profile.next(undefined);
      this.supabase.supabase.auth
        .signInWithPassword({ email, password })
        .then(({ data, error }) => {
          if (error || !data) reject('Invalid email/password combination');

          // Wait for $profile to be set again.
          // We don't want to proceed until our API request for the user's profile has completed
          this.$profile.pipe(first()).subscribe(() => {
            resolve();
          });
        });
    });
  }

  signUp(email: string, password: string, username: string) {
    return new Promise<void>((resolve, reject) => {
      // Set _$profile back to undefined. This will mean that $profile will wait to emit a value
      this._$profile.next(undefined);

      this.supabase.supabase.auth
        .signUp({ email, password })
        .then(({ data, error }) => {
          if (error || !data) {
            reject('Error. Try again later');
            return;
          }

          // Wait for $profile to be set again after being created. Wait for a valid profile emission
          this.$profile
            .pipe(
              filter((profile) => profile !== null && profile !== undefined),
              first()
            )
            .subscribe((profile) => {
              // Update the profile with the username
              this.updateProfile({ ...profile, username: username });
              resolve();
            });
        });
    });
  }

  updateProfile(profile: any): void {
    const update = {
      ...profile,
      updated_at: new Date(),
    };
    // upsert the update into the 'profiles' table, then update the profile BehaviorSubject with the new profile
    this.supabase.supabase
      .from('profiles')
      .upsert(update)
      .then(({ data, error }) => {
        if (error) console.error('Error updating profile:', error);
        if (data !== null && data !== undefined) {
          this._$profile.next(data);
        }
      });
  }

  logout() {
    return this.supabase.supabase.auth.signOut();
  }

  isUsernameUnique(username: string): Observable<boolean> {
    return from(
      this.supabase.supabase
        .from('profiles')
        .select('*')
        .match({ username: username })
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
      updated_at: new Date()
    };
    return from(
      this.supabase.supabase
        .from('profiles')
        .update(update)
        .eq('user_id', this.user_id)
        .select('*')
        .then(({ data, error }) => {
          if (error) throw error;

          const newProfile = {
            user_id: data[0].user_id,
            email: data[0].email,
            username: data[0].username,
            name_first: data[0].name_first,
            name_last: data[0].name_last,
            photo_url: data[0].photo_url,
            joined_at: data[0].joined_at,
            city: data[0].city,
            state: data[0].state,
          }
          this._$profile.next(newProfile);
          return data;
        })
    );
  }
}
