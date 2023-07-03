import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLinkWithHref } from '@angular/router';
import { AuthService } from '../../../shared/utils/authenticationService';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'dl-signup-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLinkWithHref],
  templateUrl: './signup-page.component.html',
})
export class SignupPageComponent {
  constructor(private router: Router, private authService: AuthService) {}

  signup_form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  error?: string;

  onSubmit() {
    if (this.signup_form.valid) {
      delete this.error;

      const { email, password } = this.signup_form.value;
      this.authService
        .signUp(email!, password!)
        .then(() => {
          this.router.navigate(['/verify-account']);
        })
        .catch((error) => {
          this.error = error.message;
        });
    }
  }
}
