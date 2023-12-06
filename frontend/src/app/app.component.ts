import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppHeaderComponent } from './header/feature/app-header.component';
import { Router } from '@angular/router';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { Store } from '@ngrx/store';
import { RecipeActions } from './recipes/state/recipe/recipe-actions';
import { RecipeCategoryActions } from './recipes/state/recipe-category/recipe-category-actions';
import { IngredientActions } from './kitchen/feature/ingredients/state/ingredient-actions';
import { IngredientStockActions } from './kitchen/feature/Inventory/feature/ingredient-inventory/state/ingredient-stock-actions';
import { ToolActions } from './kitchen/feature/tools/state/tool-actions';
import { StepActions } from './recipes/state/step/step-actions';
import { FriendshipActions } from './social/state/friendship-actions';
import { FollowshipActions } from './social/state/followship-actions';
import { ProfileActions } from './profile/state/profile-actions';
import { RecipeIngredientActions } from './recipes/state/recipe-ingredient/recipe-ingredient-actions';
import { ToolStockActions } from './kitchen/feature/Inventory/feature/tool-inventory/state/tool-stock-actions';
import { RecipeToolActions } from './recipes/state/recipe-tool/recipe-tool-actions';
import { RecipeStepActions } from './recipes/state/recipe-step/recipe-step-actions';
@Component({
  standalone: true,
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterModule,
    AppHeaderComponent,
    StoreDevtoolsModule,
  ],
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'frontend';

  constructor(public store: Store) {}

  ngOnInit() {
    //** LOAD STATE **
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
  }

}
