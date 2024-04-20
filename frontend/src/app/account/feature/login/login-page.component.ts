import { Component, NgZone, WritableSignal, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLinkWithHref } from '@angular/router';
import { AuthService } from '../../../shared/utils/authenticationService';
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

declare const google: any;
@Component({
  selector: 'dl-login-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLinkWithHref,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
  ],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
})
export class LoginPageComponent {
  public isWeb: WritableSignal<boolean> = signal(false);
  error?: string;
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
    })
  }

  ngOnInit() {
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
          this.error = error.message;
        });
    });
  }

  public async signInWithFacebook() {
    // const FACEBOOK_PERMISSIONS = ['email', 'public_profile'];
    // const facebookUser = await FacebookLogin.login({
    //   permissions: FACEBOOK_PERMISSIONS,
    // });
    // console.log(`FACEBOOK USER: ${JSON.stringify(facebookUser)}`);
    // if (facebookUser.accessToken === null) {
    //   return;
    // }
    // const token = facebookUser.accessToken.token;
    this.ngZone.run(() => {
      this.authService
        .signInWithFacebook()
        .then(() => {
          // Handle successful sign in
          this.router.navigate(['/loading']);
        })
        .catch((error) => {
          // Handle sign in error
          this.error = error.message;
        });
    });
  }
  
  public async signInWithApple() {
    this.ngZone.run(() => {
      this.authService
        .signInWithApple()
        .then(() => {
          // Handle successful sign in
          this.router.navigate(['/loading']);
        })
        .catch((error) => {
          // Handle sign in error
          this.error = error.message;
        });
    
    });
  }

  login_form = new FormGroup({
    email: new FormControl('', []),
    password: new FormControl('', []),
  });


  onSubmit() {
    this.submitted = true; // Set this to true on submission
    if (this.login_form.valid) {
      delete this.error;

      const { email, password } = this.login_form.value;
      this.authService
        .signIn(email!, password!)
    }
  }
}
