import { CommonModule } from '@angular/common';
import { Component, WritableSignal, effect, signal } from '@angular/core';
import { Router, RouterLinkWithHref } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Actions for loading state
import { RecipeActions } from '../../.././recipes/state/recipe/recipe-actions';
import {
  selectLoading as selectRecipeLoading,
  selectError as selectRecipeError,
} from '../../.././recipes/state/recipe/recipe-selectors';

import { RecipeCategoryActions } from '../../.././recipes/state/recipe-category/recipe-category-actions';
import {
  selectLoading as selectRecipeCategoryLoading,
  selectError as selectRecipeCategoryError,
} from '../../.././recipes/state/recipe-category/recipe-category-selectors';

import { IngredientActions } from '../../.././kitchen/feature/ingredients/state/ingredient-actions';
import {
  selectLoading as selectIngredientLoading,
  selectError as selectIngredientError,
} from '../../.././kitchen/feature/ingredients/state/ingredient-selectors';

import { IngredientStockActions } from '../../.././kitchen/feature/Inventory/feature/ingredient-inventory/state/ingredient-stock-actions';
import {
  selectLoading as selectIngredientStockLoading,
  selectError as selectIngredientStockError,
} from '../../.././kitchen/feature/Inventory/feature/ingredient-inventory/state/ingredient-stock-selectors';

import { ToolActions } from '../../.././kitchen/feature/tools/state/tool-actions';
import {
  selectLoading as selectToolLoading,
  selectError as selectToolError,
} from '../../.././kitchen/feature/tools/state/tool-selectors';

import { StepActions } from '../../.././recipes/state/step/step-actions';
import {
  selectLoading as selectStepLoading,
  selectError as selectStepError,
} from '../../.././recipes/state/step/step-selectors';

import { FriendshipActions } from '../../.././social/state/friendship-actions';
import {
  selectLoading as selectFriendshipLoading,
  selectError as selectFriendshipError,
} from '../../.././social/state/friendship-selectors';

import { FollowshipActions } from '../../.././social/state/followship-actions';
import {
  selectLoading as selectFollowshipLoading,
  selectError as selectFollowshipError,
} from '../../.././social/state/followship-selectors';

import { ProfileActions } from '../../.././profile/state/profile-actions';
import {
  selectLoading as selectProfileLoading,
  selectError as selectProfileError,
} from '../../.././profile/state/profile-selectors';

import { RecipeIngredientActions } from '../../.././recipes/state/recipe-ingredient/recipe-ingredient-actions';
import {
  selectLoading as selectRecipeIngredientLoading,
  selectError as selectRecipeIngredientError,
} from '../../.././recipes/state/recipe-ingredient/recipe-ingredient-selectors';

import { ToolStockActions } from '../../.././kitchen/feature/Inventory/feature/tool-inventory/state/tool-stock-actions';
import {
  selectLoading as selectToolStockLoading,
  selectError as selectToolStockError,
} from '../../.././kitchen/feature/Inventory/feature/tool-inventory/state/tool-stock-selectors';

import { RecipeToolActions } from '../../.././recipes/state/recipe-tool/recipe-tool-actions';
import {
  selectLoading as selectRecipeToolLoading,
  selectError as selectRecipeToolError,
} from '../../.././recipes/state/recipe-tool/recipe-tool-selectors';

import { RecipeStepActions } from '../../.././recipes/state/recipe-step/recipe-step-actions';
import {
  selectLoadingRecipeStep,
  selectErrorRecipeStep,
} from '../../.././recipes/state/recipe-step/recipe-step-selectors';

import { ShoppingListActions } from '../../.././groceries/state/shopping-list-actions';
import {
  selectLoading as selectShoppingListLoading,
  selectError as selectShoppingListError,
} from '../../.././groceries/state/shopping-list-selectors';

import { ShoppingListRecipeActions } from 'src/app/groceries/state/shopping-list-recipe-actions';
import {
  selectLoading as selectShoppingListRecipeLoading,
  selectError as selectShoppingListRecipeError,
} from 'src/app/groceries/state/shopping-list-recipe-selectors';

import { MessageActions } from 'src/app/footer/state/message-actions';
import {
  selectLoading as selectMessageLoading,
  selectError as selectMessageError,
} from 'src/app/footer/state/message-selectors';
import { Subscription, timer } from 'rxjs';

@Component({
  selector: 'dl-loading-page',
  standalone: true,
  imports: [CommonModule, RouterLinkWithHref, MatProgressSpinnerModule],
  templateUrl: './loading-page.component.html',
})
export class LoadingPageComponent {
  //this.router.navigate(['/recipes/loading']);
  public isLoadingGlobal: WritableSignal<boolean> = signal(true);
  private isLoadingMessage: WritableSignal<boolean> = signal(true);
  private isLoadingIngredient: WritableSignal<boolean> = signal(true);
  private isLoadingIngredientStock: WritableSignal<boolean> = signal(true);
  private isLoadingTool: WritableSignal<boolean> = signal(true);
  private isLoadingToolStock: WritableSignal<boolean> = signal(true);
  private isLoadingRecipe: WritableSignal<boolean> = signal(true);
  private isLoadingRecipeCategory: WritableSignal<boolean> = signal(true);
  private isLoadingRecipeIngredient: WritableSignal<boolean> = signal(true);
  private isLoadingRecipeTool: WritableSignal<boolean> = signal(true);
  private isLoadingStep: WritableSignal<boolean> = signal(true);
  private isLoadingRecipeStep: WritableSignal<boolean> = signal(true);
  private isLoadingFriendship: WritableSignal<boolean> = signal(true);
  private isLoadingFollowship: WritableSignal<boolean> = signal(true);
  private isLoadingProfile: WritableSignal<boolean> = signal(true);
  6;
  private isLoadingShoppingList: WritableSignal<boolean> = signal(true);
  private isLoadingShoppingListRecipe: WritableSignal<boolean> = signal(true);

  private timeoutSubscription!: Subscription;
  
  constructor(private store: Store, private router: Router) {
    effect(() => {
      if (!this.isLoadingGlobal()) {
        console.log("Loading completed before timeout.");
        this.timeoutSubscription.unsubscribe();
      }
    });

    effect(() => {
      const isLoading = this.isLoadingGlobal();
      if (!isLoading) {
        this.router.navigate(['/tempRoute'], { onSameUrlNavigation: 'reload' })
      }
    });

    effect(
      () => {
        const isLoadingMessage = this.isLoadingMessage();
        const isLoadingIngredient = this.isLoadingIngredient();
        const isLoadingIngredientStock = this.isLoadingIngredientStock();
        const isLoadingTool = this.isLoadingTool();
        const isLoadingToolStock = this.isLoadingToolStock();
        const isLoadingRecipe = this.isLoadingRecipe();
        const isLoadingRecipeCategory = this.isLoadingRecipeCategory();
        const isLoadingRecipeIngredient = this.isLoadingRecipeIngredient();
        const isLoadingRecipeTool = this.isLoadingRecipeTool();
        const isLoadingStep = this.isLoadingStep();
        const isLoadingRecipeStep = this.isLoadingRecipeStep();
        const isLoadingFriendship = this.isLoadingFriendship();
        const isLoadingFollowship = this.isLoadingFollowship();
        const isLoadingProfile = this.isLoadingProfile();
        const isLoadingShoppingList = this.isLoadingShoppingList();
        const isLoadingShoppingListRecipe = this.isLoadingShoppingListRecipe();
        // console.log(
        //   `LOADING STATES: ${isLoadingMessage}, ${isLoadingIngredient}, ${isLoadingIngredientStock}, ${isLoadingTool}, ${isLoadingToolStock}, ${isLoadingRecipe}, ${isLoadingRecipeCategory}, ${isLoadingRecipeIngredient}, ${isLoadingRecipeTool}, ${isLoadingStep}, ${isLoadingRecipeStep}, ${isLoadingFriendship}, ${isLoadingFollowship}, ${isLoadingProfile}, ${isLoadingShoppingList}, ${isLoadingShoppingListRecipe}`
        // );

        // if all loading states are false, set global loading state to false
        if (
          !isLoadingMessage &&
          !isLoadingIngredient &&
          !isLoadingIngredientStock &&
          !isLoadingTool &&
          !isLoadingToolStock &&
          !isLoadingRecipe &&
          !isLoadingRecipeCategory &&
          !isLoadingRecipeIngredient &&
          !isLoadingRecipeTool &&
          !isLoadingStep &&
          !isLoadingRecipeStep &&
          !isLoadingFriendship &&
          !isLoadingFollowship &&
          !isLoadingProfile &&
          !isLoadingShoppingList &&
          !isLoadingShoppingListRecipe
        ) {
          this.isLoadingGlobal.set(false);
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit() {
    this.isLoadingGlobal.set(true);
    this.loadState();
    this.setupTimer();
  }

  ngOnDestroy() {
    // Ensure we clean up the subscription to prevent memory leaks
    this.timeoutSubscription?.unsubscribe();
  }

  setupTimer() {
    // Start a timer for 10 seconds
    this.timeoutSubscription = timer(8000).subscribe(() => {
      // Check if isLoadingGlobal is still true
      if (this.isLoadingGlobal()) {
        console.log("Navigating to login due to timeout.");
        this.router.navigate(['/login']);
      }
    });
  }

  loadState() {
    //--message
    this.store.dispatch(MessageActions.loadMessages());
    this.store.select(selectMessageLoading).subscribe((state) => {
      this.store.select(selectMessageError).subscribe((error) => {
        if (error) {
          console.error(
            `Message State load failed: ${error.message}, CODE: ${error.statusCode}`
          );
        } else {
          this.isLoadingMessage.set(state);
        }
      });
    });

    //--ingredient
    this.store.dispatch(IngredientActions.loadIngredients());
    this.store.select(selectIngredientLoading).subscribe((state) => {
      this.store.select(selectIngredientError).subscribe((error) => {
        if (error) {
          console.error(
            `Ingredient State load failed: ${error.message}, CODE: ${error.statusCode}`
          );
        } else {
          this.isLoadingIngredient.set(state);
        }
      });
    });

    //--ingredientStock
    this.store.dispatch(IngredientStockActions.loadIngredientStocks());
    this.store.select(selectIngredientStockLoading).subscribe((state) => {
      this.store.select(selectIngredientStockError).subscribe((error) => {
        if (error) {
          console.error(
            `Ingredient Stock State load failed: ${error.message}, CODE: ${error.statusCode}`
          );
        } else {
          this.isLoadingIngredientStock.set(state);
        }
      });
    });

    //--tool
    this.store.dispatch(ToolActions.loadTools());
    this.store.select(selectToolLoading).subscribe((state) => {
      this.store.select(selectToolError).subscribe((error) => {
        if (error) {
          console.error(
            `Tool State load failed: ${error.message}, CODE: ${error.statusCode}`
          );
        } else {
          this.isLoadingTool.set(state);
        }
      });
    });

    //--toolStock
    this.store.dispatch(ToolStockActions.loadToolStocks());
    this.store.select(selectToolStockLoading).subscribe((state) => {
      this.store.select(selectToolStockError).subscribe((error) => {
        if (error) {
          console.error(
            `Tool Stock State load failed: ${error.message}, CODE: ${error.statusCode}`
          );
        } else {
          this.isLoadingToolStock.set(state);
        }
      });
    });

    //--recipes
    this.store.dispatch(RecipeActions.loadRecipes());
    this.store.dispatch(RecipeActions.loadRecipeSubscriptions());
    this.store.dispatch(RecipeActions.loadDiscoverRecipes());
    this.store.select(selectRecipeLoading).subscribe((state) => {
      this.store.select(selectRecipeError).subscribe((error) => {
        if (error) {
          console.error(
            `Recipe State load failed: ${error.message}, CODE: ${error.statusCode}`
          );
        } else {
          this.isLoadingRecipe.set(state);
        }
      });
    });

    //--recipeCategory
    this.store.dispatch(RecipeCategoryActions.loadRecipeCategories());
    this.store.select(selectRecipeCategoryLoading).subscribe((state) => {
      this.store.select(selectRecipeCategoryError).subscribe((error) => {
        if (error) {
          console.error(
            `Recipe Category State load failed: ${error.message}, CODE: ${error.statusCode}`
          );
        } else {
          this.isLoadingRecipeCategory.set(state);
        }
      });
    });

    //--recipeIngredient
    this.store.dispatch(RecipeIngredientActions.loadRecipeIngredients());
    this.store.select(selectRecipeIngredientLoading).subscribe((state) => {
      this.store.select(selectRecipeIngredientError).subscribe((error) => {
        if (error) {
          console.error(
            `Recipe Ingredient State load failed: ${error.message}, CODE: ${error.statusCode}`
          );
        } else {
          this.isLoadingRecipeIngredient.set(state);
        }
      });
    });

    //--recipeTool
    this.store.dispatch(RecipeToolActions.loadRecipeTools());
    this.store.select(selectRecipeToolLoading).subscribe((state) => {
      this.store.select(selectRecipeToolError).subscribe((error) => {
        if (error) {
          console.error(
            `Recipe Tool State load failed: ${error.message}, CODE: ${error.statusCode}`
          );
        } else {
          this.isLoadingRecipeTool.set(state);
        }
      });
    });

    //--step
    this.store.dispatch(StepActions.loadSteps());
    this.store.select(selectStepLoading).subscribe((state) => {
      this.store.select(selectStepError).subscribe((error) => {
        if (error) {
          console.error(
            `Step State load failed: ${error.message}, CODE: ${error.statusCode}`
          );
        } else {
          this.isLoadingStep.set(state);
        }
      });
    });

    //--recipeStep
    this.store.dispatch(RecipeStepActions.loadRecipeSteps());
    this.store.select(selectLoadingRecipeStep).subscribe((state) => {
      this.store.select(selectErrorRecipeStep).subscribe((error) => {
        if (error) {
          console.error(
            `Recipe Step State load failed: ${error.message}, CODE: ${error.statusCode}`
          );
        } else {
          this.isLoadingRecipeStep.set(state);
        }
      });
    });

    //--friendship
    this.store.dispatch(FriendshipActions.loadFriendships());
    this.store.select(selectFriendshipLoading).subscribe((state) => {
      this.store.select(selectFriendshipError).subscribe((error) => {
        if (error) {
          console.error(
            `Friendship State load failed: ${error.message}, CODE: ${error.statusCode}`
          );
        } else {
          this.isLoadingFriendship.set(state);
        }
      });
    });

    //--followship
    this.store.dispatch(FollowshipActions.loadFollowships());
    this.store.dispatch(FollowshipActions.loadFollowers());
    this.store.select(selectFollowshipLoading).subscribe((state) => {
      this.store.select(selectFollowshipError).subscribe((error) => {
        if (error) {
          console.error(
            `Followship State load failed: ${error.message}, CODE: ${error.statusCode}`
          );
        } else {
          this.isLoadingFollowship.set(state);
        }
      });
    });

    //--profile
    this.store.dispatch(ProfileActions.loadFollowers());
    this.store.dispatch(ProfileActions.loadFollowing());
    this.store.dispatch(ProfileActions.loadProfile({}));
    this.store.dispatch(ProfileActions.loadFriends());
    this.store.dispatch(ProfileActions.loadFriendRequests());
    this.store.dispatch(ProfileActions.loadFriendRequestsSent());
    this.store.select(selectProfileLoading).subscribe((state) => {
      this.store.select(selectProfileError).subscribe((error) => {
        if (error) {
          console.error(
            `Profile State load failed: ${error.message}, CODE: ${error.statusCode}`
          );
        } else {
          this.isLoadingProfile.set(state);
        }
      });
    });

    //--shoppingList
    this.store.dispatch(ShoppingListActions.loadShoppingLists());
    this.store.select(selectShoppingListLoading).subscribe((state) => {
      this.store.select(selectShoppingListError).subscribe((error) => {
        if (error) {
          console.error(
            `Shopping List State load failed: ${error.message}, CODE: ${error.statusCode}`
          );
        } else {
          this.isLoadingShoppingList.set(state);
        }
      });
    });

    //--shoppingListRecipe
    this.store.dispatch(ShoppingListRecipeActions.loadAllShoppingListRecipes());
    this.store.select(selectShoppingListRecipeLoading).subscribe((state) => {
      this.store.select(selectShoppingListRecipeError).subscribe((error) => {
        if (error) {
          console.error(
            `Shopping List Recipe State load failed: ${error.message}, CODE: ${error.statusCode}`
          );
        } else {
          this.isLoadingShoppingListRecipe.set(state);
        }
      });
    });
  }
}
