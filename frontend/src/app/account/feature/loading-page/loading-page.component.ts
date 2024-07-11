import { CommonModule } from '@angular/common';
import { Component, WritableSignal, effect, signal } from '@angular/core';
import { Router, RouterLinkWithHref } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ExtraStuffService } from 'src/app/shared/utils/extraStuffService';

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

import { SharedShoppingListActions } from 'src/app/groceries/state/sharedShoppingLists/shared-shopping-list-actions';
import {
  selectLoading as selectSharedShoppingListLoading,
  selectError as selectSharedShoppingListError,
} from 'src/app/groceries/state/sharedShoppingLists/shared-shopping-list-selectors';

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
import { ProductService } from 'src/app/shared/utils/productService';
import { AnimationOptions, LottieComponent } from 'ngx-lottie';
import { AnimationItem } from 'lottie-web';

@Component({
  selector: 'dl-loading-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLinkWithHref,
    MatProgressSpinnerModule,
    LottieComponent,
  ],
  templateUrl: './loading-page.component.html',
})
export class LoadingPageComponent {
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
  private isLoadingShoppingList: WritableSignal<boolean> = signal(true);
  private isLoadingSharedShoppingList: WritableSignal<boolean> = signal(true);
  private isLoadingShoppingListRecipe: WritableSignal<boolean> = signal(true);
  private isMinimumTimeDone: WritableSignal<boolean> = signal(false);

  // Lottie animation
  private animationItem: AnimationItem | undefined;
  animationOptions: AnimationOptions = {
    path: '/assets/animations/lottie/bubblingPot.json',
    loop: true,
    autoplay: true,
  };
  lottieStyles = {
    position: 'absolute',
    right: '0',
    top: '0',
    height: '40px',
    width: '40px',
  };

  private timeoutSubscription!: Subscription;

  constructor(
    private store: Store,
    private router: Router,
    private extraStuffService: ExtraStuffService,
    private ProductService: ProductService
  ) {
    effect(() => {
      const isLoading = this.isLoadingGlobal();
      if (!isLoading) {
        this.timeoutSubscription.unsubscribe();
        this.router.navigate(['/tempRoute'], { onSameUrlNavigation: 'reload' });
      }
    });

    effect(
      () => {
        const stateToLoad = this.extraStuffService.stateToLoad();
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
        const isLoadingSharedShoppingList = this.isLoadingSharedShoppingList();
        const isLoadingShoppingListRecipe = this.isLoadingShoppingListRecipe();
        const isMinimumTimeDone = this.isMinimumTimeDone();

        switch (stateToLoad) {
          case 'messages':
            if (!isLoadingMessage) {
              this.extraStuffService.stateToLoad.set('');
              this.isLoadingGlobal.set(false);
            }
            break;
          default:
            // console.log(
            //   `CURRENT: irLoadingMessage: ${isLoadingMessage}, irLoadingIngredient: ${isLoadingIngredient}, irLoadingIngredientStock: ${isLoadingIngredientStock}, irLoadingTool: ${isLoadingTool}, irLoadingToolStock: ${isLoadingToolStock}, irLoadingRecipe: ${isLoadingRecipe}, irLoadingRecipeCategory: ${isLoadingRecipeCategory}, irLoadingRecipeIngredient: ${isLoadingRecipeIngredient}, irLoadingRecipeTool: ${isLoadingRecipeTool}, irLoadingStep: ${isLoadingStep}, irLoadingRecipeStep: ${isLoadingRecipeStep}, irLoadingFriendship: ${isLoadingFriendship}, irLoadingFollowship: ${isLoadingFollowship}, irLoadingProfile: ${isLoadingProfile}, irLoadingShoppingList: ${isLoadingShoppingList}, irLoadingSharedShoppingList: ${isLoadingSharedShoppingList}, irLoadingShoppingListRecipe: ${isLoadingShoppingListRecipe}`
            // );
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
              !isLoadingSharedShoppingList &&
              !isLoadingShoppingListRecipe &&
              isMinimumTimeDone
            ) {
              this.extraStuffService.stateToLoad.set('');
              this.isLoadingGlobal.set(false);
            }
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit() {
    this.isLoadingGlobal.set(true);
    this.waitMinumimTime();
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
        this.router.navigate(['/login']);
      }
    });
  }

  animationCreated(animationItem: AnimationItem): void {
    this.animationItem = animationItem;
    this.animationItem.setSpeed(1);
  }
  loopComplete(): void {
    // this.animationItem?.pause();
  }

  loadState() {
    switch (this.extraStuffService.stateToLoad()) {
      case 'messages':
        this.loadMessageState();
        break;
      default:
        this.loadMessageState();
        this.loadIngredientState();
        this.loadIngredientStockState();
        this.loadToolState();
        this.loadToolStockState();
        this.loadRecipeState();
        this.loadRecipeCategoryState();
        this.loadRecipeIngredientState();
        this.loadRecipeToolState();
        this.loadStepState();
        this.loadRecipeStepState();
        this.loadFriendshipState();
        this.loadFollowshipState();
        this.loadProfileState();
        this.loadShoppingListState();
        this.loadSharedShoppingListState();
        this.loadShoppingListRecipeState();
        this.ProductService.initGlassfy();
    }
  }

  loadMessageState() {
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
  }

  loadIngredientState() {
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
  }

  loadIngredientStockState() {
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
  }

  loadToolState() {
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
  }

  loadToolStockState() {
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
  }

  loadRecipeState() {
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
  }

  loadRecipeCategoryState() {
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
  }

  loadRecipeIngredientState() {
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
  }

  loadRecipeToolState() {
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
  }

  loadStepState() {
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
  }

  loadRecipeStepState() {
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
  }

  loadFriendshipState() {
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
  }

  loadFollowshipState() {
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
  }

  loadProfileState() {
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
  }

  loadShoppingListState() {
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
  }

  loadSharedShoppingListState() {
    this.store.dispatch(SharedShoppingListActions.loadSharedShoppingLists());
    this.store.select(selectSharedShoppingListLoading).subscribe((state) => {
      this.store.select(selectSharedShoppingListError).subscribe((error) => {
        if (error) {
          console.error(
            `Shared Shopping List State load failed: ${error.message}, CODE: ${error.statusCode}`
          );
        } else {
          this.isLoadingSharedShoppingList.set(state);
        }
      });
    });
  }

  loadShoppingListRecipeState() {
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

  waitMinumimTime() {
    setTimeout(() => {
      this.isMinimumTimeDone.set(true);
    }, 2000);
  }
}
