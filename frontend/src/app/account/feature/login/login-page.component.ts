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
import { CredentialResponse, PromptMomentNotification } from 'google-one-tap';

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
  error?: string;
  constructor(
    private store: Store,
    private router: Router,
    private authService: AuthService,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    // @ts-ignore
    window.onGoogleLibraryLoad = () => {
      console.log("Google's One-tap sign in script loaded!");

      // @ts-ignore
      google.accounts.id.initialize({
        // Ref: https://developers.google.com/identity/gsi/web/reference/js-reference#IdConfiguration
        client_id:
          '911585064385-1ei5d9gdp9h1igf9hb7hqfqp466j6l0v.apps.googleusercontent.com',
        callback: this.handleSignInWithGoogle.bind(this), //this callback will use supabase method
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      // @ts-ignore
      google.accounts!.id.renderButton(document!.getElementById('g_loginBtn'), {
        theme: 'outline',
        size: 'large',
        type: 'icon',
        shape: 'rectangular',
        width: "100"
      });
      // @ts-ignore
      google.accounts.id.prompt();
    };
  }

  handleSignInWithGoogle(response: CredentialResponse) {
    // Extract the credential (token) from the response
    const token = response.credential;
    let decodedToken: any | null = null;
    try {
      decodedToken = JSON.parse(atob(token.split('.')[1]));
      console.log('Decoded token:', decodedToken);
    } catch (error) {
      console.log('Error decoding token:', error);
    }
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

  login_form = new FormGroup({
    email: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });

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
