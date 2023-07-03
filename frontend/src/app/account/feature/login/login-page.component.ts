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
  selector: 'dl-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLinkWithHref],
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {
  constructor(private router: Router, private authService: AuthService) {}

  login_form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  error?: string;

  onSubmit() {
    if (this.login_form.valid) {
      delete this.error;

      const { email, password } = this.login_form.value;
      this.authService
        .signIn(email!, password!)
        .then(() => {
          this.router.navigate(['/kitchen']);
        })
        .catch((error) => {
          this.error = error.message;
        });
    }
  }
}
