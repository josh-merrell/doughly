import { Component, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthService } from 'src/app/shared/utils/authenticationService';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'dl-password-reset-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatInputModule,
  ],
  templateUrl: './password-reset-page.component.html',
})
export class PasswordResetPageComponent {
  public isLoading: WritableSignal<boolean> = signal(false);
  successMessage: WritableSignal<string> = signal('');
  failureMessage: WritableSignal<string> = signal('');
  confirmPasswordErrorMessage: WritableSignal<string> = signal('');
  newPasswordErrorMessage: WritableSignal<string> = signal('');

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.password_reset_form
      .get('confirmPassword')
      ?.valueChanges.subscribe(() => {
        if (
          this.password_reset_form.get('newPassword')?.value !==
          this.password_reset_form.get('confirmPassword')?.value
        ) {
          this.confirmPasswordErrorMessage.set('Passwords do not match');
        } else if (
          this.password_reset_form.get('confirmPassword')?.errors?.['minlength']
        ) {
          this.confirmPasswordErrorMessage.set(
            'Minimum password length is 6 characters.'
          );
        } else {
          this.confirmPasswordErrorMessage.set('');
        }
      });

    this.password_reset_form.get('newPassword')?.valueChanges.subscribe(() => {
      if (
        this.password_reset_form.get('newPassword')?.value !==
        this.password_reset_form.get('confirmPassword')?.value
      ) {
        this.newPasswordErrorMessage.set('Passwords do not match');
      } else if (
        this.password_reset_form.get('newPassword')?.errors?.['minlength']
      ) {
        this.newPasswordErrorMessage.set(
          'Minimum password length is 6 characters.'
        );
      } else {
        this.newPasswordErrorMessage.set('');
      }
    });
  }

  password_reset_form = new FormGroup({
    newPassword: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
    ]),
    confirmPassword: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

  onSubmit() {
    this.isLoading.set(true);
    if (
      this.password_reset_form.value.newPassword &&
      this.password_reset_form.value.confirmPassword &&
      this.password_reset_form.value.newPassword ===
        this.password_reset_form.value.confirmPassword
    ) {
      this.authService.updateUser(this.password_reset_form.value.newPassword);
    }
  }
}
