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
import { AutofocusDirective } from 'src/app/shared/utils/autofocusDirective';
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
import { FacebookLogin } from '@capacitor-community/facebook-login';
import { AuthError } from '@supabase/supabase-js';
import { ExtraStuffService } from 'src/app/shared/utils/extraStuffService';
import { selectProfile } from 'src/app/profile/state/profile-selectors';

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
    AutofocusDirective,
  ],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
})
export class LoginPageComponent {
  imagePlaceholder: string = '/assets/icons/logo-primary-dark.svg';
  public isWeb: WritableSignal<boolean> = signal(false);
  public isLoading: WritableSignal<boolean> = signal(false);
  public loginFailureMessage: WritableSignal<string> = signal('');
  public darkMode: WritableSignal<boolean> = signal(true);
  showPasswordReset: WritableSignal<boolean> = signal(false);
  successMessage: WritableSignal<string> = signal('');
  public profile: WritableSignal<any> = signal(null);
  rememberMe: WritableSignal<boolean> = signal(false);
  submitted = false;
  constructor(
    private store: Store,
    private router: Router,
    private authService: AuthService,
    private ngZone: NgZone,
    public extraStuffService: ExtraStuffService
  ) {
    effect(
      () => {
        const systemDarkMode = this.extraStuffService.systemDarkMode();
        const profile = this.authService.profile();
        if (profile && profile.user_id) {
          if (this.router.url !== '/reset-password') {
            if (
              !this.router.url.includes('admin=true') &&
              !Capacitor.isNativePlatform()
            ) {
              this.router.navigate(['/web']);
            } else {
              this.router.navigate(['/loading']);
            }
          }
        }
        if (!profile) {
          this.darkMode.set(systemDarkMode);
          return;
        }
        if (profile.darkMode === 'Enabled') {
          this.darkMode.set(true);
        } else if (profile.darkMode === 'Disabled') {
          this.darkMode.set(false);
        } else if (profile.darkMode === 'System Default' && systemDarkMode) {
          this.darkMode.set(true);
        } else if (profile.darkMode === 'System Default' && !systemDarkMode) {
          this.darkMode.set(false);
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit() {
    if (
      !this.router.url.includes('admin=true') &&
      !Capacitor.isNativePlatform()
    ) {
      this.router.navigate(['/web']);
    }
    this.store.select(selectProfile).subscribe((profile) => {
      if (!profile) return;
      this.profile.set(profile);
    });
    // Check for persistent session (remember me)
    // const sessionData = this.authService.getPersistentSession();
    // if (sessionData) {
    //   this.authService.setSession(
    //     sessionData.access_token,
    //     sessionData.refresh_token
    //   );
    // }
    // Listen for changes in the email form control
    this.login_form.get('email')?.valueChanges.subscribe((value) => {
      // Check if the email is valid
      const isValidEmail = this.login_form.get('email')?.valid;
      // Set showPasswordReset based on the email validity
      this.showPasswordReset.set(isValidEmail && value ? true : false);
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

  ngAfterViewInit(): void {
    // check document for 'dark' class to determine if dark mode is enabled
    if (!document.body.classList.contains('dark')) {
      this.imagePlaceholder = '/assets/icons/logo-primary-light.svg';
    }
  }

  public async signInWithGoogle() {
    this.isLoading.set(true);
    this.ngZone.run(() => {
      this.authService
        .signInWithGoogle()
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
    if (!this.showPasswordReset()) {
      return;
    }
    this.isLoading.set(true);
    this.loginFailureMessage.set('');
    this.successMessage.set('');
    const result = await this.authService.resetPassword(
      this.login_form.get('email')?.value!
    );
    if (result === 'success') {
      this.successMessage.set(
        'If email account exists, a reset link has been sent to your inbox. This might take up to 10 minutes.'
      );
      this.isLoading.set(false);
    } else {
      this.loginFailureMessage.set(
        'Could not generate a new reset link. Please try again or check your email folders for an existing one.'
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
        // this.rememberMe()
        false
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
