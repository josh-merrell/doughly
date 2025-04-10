import { Component, NgZone, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLinkWithHref } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AutofocusDirective } from 'src/app/shared/utils/autofocusDirective';
import { AuthService } from '../../../shared/utils/authenticationService';
import { Capacitor } from '@capacitor/core';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { catchError, debounceTime, map, of, startWith, switchMap } from 'rxjs';

@Component({
  selector: 'dl-signup-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    RouterLinkWithHref,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    AutofocusDirective,
  ],
  templateUrl: './signup-page.component.html',
  styleUrls: ['./signup-page.component.scss'],
})
export class SignupPageComponent {
  imagePlaceholder: string = '/assets/icons/logo-primary-dark.svg';
  checkEmailMessage: WritableSignal<string> = signal('');
  emailErrorMessage: WritableSignal<string> = signal('');
  usernameErrorMessage: WritableSignal<string> = signal('');
  isLoading: WritableSignal<boolean> = signal(false);
  signUpFailureMessage: WritableSignal<string> = signal('');
  constructor(
    private ngZone: NgZone,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.signup_form
      .get('email')
      ?.valueChanges.pipe(
        debounceTime(300), // Add debounceTime here
        startWith(''), // To initialize the value
        switchMap((email) => {
          if (!email || this.signup_form.get('email')?.pristine) {
            return of(''); // Return an observable of empty string when no need to check
          } else {
            return this.authService.isEmailUnique(email).pipe(
              catchError((error) => {
                console.error('Error checking email uniqueness', error);
                return of(false); // Assume email is not unique in case of error
              })
            );
          }
        })
      )
      .subscribe((isUnique) => {
        if (isUnique === '') {
          this.emailErrorMessage.set('');
        } else if (this.signup_form.get('email')?.errors?.['email']) {
          this.emailErrorMessage.set('Invalid email address');
        } else if (isUnique) {
          this.emailErrorMessage.set('');
        } else {
          this.emailErrorMessage.set('Account with this email already exists');
        }
      });
    const usernameControl = this.signup_form.get('username');
    if (usernameControl) {
      usernameControl.valueChanges
        .pipe(
          startWith(usernameControl.value), // Emit the current value immediately
          debounceTime(300),
          switchMap((value) => {
            const uniqueCheck = this.authService
              .isUsernameUnique(value ?? '')
              .pipe(catchError(() => of(false)));

            const isValid = this.authService.isUsernameValid(value ?? '');

            return uniqueCheck.pipe(
              map((isUnique) => {
                return { isUnique, isValid };
              })
            );
          })
        )
        .subscribe(({ isUnique, isValid }) => {
          if (usernameControl.pristine || usernameControl.value === '') {
            this.usernameErrorMessage.set('');
            return;
          }
          if (isUnique && isValid) {
            this.usernameErrorMessage.set('');
          } else {
            if (!isUnique) {
              this.usernameErrorMessage.set('Username is already taken');
            } else if (!isValid) {
              this.usernameErrorMessage.set(
                'Username must be at least 5 characters long and contain only letters, numbers, and underscores.'
              );
            }
          }
        });
    }
  }

  signup_form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
    ]),
    username: new FormControl('', [Validators.required]),
  });

  error?: string;

  ngAfterViewInit(): void {
    // check document for 'dark' class to determine if dark mode is enabled
    if (!document.body.classList.contains('dark')) {
      this.imagePlaceholder = '/assets/icons/logo-primary-light.svg';
    }
  }

  onSubmit() {
    this.signUpFailureMessage.set('');
    if (this.signup_form.valid) {
      delete this.error;

      const { email, password, username } = this.signup_form.value;
      this.authService.signUp(email!, password!, username!);
    }
    this.checkEmailMessage.set('Check your email to verify your account');
  }

  public async signUpWithGoogle() {
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
          this.signUpFailureMessage.set(error.message);
        });
    });
  }

  public async signUpWithFacebook() {
    this.isLoading.set(true);
    this.ngZone.run(() => {
      this.authService
        .signInWithFacebook()
        .then(() => {
          // Handle successful sign in
          this.router.navigate(['/loading']);
        })
        .catch((error) => {
          // Handle sign in error
          this.signUpFailureMessage = error.message;
        });
    });
  }

  public async appleClick() {
    // if native and ios, use signInWithAppleNative. If android, use signInWithApple
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
      this.signUpWithAppleNative();
    } else {
      this.signUpWithApple();
    }
  }

  public async signUpWithApple() {
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
          this.signUpFailureMessage = error.message;
        });
    });
  }

  public async signUpWithAppleNative() {
    this.isLoading.set(true);
    this.ngZone.run(() => {
      this.authService
        .signInWithAppleNative()
        .then(() => {
          // Handle successful sign in
          this.router.navigate(['/loading']);
        })
        .catch((error) => {
          // Handle sign in error
          this.signUpFailureMessage = error.message;
        });
    });
  }
}
