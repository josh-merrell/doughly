import { Injectable } from '@angular/core';
import { RealtimeChannel, Session, User } from '@supabase/supabase-js';
import { BehaviorSubject, first, Observable, skipWhile, tap } from 'rxjs';
import { SupabaseService } from './supabase.service';

export interface Profile {
  user_id: string;
  photo_url: string;
  email: string;
  name_first: string;
  name_last: string;
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
  private user_id?: string;

  // Profile state
  private _$profile = new BehaviorSubject<Profile | null | undefined>(
    undefined
  );
  $profile = this._$profile.pipe(
    skipWhile((_) => typeof _ === 'undefined')
  ) as Observable<Profile | null>;
  private profile_subscription?: RealtimeChannel;

  isProfile(obj: any): obj is Profile {
    return (
      obj &&
      typeof obj.user_id === 'string' &&
      typeof obj.email === 'string'
    );
  }

  constructor(private supabase: SupabaseService) {
    // console.trace(`AUTHSERVICE INVOKED`)

    // Check the current session on initialization
    this.supabase.client.auth.getSession().then(({ data, error }) => {
      if (data && data.session && !error) {
        this.handleAuthStateChange('SIGNED_IN', data.session);
      }
    });
    // Listen for future auth state changes
    this.supabase.client.auth.onAuthStateChange(
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
          this.supabase.client
            .from('profiles')
            .select('*')
            .match({ user_id: user_id })
            .single()
            .then((res) => {
              // Update our profile BehaviorSubject with the current value
              this._$profile.next(this.isProfile(res.data) ? res.data : null);

              // Listen to any changes to our user's profile using Supabase Realtime
              this.profile_subscription = this.supabase.client
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
          this.supabase.client
            .removeChannel(this.profile_subscription)
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
    const { data, error } = await this.supabase.client.auth.getUser(
      session.access_token
    );
    if (error || !data) return null;
    return data.user;
  }

  private getUserProfile(user_id: string, session: Session) {
    // One-time API call to Supabase to get the user's profile
    this.supabase.client
      .from('profiles')
      .select('*')
      .match({ user_id: user_id })
      .single()
      .then((res) => {
        if (res.data && this.isProfile(res.data)) {
          // If profile exists, update our profile BehaviorSubject
          this._$profile.next(res.data);

          // Initialize profile_subscription
          this.profile_subscription = this.supabase.client
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
      console.error('Error getting user details from session');
      return;
    }

    // check whether the user_id exists in the profiles table
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .match({ user_id: user_id })
      .single();

    // Define the new profile based on the user details
    const newProfile = {
      user_id: newUser.id,
      email: newUser.email,
    };

    // Insert the new profile into the profiles table if it the user_id is not yet present
    if (error || !data) {
      this.supabase.client
        .from('profiles')
        .insert(newProfile)
        .then(({ data, error }) => {
          if (error && error.code !== '406') {
            console.error('Error creating new profile:', error);
            return;
          }
          this._$profile.next(data);
        });
    }
    // Initialize profile_subscription
    this.profile_subscription = this.supabase.client
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
      this.supabase.client
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
      this.supabase.client.auth
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

  signUp(email: string, password: string) {
    return new Promise<void>((resolve, reject) => {
      // Set _$profile back to undefined. This will mean that $profile will wait to emit a value
      this._$profile.next(undefined);
      this.supabase.client.auth
        .signUp({ email, password })
        .then(({ data, error }) => {
          if (error || !data) reject('Invalid email/password combination');
          resolve();
        });
    });
  }

  logout() {
    return this.supabase.client.auth.signOut();
  }
}
