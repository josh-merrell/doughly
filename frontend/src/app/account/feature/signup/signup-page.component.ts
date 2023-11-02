import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLinkWithHref } from '@angular/router';
import { AuthService, Profile } from '../../../shared/utils/authenticationService';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import {
  catchError,
  debounceTime,
  forkJoin,
  from,
  map,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';

@Component({
  selector: 'dl-signup-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLinkWithHref, MatFormFieldModule, MatSelectModule, MatInputModule],
  templateUrl: './signup-page.component.html',
})
export class SignupPageComponent {
  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    const usernameControl = this.signup_form.get('username');
    usernameControl!.setErrors({ default: true });
    if (usernameControl) {
      usernameControl.valueChanges
        .pipe(
          startWith(usernameControl.value), // Emit the current value immediately
          tap(() => {
            usernameControl.setErrors({ checking: true }); // Set error to true immediately
          }),
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
          if (isUnique && isValid) {
            usernameControl.setErrors(null);
          } else {
            if (!isUnique) {
              usernameControl.setErrors({ invalidUnique: true });
            } else if (!isValid) {
              usernameControl.setErrors({ invalidValid: true });
            }
          }
        });
    }
  }

  signup_form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
    username: new FormControl('', [Validators.required]),
  });

  error?: string;

  onSubmit() {
    if (this.signup_form.valid) {
      delete this.error;

      const { email, password, username } = this.signup_form.value;
      this.authService
        .signUp(email!, password!, username!)
        .then(() => {
          this.router.navigate(['/kitchen']);
        })
        .catch((error) => {
          this.error = error.message;
        });
    }
  }
}
