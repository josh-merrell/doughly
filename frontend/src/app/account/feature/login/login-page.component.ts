import {
  Component,
  NgZone,
  WritableSignal,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLinkWithHref } from '@angular/router';
import { AuthService } from '../../../shared/utils/authenticationService';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { Store } from '@ngrx/store';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import {
  FacebookLogin,
  FacebookLoginResponse,
} from '@capacitor-community/facebook-login';
import { AuthError } from '@supabase/supabase-js';

declare const google: any;
@Component({
  selector: 'dl-login-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLinkWithHref,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatInputModule,
  ],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
})
export class LoginPageComponent {
  public isWeb: WritableSignal<boolean> = signal(false);
  public isLoading: WritableSignal<boolean> = signal(false);
  public loginFailureMessage: WritableSignal<string> = signal('');
  showPasswordReset: WritableSignal<boolean> = signal(false);
  successMessage: WritableSignal<string> = signal('');
  rememberMe: WritableSignal<boolean> = signal(false);
  submitted = false;
  constructor(
    private store: Store,
    private router: Router,
    private authService: AuthService,
    private ngZone: NgZone
  ) {
    effect(() => {
      const profile = this.authService.profile();
      if (profile) {
        this.router.navigate(['/loading']);
      }
    });
  }

  ngOnInit() {
    // Check for persistent session (remember me)
    const sessionData = this.authService.getPersistentSession();
    if (sessionData) {
      this.authService.setSession(
        sessionData.access_token,
        sessionData.refresh_token
      );
    }
    // Listen for changes in the email form control
    this.login_form.get('email')?.valueChanges.subscribe((value) => {
      // Check if the email is valid
      const isValidEmail = this.login_form.get('email')?.valid;
      // Set showPasswordReset based on the email validity
      this.showPasswordReset.set(isValidEmail && value ? true : false);
    });

    // for google login on all platforms
    GoogleAuth.initialize({
      clientId:
        '911585064385-1ei5d9gdp9h1igf9hb7hqfqp466j6l0v.apps.googleusercontent.com',
      scopes: ['email', 'profile'],
      grantOfflineAccess: true,
    });

    // for facebook login on all platforms
    FacebookLogin.initialize({
      appId: '399157002973005',
    });

    // for web
    if (!Capacitor.isNativePlatform()) {
      // this.initGoogleSignIn();
      this.isWeb.set(true);
    }

    // for mobile
    if (Capacitor.isNativePlatform()) {
    }
  }

  public async signInWithGoogle() {
    this.isLoading.set(true);
    const googleUser = await GoogleAuth.signIn();
    const token = googleUser.authentication.idToken;
    this.ngZone.run(() => {
      this.authService
        .signInWithGoogle(token)
        .then(() => {
          // Handle successful sign in
          this.router.navigate(['/loading']);
        })
        .catch((error) => {
          // Handle sign in error
          this.loginFailureMessage.set(error.message);
        });
    });
  }

  public async signInWithFacebook() {
    this.isLoading.set(true);
    if (this.isWeb()) {
    }
    this.ngZone.run(() => {
      this.authService
        .signInWithFacebook()
        .then(() => {
          // Handle successful sign in
          this.router.navigate(['/loading']);
        })
        .catch((error) => {
          // Handle sign in error
          this.loginFailureMessage = error.message;
        });
    });
  }

  public async signInWithApple() {
    this.isLoading.set(true);
    this.ngZone.run(() => {
      this.authService
        .signInWithApple()
        .then(() => {
          // Handle successful sign in
          this.router.navigate(['/loading']);
        })
        .catch((error) => {
          // Handle sign in error
          this.loginFailureMessage = error.message;
        });
    });
  }

  login_form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

  async resetPassword() {
    this.isLoading.set(true);
    this.loginFailureMessage.set('');
    this.successMessage.set('');
    const result = await this.authService.resetPassword(
      this.login_form.get('email')?.value!
    );
    if (result === 'success') {
      this.successMessage.set(
        'If email account exists, a reset link has been sent to your inbox.'
      );
      this.isLoading.set(false);
    } else {
      this.loginFailureMessage.set(
        'An error occurred while sending the reset link. Please try again.'
      );
      this.isLoading.set(false);
    }
  }

  async onSubmit() {
    this.loginFailureMessage.set('');
    this.submitted = true; // Set this to true on submission
    if (this.login_form.valid) {
      this.loginFailureMessage.set('');

      const { email, password } = this.login_form.value;
      const loginResult = await this.authService.signIn(
        email!,
        password!,
        this.rememberMe()
      );
      if (loginResult instanceof AuthError) {
        if (loginResult.message === 'Invalid login credentials') {
          this.loginFailureMessage.set(
            `No account found with that email and password`
          );
        } else {
          this.loginFailureMessage.set(
            `An error occurred while logging in. Please try again.`
          );
        }
      }
    }
  }

  toggleRememberMe() {
    this.rememberMe.set(!this.rememberMe());
  }
}
