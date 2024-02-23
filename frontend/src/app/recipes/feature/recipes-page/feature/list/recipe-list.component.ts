import {
  Input,
  Component,
  WritableSignal,
  signal,
  effect,
  computed,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeCategoryCardComponent } from '../../ui/recipe-category/recipe-category-card/recipe-category-card.component';
import { RecipeCardComponent } from '../../ui/recipe/recipe-card/recipe-card.component';
import { Recipe } from 'src/app/recipes/state/recipe/recipe-state';
import { Location } from '@angular/common';

import {
  RecipeCategory,
  RecipeCategoryError,
} from 'src/app/recipes/state/recipe-category/recipe-category-state';
import { Store } from '@ngrx/store';
import { selectRecipes } from 'src/app/recipes/state/recipe/recipe-selectors';
import { selectRecipeCategories } from 'src/app/recipes/state/recipe-category/recipe-category-selectors';
import { MatDialog } from '@angular/material/dialog';
import { AddRecipeModalComponent } from '../../ui/recipe/add-recipe-modal/add-recipe-modal.component';
import { AddRequestConfirmationModalComponent } from 'src/app/shared/ui/add-request-confirmation/add-request-confirmation-modal.component';
import { AddRequestErrorModalComponent } from 'src/app/shared/ui/add-request-error/add-request-error-modal.component';
import { RecipeIngredientError } from 'src/app/recipes/state/recipe-ingredient/recipe-ingredient-state';
import { RecipeIngredientsModalComponent } from '../../ui/recipe-ingredient/recipe-ingredients-modal/recipe-ingredients-modal.component';
import { RecipeToolsModalComponent } from '../../ui/recipe-tool/recipe-tools-modal/recipe-tools-modal.component';
import { RecipeStepsModalComponent } from '../../ui/recipe-step/recipe-steps-modal/recipe-steps-modal.component';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { ConfirmationModalComponent } from 'src/app/shared/ui/confirmation-modal/confirmation-modal.component';
import { filter, map, takeUntil } from 'rxjs';

function isRecipeCategoryError(obj: any): obj is RecipeCategoryError {
  return obj && obj.errorType !== undefined && obj.message !== undefined;
}
function isRecipeIngredientError(obj: any): obj is RecipeIngredientError {
  return obj && obj.errorType !== undefined && obj.message !== undefined;
}
function isRecipeToolError(obj: any): obj is RecipeIngredientError {
  return obj && obj.errorType !== undefined && obj.message !== undefined;
}
function isRecipeStepError(obj: any): obj is RecipeIngredientError {
  return obj && obj.errorType !== undefined && obj.message !== undefined;
}
@Component({
  selector: 'dl-recipe-list',
  standalone: true,
  imports: [CommonModule, RecipeCategoryCardComponent, RecipeCardComponent],
  templateUrl: './recipe-list.component.html',
})
export class RecipeListComponent {
  @Input() type!: string;
  @ViewChild('scrollContainer', { static: false })
  scrollContainer!: ElementRef;
  showScrollDownArrow = false;
  showScrollUpArrow = false;

  public listView: WritableSignal<string> = signal('all');
  public searchFilter: WritableSignal<string> = signal('');
  public categories: WritableSignal<RecipeCategory[]> = signal([]);
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
  public displayCategories: WritableSignal<RecipeCategory[]> = signal([]);
  public recipes: WritableSignal<Recipe[]> = signal([]);
  displayRecipes = computed(() => {
    const recipes = this.recipes();
    const categories = this.displayCategories();
    const recipesWithCategoryName = recipes.map((recipe) => {
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
  public filteredRecipes = computed(() => {
    const searchFilter = this.searchFilter();
    const recipes = this.displayRecipes().sort((a, b) =>
      a.title.localeCompare(b.title)
    );
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

  constructor(
    private router: Router,
    private store: Store,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private location: Location
  ) {
    effect(
      () => {
        const filteredCategories = this.filteredCategories();
        const recipes = this.recipes();
        let newCategories: RecipeCategory[] = filteredCategories.map(
          (category) => {
            const recipeCount = recipes.filter((recipe) => {
              return recipe.recipeCategoryID === category.recipeCategoryID;
            }).length;

            return {
              ...category,
              recipeCount: recipeCount,
            };
          }
        );
        newCategories = newCategories.filter((category) => {
          return category.recipeCount !== 0;
        });
        this.displayCategories.set(
          newCategories.sort((a, b) => a.name.localeCompare(b.name))
        );
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit(): void {
    // Check the initial URL
    this.checkUrlAndAct(this.router.url);

    // Listen for future URL changes
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        ),
        map((event) => event as NavigationEnd)
      )
      .subscribe((navigationEndEvent) => {
        this.checkUrlAndAct(navigationEndEvent.urlAfterRedirects);
      });

    this.store.select(selectRecipes).subscribe((recipes) => {
      recipes = recipes.filter((recipe) => {
        return this.type === 'subscription'
          ? recipe.type === 'subscription'
          : recipe.type !== 'subscription';
      });
      this.recipes.set(
        [...recipes].sort((a, b) => a.title.localeCompare(b.title))
      );
    });
    this.store.select(selectRecipeCategories).subscribe((categories) => {
      this.categories.set(categories);
    });
  }

  ngAfterViewInit(): void {
    const checkScrollHeight = () => {
      const childHeight = Array.from(
        this.scrollContainer.nativeElement.children as HTMLElement[]
      ).reduce((height, child: HTMLElement) => height + child.clientHeight, 0);
      this.showScrollDownArrow =
        childHeight > this.scrollContainer.nativeElement.clientHeight;
    };
    checkScrollHeight();
  }

  private checkUrlAndAct(fullUrl: string) {
    if (fullUrl.includes('/add')) {
      this.onAddClick();
    }
    // Any other URL checks can be added here
  }

  checkScroll(target: EventTarget | null) {
    if (target) {
      let element = target as HTMLElement;
      this.showScrollUpArrow = element.scrollTop > 0;
      this.showScrollDownArrow =
        element.scrollHeight - element.scrollTop - element.clientHeight > 1;
    }
  }

  //** INTERACTIVITY FUNCTIONS **************************
  setListView(listView: string) {
    this.listView.set(listView);
    this.searchFilter.set('');
  }
  updateSearchFilter(searchFilter: string): void {
    this.searchFilter.set(searchFilter);
  }
  onAddClick(): void {
    // update url to include '/add' if it's not already there
    this.location.go('/recipes/created/add')

    const dialogRef = this.dialog.open(AddRecipeModalComponent, {
      data: {
        recipeCategories: this.categories(),
      },
      width: '80%',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'success') {
        this.dialog.closeAll();
        this.dialog.open(ConfirmationModalComponent, {
          data: {
            confirmationMessage: `Recipe added successfully.`,
          },
        });
      }
      // remove '/add' from the url
      this.location.go('/recipes/created')
    });
  }
  categoryCardClick(category: RecipeCategory): void {
    this.updateSearchFilter(category.name);
    this.listView.set('all');
  }
  recipeCardClick(recipe: Recipe) {
    if (recipe.status === 'noIngredients') {
      //if the recipe status of 'noIngredients', show the 'RecipeIngredients' modal
      const dialogRef = this.dialog.open(RecipeIngredientsModalComponent, {
        data: {
          recipe,
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result === 'success') {
          this.dialog.open(AddRequestConfirmationModalComponent, {
            data: {
              results: result,
              addSuccessMessage: 'Recipe Ingredients added successfully!',
            },
          });
        } else if (isRecipeIngredientError(result)) {
          this.dialog.open(AddRequestErrorModalComponent, {
            data: {
              error: result,
              addFailureMessage: 'Recipe Ingredients could not be added.',
            },
          });
        }
      });
    } else if (recipe.status === 'noTools') {
      //else if the recipe has status of 'noTools', show the 'addRecipeTools' modal
      const dialogRef = this.dialog.open(RecipeToolsModalComponent, {
        data: {
          recipe,
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result === 'success') {
          this.dialog.open(AddRequestConfirmationModalComponent, {
            data: {
              results: result,
              addSuccessMessage: 'Recipe Tools added successfully!',
            },
          });
        } else if (isRecipeToolError(result)) {
          this.dialog.open(AddRequestErrorModalComponent, {
            data: {
              error: result,
              addFailureMessage: 'Recipe Tools could not be added.',
            },
          });
        }
      });
    } else if (recipe.status === 'noSteps') {
      //else if the recipe has status of 'noSteps', show the 'addRecipeSteps' modal
      const dialogRef = this.dialog.open(RecipeStepsModalComponent, {
        data: {
          recipe,
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result === 'success') {
          this.dialog.open(AddRequestConfirmationModalComponent, {
            data: {
              results: result,
              addSuccessMessage: 'Recipe Steps added successfully!',
            },
          });
        } else if (isRecipeStepError(result)) {
          this.dialog.open(AddRequestErrorModalComponent, {
            data: {
              error: result,
              addFailureMessage: 'Recipe Steps could not be added.',
            },
          });
        }
      });
    } else {
      this.router.navigate(['/recipe', recipe.recipeID]);
    }
  }

  // ***************************************************
}
