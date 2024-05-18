import { CommonModule } from '@angular/common';
import {
  Component,
  WritableSignal,
  computed,
  effect,
  signal,
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectProfile } from 'src/app/profile/state/profile-selectors';
import { RecipeService } from 'src/app/recipes/data/recipe.service';
import { RecipeCategoryCardComponent } from 'src/app/recipes/feature/recipes-page/ui/recipe-category/recipe-category-card/recipe-category-card.component';
import { RecipeCardComponent } from 'src/app/recipes/feature/recipes-page/ui/recipe/recipe-card/recipe-card.component';
import { selectRecipeCategories } from 'src/app/recipes/state/recipe-category/recipe-category-selectors';
import { RecipeCategory } from 'src/app/recipes/state/recipe-category/recipe-category-state';
import { RecipeActions } from 'src/app/recipes/state/recipe/recipe-actions';
import {
  selectRecipeSubscriptions,
  selectRecipes,
} from 'src/app/recipes/state/recipe/recipe-selectors';
import { Recipe } from 'src/app/recipes/state/recipe/recipe-state';
import { ConfirmationModalComponent } from 'src/app/shared/ui/confirmation-modal/confirmation-modal.component';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { ModalService } from 'src/app/shared/utils/modalService';
import { ProductService } from 'src/app/shared/utils/productService';
import { StringsService } from 'src/app/shared/utils/strings';

@Component({
  selector: 'dl-select-free-tier-subscriptions-modal',
  standalone: true,
  imports: [
    CommonModule,
    RecipeCardComponent,
    RecipeCategoryCardComponent,
    MatProgressSpinnerModule,
  ],
  templateUrl: './dl-select-free-tier-subscriptions-modal.component.html',
})
export class SelectFreeTierSubscriptionsModalComponent {
  public isLoading: WritableSignal<boolean> = signal(false);
  public view: WritableSignal<string> = signal('byCategory');

  public searchFilter: WritableSignal<string> = signal('');
  public categories: WritableSignal<RecipeCategory[]> = signal([]);
  originalSelectedRecipeIDs: WritableSignal<number[]> = signal([]);
  selectedRecipeIDs: WritableSignal<number[]> = signal([]);
  remainingSelectionCount = computed(() => {
    const selectedRecipeIDs = this.selectedRecipeIDs();
    const maxSelectionCount = this.productService.licences.recipeSubscribeLimit;
    return maxSelectionCount - selectedRecipeIDs.length;
  });
  recipeSubscriptionsWithCatName = computed(() => {
    const recipeSubscriptions = this.recipeSubscriptions();
    const categories = this.categories();
    const recipesWithCategoryName = recipeSubscriptions.map((recipe) => {
      const category = categories.find((category) => {
        return category.recipeCategoryID === recipe.recipeCategoryID;
      });
      return {
        ...recipe,
        recipeCategoryName: category?.name,
      };
    });
    return recipesWithCategoryName;
  });
  public catFilteredRecipes = computed(() => {
    const searchFilter = this.searchFilter();
    const recipes = this.recipeSubscriptionsWithCatName();
    if (searchFilter) {
      return recipes.filter((recipe) => {
        return (
          recipe.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
          recipe.recipeCategoryName
            ?.toLowerCase()
            .includes(searchFilter.toLowerCase())
        );
      });
    } else {
      return recipes;
    }
  });
  public filteredCategories = computed(() => {
    const searchFilter = this.searchFilter();
    const categories = this.categories();
    if (searchFilter) {
      return categories.filter((category) => {
        return category.name.toLowerCase().includes(searchFilter.toLowerCase());
      });
    } else {
      return categories;
    }
  });
  public displayRecipes = computed(() => {
    const recipes = this.catFilteredRecipes();
    //sort by recipe name and return
    return recipes.sort((a, b) => {
      if (a.title < b.title) {
        return -1;
      } else if (b.title < a.title) {
        return 1;
      } else {
        return 0;
      }
    });
  });
  public displayCategories: WritableSignal<RecipeCategory[]> = signal([]);
  public recipeSubscriptions: WritableSignal<Recipe[]> = signal([]);
  public profile: WritableSignal<any> = signal(null);
  public license = this.productService.licences;

  constructor(
    public stringsService: StringsService,
    private store: Store,
    private productService: ProductService,
    private recipeService: RecipeService,
    private dialog: MatDialog,
    private router: Router,
    private dialogRef: MatDialogRef<SelectFreeTierSubscriptionsModalComponent>,
    private modalService: ModalService
  ) {
    effect(
      () => {
        const filteredCategories = this.filteredCategories();
        const displayRecipes = this.displayRecipes();

        console.log(`DISPLAY RECIPES: `, displayRecipes);

        let newCategories = filteredCategories
          .map((category) => {
            const recipeCount = displayRecipes.reduce((count, recipe) => {
              return (
                count +
                (recipe.recipeCategoryID === category.recipeCategoryID ? 1 : 0)
              );
            }, 0);

            return { ...category, recipeCount };
          })
          .filter((category) => category.recipeCount > 0); // Include only categories with at least one recipe
        newCategories.sort((a, b) => {
          if (a.name < b.name) {
            return -1;
          } else if (b.name < a.name) {
            return 1;
          } else {
            return 0;
          }
        });

        this.displayCategories.set(newCategories);
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit() {
    this.store.select(selectProfile).subscribe((profile) => {
      if (profile) {
        this.profile.set(profile);
      }
    });
    this.store.select(selectRecipes).subscribe((recipes) => {
      // filter by type 'subscription'
      const recipeSubscriptions = recipes.filter(
        (recipe) => recipe.type === 'subscription'
      );
      const IDs = recipeSubscriptions
        .filter((recipe) => recipe.freeTier)
        .map((recipe) => recipe.recipeID);
      this.originalSelectedRecipeIDs.set(IDs);
      this.selectedRecipeIDs.set(IDs);
      this.recipeSubscriptions.set(recipeSubscriptions);
    });
    this.store.select(selectRecipeCategories).subscribe((categories) => {
      this.categories.set(categories);
    });
  }

  updateSearchFilter(searchFilter: string): void {
    this.searchFilter.set(searchFilter);
  }

  onViewClick(view: string): void {
    this.view.set(view);
    this.searchFilter.set('');
  }

  categoryCardClick(category: RecipeCategory): void {
    this.updateSearchFilter(category.name);
    this.view.set('all');
  }
  recipeCardClick(recipe) {
    if (this.selectedRecipeIDs().includes(recipe.recipeID)) {
      const newSelectedRecipeIDs = this.selectedRecipeIDs().filter(
        (id) => id !== recipe.recipeID
      );
      this.selectedRecipeIDs.set(newSelectedRecipeIDs);
    } else if (this.remainingSelectionCount() > 0) {
      this.selectedRecipeIDs.set([
        ...this.selectedRecipeIDs(),
        recipe.recipeID,
      ]);
    }
  }

  onSubmitClick() {
    if (
      !this.arraysEqual(
        this.selectedRecipeIDs(),
        this.originalSelectedRecipeIDs()
      )
    ) {
      this.isLoading.set(true);
      this.recipeService
        .setFreeTierSubscribed(this.selectedRecipeIDs())
        .subscribe((error) => {
          this.isLoading.set(false);
          if (error) {
            this.modalService.open(
              ErrorModalComponent,
              {
                maxWidth: '380px',
                data: {
                  errorMessage: error.message,
                  statusCode: error.statusCode,
                },
              },
              2,
              true
            );
          } else {
            this.store.dispatch(RecipeActions.loadRecipes());
            this.modalService.open(
              ConfirmationModalComponent,
              {
                data: {
                  confirmationMessage: 'Recipe Subscription selection updated',
                },
              },
              2,
              true
            );
            this.router.navigate(['/recipes/discover']);
            this.dialogRef.close();
          }
        });
    } else {
      console.log(`NO CHANGES`);
    }
  }

  arraysEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) {
      return false;
    }

    const sortedA = [...a].sort((x, y) => x - y);
    const sortedB = [...b].sort((x, y) => x - y);

    for (let i = 0; i < sortedA.length; i++) {
      if (sortedA[i] !== sortedB[i]) {
        return false;
      }
    }

    return true;
  }
}
