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
    MatInputModule
  ],
  templateUrl: './password-reset-page.component.html',
})
export class PasswordResetPageComponent {
  public isLoading: WritableSignal<boolean> = signal(false);
  successMessage: WritableSignal<string> = signal('');
  failureMessage: WritableSignal<string> = signal('');

  constructor(private authService: AuthService) {}

  password_reset_form = new FormGroup({
    newPassword: new FormControl('', []),
    confirmPassword: new FormControl('', []),
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
