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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { Store } from '@ngrx/store';

// State Hydration Imports
import { IngredientActions } from '../../../kitchen/feature/ingredients/state/ingredient-actions';
import { IngredientStockActions } from '../../../kitchen/feature/Inventory/feature/ingredient-inventory/state/ingredient-stock-actions';
import { ToolActions } from '../../../kitchen/feature/tools/state/tool-actions';
import { StepActions } from '../../../recipes/state/step/step-actions';

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
})
export class LoginPageComponent {
  constructor(private store: Store, private router: Router, private authService: AuthService) {}

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
          //hydrate data, then redirect
          // this.store.dispatch(IngredientActions.loadIngredients());
          // this.store.dispatch(IngredientStockActions.loadIngredientStocks());
          // this.store.dispatch(ToolActions.loadTools());
          //this.store.dispatch(ToolStockActions.loadToolStocks());
          // this.store.dispatch(StepActions.loadSteps());

          this.router.navigate(['/home']);
        })
        .catch((error) => {
          this.error = error.message;
        });
    }
  }
}
