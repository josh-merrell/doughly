import { Component, NgZone } from '@angular/core';
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

// Actions for loading state
import { RecipeActions } from '../../.././recipes/state/recipe/recipe-actions';
import { RecipeCategoryActions } from '../../.././recipes/state/recipe-category/recipe-category-actions';
import { IngredientActions } from '../../.././kitchen/feature/ingredients/state/ingredient-actions';
import { IngredientStockActions } from '../../.././kitchen/feature/Inventory/feature/ingredient-inventory/state/ingredient-stock-actions';
import { ToolActions } from '../../.././kitchen/feature/tools/state/tool-actions';
import { StepActions } from '../../.././recipes/state/step/step-actions';
import { FriendshipActions } from '../../.././social/state/friendship-actions';
import { FollowshipActions } from '../../.././social/state/followship-actions';
import { ProfileActions } from '../../.././profile/state/profile-actions';
import { RecipeIngredientActions } from '../../.././recipes/state/recipe-ingredient/recipe-ingredient-actions';
import { ToolStockActions } from '../../.././kitchen/feature/Inventory/feature/tool-inventory/state/tool-stock-actions';
import { RecipeToolActions } from '../../.././recipes/state/recipe-tool/recipe-tool-actions';
import { RecipeStepActions } from '../../.././recipes/state/recipe-step/recipe-step-actions';
import { ShoppingListActions } from '../../.././groceries/state/shopping-list-actions';

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
  private googleScriptId = 'google-signin-script';
  constructor(
    private store: Store,
    private router: Router,
    private authService: AuthService,
    private ngZone: NgZone
  ) {
    // Expose the Google Login callback function to the global scope
    window['handleSignInWithGoogle'] = (response) =>
      this.handleSignInWithGoogle(response);
  }

  ngOnInit() {
    this.loadGoogleSignInScript();
  }

  ngOnDestroy() {
    this.removeGoogleSignInScript();
  }

  handleSignInWithGoogle(response: any) {
    // Extract the credential (token) from the response
    const token = response.credential;

    // Optional: You might want to handle nonce here if you use it

    // Use the token to sign in with Supabase
    this.ngZone.run(() => {
      this.authService
        .signInWithGoogle(token)
        .then(() => {
          // Handle successful sign in
          this.loadState();
          this.router.navigate(['/recipes']);
        })
        .catch((error) => {
          // Handle sign in error
          this.error = error.message;
        });
    });
  }

  private loadGoogleSignInScript() {
    if (document.getElementById(this.googleScriptId)) {
      // If the script is already present, there's no need to load it again
      return;
    }

    const scriptElement = document.createElement('script');
    scriptElement.src = 'https://accounts.google.com/gsi/client';
    scriptElement.async = true;
    scriptElement.defer = true;
    scriptElement.id = this.googleScriptId;
    document.body.appendChild(scriptElement);

    scriptElement.onload = () => {
      // Initialize the Google sign-in functionality here, if needed
      // For example:
      // google.accounts.id.initialize({
      //   client_id: '911585064385-1ei5d9gdp9h1igf9hb7hqfqp466j6l0v.apps.googleusercontent.com',
      //   callback: (response) => this.handleSignInWithGoogle(response)
      // });
    };
  }

  private removeGoogleSignInScript() {
    const scriptElement = document.getElementById(this.googleScriptId);
    if (scriptElement) {
      document.body.removeChild(scriptElement);
    }
  }

  login_form = new FormGroup({
    // email: new FormControl('', [Validators.required, Validators.email]),
    email: new FormControl('', [Validators.required]),
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
          this.loadState();
          this.router.navigate(['/recipes']);
        })
        .catch((error) => {
          this.error = error.message;
        });
    }
  }

  loadState() {
    //--kitchen
    this.store.dispatch(IngredientActions.loadIngredients());
    this.store.dispatch(IngredientStockActions.loadIngredientStocks());
    this.store.dispatch(ToolActions.loadTools());
    this.store.dispatch(ToolStockActions.loadToolStocks());

    //--recipes
    this.store.dispatch(RecipeActions.loadRecipes());
    this.store.dispatch(RecipeCategoryActions.loadRecipeCategories());
    this.store.dispatch(RecipeActions.loadRecipeSubscriptions());
    this.store.dispatch(RecipeIngredientActions.loadRecipeIngredients());
    this.store.dispatch(RecipeToolActions.loadRecipeTools());
    this.store.dispatch(StepActions.loadSteps());
    this.store.dispatch(RecipeStepActions.loadRecipeSteps());

    //--social
    this.store.dispatch(FriendshipActions.loadFriendships());
    this.store.dispatch(FollowshipActions.loadFollowships());
    this.store.dispatch(FollowshipActions.loadFollowers());
    this.store.dispatch(ProfileActions.loadFollowers());
    this.store.dispatch(ProfileActions.loadFollowing());
    this.store.dispatch(ProfileActions.loadProfile({}));
    this.store.dispatch(ProfileActions.loadFriends());
    this.store.dispatch(ProfileActions.loadFriendRequests());
    this.store.dispatch(ProfileActions.loadFriendRequestsSent());

    //--shopping
    this.store.dispatch(ShoppingListActions.loadShoppingLists());
  }
}
