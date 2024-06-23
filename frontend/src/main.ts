import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter, withRouterConfig } from '@angular/router';
import { routes } from './app/routes';
import { provideState, provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideEffects } from '@ngrx/effects';
import { importProvidersFrom } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import 'hammerjs';

// Services
import { authInterceptor } from './app/shared/utils/authInterceptor';

// NgRX Items
import { IngredientStockEffects } from './app/kitchen/feature/Inventory/feature/ingredient-inventory/state/ingredient-stock-effects';
import { IngredientEffects } from './app/kitchen/feature/ingredients/state/ingredient-effects';
import { sharedReducer } from './app/shared/state/shared-reducers';
import { kitchenReducer } from './app/kitchen/state/kitchen-reducers';
import { IngredientReducer } from './app/kitchen/feature/ingredients/state/ingredient-reducers';
import { ingredientStockReducer } from './app/kitchen/feature/Inventory/feature/ingredient-inventory/state/ingredient-stock-reducers';
import { ToolReducer } from './app/kitchen/feature/tools/state/tool-reducers';
import { ToolEffects } from './app/kitchen/feature/tools/state/tool-effects';
import { recipeCategoryReducer } from './app/recipes/state/recipe-category/recipe-category-reducers';
import { RecipeCategoryEffects } from './app/recipes/state/recipe-category/recipe-category-effects';
import { recipePageReducer } from './app/recipes/state/recipe-page-reducers';
import { RecipeEffects } from './app/recipes/state/recipe/recipe-effects';
import { recipeReducer } from './app/recipes/state/recipe/recipe-reducers';
import { RecipeIngredientReducer } from './app/recipes/state/recipe-ingredient/recipe-ingredient-reducers';
import { RecipeIngredientEffects } from './app/recipes/state/recipe-ingredient/recipe-ingredient-effects';
import { RecipeToolEffects } from './app/recipes/state/recipe-tool/recipe-tool-effects';
import { RecipeToolReducer } from './app/recipes/state/recipe-tool/recipe-tool-reducers';
import { StepReducer } from './app/recipes/state/step/step-reducers';
import { StepEffects } from './app/recipes/state/step/step-effects';
import { RecipeStepReducer } from './app/recipes/state/recipe-step/recipe-step-reducers';
import { RecipeStepEffects } from './app/recipes/state/recipe-step/recipe-step-effects';
import { ToolStockEffects } from './app/kitchen/feature/Inventory/feature/tool-inventory/state/tool-stock-effects';
import { ToolStockReducer } from './app/kitchen/feature/Inventory/feature/tool-inventory/state/tool-stock-reducers';
import { FriendshipReducer } from './app/social/state/friendship-reducers';
import { FriendshipEffects } from './app/social/state/friendship-effects';
import { FollowshipReducer } from './app/social/state/followship-reducers';
import { FollowshipEffects } from './app/social/state/followship-effects';
import { ProfileReducer } from './app/profile/state/profile-reducers';
import { ProfileEffects } from './app/profile/state/profile-effects';
import { ShoppingListEffects } from './app/groceries/state/shopping-list-effects';
import { ShoppingListReducer } from './app/groceries/state/shopping-list-reducers';
import { SharedShoppingListEffects } from './app/groceries/state/sharedShoppingLists/shared-shopping-list-effects';
import { SharedShoppingListReducer } from './app/groceries/state/sharedShoppingLists/shared-shopping-list-reducers';
import { ShoppingListRecipeEffects } from './app/groceries/state/shopping-list-recipe-effects';
import { ShoppingListRecipeReducer } from './app/groceries/state/shopping-list-recipe-reducers';
import { MatNativeDateModule } from '@angular/material/core';
import { ShoppingListIngredientReducer } from './app/groceries/state/shopping-list-ingredient-reducers';
import { ShoppingListIngredientEffects } from './app/groceries/state/shopping-list-ingredient-effects';
import { MessageReducer } from './app/footer/state/message-reducers';
import { MessageEffects } from './app/footer/state/message-effects';


bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideStore(),
    provideState('shared', sharedReducer),
    provideState('kitchen', kitchenReducer),
    provideState('ingredient', IngredientReducer),
    provideState('ingredientStock', ingredientStockReducer),
    provideState('tool', ToolReducer),
    provideState('toolStock', ToolStockReducer),
    provideState('recipeCategory', recipeCategoryReducer),
    provideState('recipePage', recipePageReducer),
    provideState('recipe', recipeReducer),
    provideState('recipeIngredient', RecipeIngredientReducer),
    provideState('recipeTool', RecipeToolReducer),
    provideState('step', StepReducer),
    provideState('recipeStep', RecipeStepReducer),
    provideState('friendship', FriendshipReducer),
    provideState('followship', FollowshipReducer),
    provideState('profile', ProfileReducer),
    provideState('shoppingList', ShoppingListReducer),
    provideState('shoppingListRecipe', ShoppingListRecipeReducer),
    provideState('sharedShoppingList', SharedShoppingListReducer),
    provideState('shoppingListIngredient', ShoppingListIngredientReducer),
    provideState('message', MessageReducer),
    provideEffects([
      IngredientEffects,
      IngredientStockEffects,
      ToolEffects,
      ToolStockEffects,
      RecipeCategoryEffects,
      RecipeEffects,
      RecipeIngredientEffects,
      RecipeToolEffects,
      StepEffects,
      RecipeStepEffects,
      FriendshipEffects,
      FollowshipEffects,
      ProfileEffects,
      ShoppingListEffects,
      SharedShoppingListEffects,
      ShoppingListRecipeEffects,
      ShoppingListIngredientEffects,
      MessageEffects,
    ]),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStoreDevtools({
      maxAge: 25, // Retains last 25 states
      logOnly: false, // Restrict extension to log-only mode
      autoPause: true, // Pauses recording actions and state changes when the extension window is not open
      trace: true, // If set to true, will include stack trace for every dispatched action
      traceLimit: 25, // maximum stack trace frames to be stored (in case trace option was provided as true)
    }),
    importProvidersFrom(
      MatDialogModule,
      MatFormFieldModule,
      ReactiveFormsModule,
      MatDatepickerModule,
      MatMomentDateModule,
      MatNativeDateModule,
      BrowserAnimationsModule
    ),
  ],
}).catch((err) => console.error(err));
