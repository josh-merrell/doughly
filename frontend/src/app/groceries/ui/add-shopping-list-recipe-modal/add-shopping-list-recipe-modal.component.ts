import {
  Component,
  ElementRef,
  Inject,
  ViewChild,
  WritableSignal,
  computed,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { RecipeCategory } from 'src/app/recipes/state/recipe-category/recipe-category-state';
import { selectRecipeCategories } from 'src/app/recipes/state/recipe-category/recipe-category-selectors';
import { RecipeCategoryCardComponent } from 'src/app/recipes/feature/recipes-page/ui/recipe-category/recipe-category-card/recipe-category-card.component';
import { RecipeCardComponent } from 'src/app/recipes/feature/recipes-page/ui/recipe/recipe-card/recipe-card.component';
import { ShoppingListRecipeActions } from '../../state/shopping-list-recipe-actions';
import { selectAdding } from '../../state/shopping-list-recipe-selectors';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { filter, take } from 'rxjs';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { selectError as selectErrorShoppingListRecipe } from '../../state/shopping-list-recipe-selectors';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'dl-add-shopping-list-recipe-modal',
  standalone: true,
  imports: [
    CommonModule,
    RecipeCategoryCardComponent,
    RecipeCardComponent,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './add-shopping-list-recipe-modal.component.html',
})
export class AddShoppingListRecipeModalComponent {
  public isLoading: WritableSignal<boolean> = signal(false);
  scrollContainer!: ElementRef;
  showScrollDownArrow = false;
  showScrollUpArrow = false;

  public shoppingListRecipes: WritableSignal<any> = signal([]);
  public shoppingListID: WritableSignal<number> = signal(0);
  public recipes: WritableSignal<any> = signal([]);
  recipesWithCatName = computed(() => {
    const recipes = this.recipes();
    const categories = this.categories();
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
  public catFilteredRecipes = computed(() => {
    const searchFilter = this.searchFilter();
    const recipes = this.recipesWithCatName();
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
  public displayRecipes = computed(() => {
    const recipes = this.catFilteredRecipes();
    // filter out any recipes that are already in the shopping list
    const shoppingListRecipes = this.shoppingListRecipes();
    const filteredRecipes = recipes.filter((recipe) => {
      return !shoppingListRecipes.find((slRecipe) => {
        return slRecipe.recipeID === recipe.recipeID;
      });
    });
    //sort by recipe name and return
    return filteredRecipes.sort((a, b) => {
      if (a.title < b.title) {
        return -1;
      } else if (b.title < a.title) {
        return 1;
      } else {
        return 0;
      }
    });
  });
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
  public view: WritableSignal<string> = signal('byCategory');
  public searchFilter: WritableSignal<string> = signal('');
  selectedRecipeID: WritableSignal<number> = signal(0);
  plannedDate: WritableSignal<string> = signal(
    new Date().toLocaleDateString('en-US', {
      // initialized to today's date in format of "Jan 1, 2023"
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  );
  displayPlannedDate: WritableSignal<string> = signal('');

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private dialogRef: MatDialogRef<AddShoppingListRecipeModalComponent>,
    public dialog: MatDialog
  ) {
    effect(
      () => {
        const filteredCategories = this.filteredCategories();
        const displayRecipes = this.displayRecipes();

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

  ngOnInit(): void {
    this.shoppingListRecipes.set(this.data.shoppingListRecipes);
    this.recipes.set(this.data.recipes);
    this.shoppingListID.set(this.data.shoppingListID);
    this.store.select(selectRecipeCategories).subscribe((categories) => {
      this.categories.set(categories);
    });
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.plannedDate.set(tomorrow.toISOString().slice(0, 10));
    this.displayPlannedDate.set(
      this.updateDisplayPlannedData(this.plannedDate())
    );
  }

  onViewClick(view: string): void {
    this.view.set(view);
    this.searchFilter.set('');
  }
  filterPastDates(date: Date | null): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date) {
      const dateWithoutTime = new Date(date);
      dateWithoutTime.setHours(0, 0, 0, 0);
      return dateWithoutTime >= today;
    }
    return true;
  }
  filterFutureDates(date: Date | null): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date) {
      const dateWithoutTime = new Date(date);
      dateWithoutTime.setHours(0, 0, 0, 0);
      return dateWithoutTime <= today;
    }
    return true;
  }
  allowNextWeek(date: Date | null): boolean {
    //only allow dates up to 7 days from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(0, 0, 0, 0);
    if (date) {
      const dateWithoutTime = new Date(date);
      dateWithoutTime.setHours(0, 0, 0, 0);
      return dateWithoutTime >= today && dateWithoutTime <= nextWeek;
    }
    return true;
  }
  updatePlannedDate(event: MatDatepickerInputEvent<Date>) {
    const date = event.value;
    if (date && date instanceof Date) {
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      this.plannedDate.set(formattedDate);
      this.displayPlannedDate.set(this.updateDisplayPlannedData(formattedDate));
    } else {
      console.error('Received value is not a Date object:', date);
    }
  }
  updateDisplayPlannedData(plannedDate: string) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayString = today.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const tomorrowString = tomorrow.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    if (plannedDate === todayString) {
      return 'Today';
    } else if (plannedDate === tomorrowString) {
      return 'Tomorrow';
    } else {
      return plannedDate;
    }
  }
  updateSearchFilter(searchFilter: string): void {
    this.searchFilter.set(searchFilter);
  }
  categoryCardClick(category: RecipeCategory): void {
    this.updateSearchFilter(category.name);
    this.view.set('all');
  }
  recipeCardClick(recipe) {
    if (this.selectedRecipeID() === recipe.recipeID) {
      this.selectedRecipeID.set(0);
    } else {
      this.selectedRecipeID.set(recipe.recipeID);
    }
  }
  onAddClick(): void {
    this.isLoading.set(true);
    this.store.dispatch(
      ShoppingListRecipeActions.addShoppingListRecipe({
        shoppingListID: this.data.shoppingListID,
        recipeID: this.selectedRecipeID(),
        plannedDate: this.plannedDate(),
      })
    );
    this.store
      .select(selectAdding)
      .pipe(
        filter((adding) => !adding),
        take(1)
      )
      .subscribe(() => {
        this.store
          .select(selectErrorShoppingListRecipe)
          .pipe(take(1))
          .subscribe((error) => {
            if (error) {
              console.error(
                `Shopping list recipe add failed: ${error.message}, CODE: ${error.statusCode}`
              );
              this.dialog.open(ErrorModalComponent, {
                maxWidth: '380px',
                data: {
                  errorMessage: error.message,
                  statusCode: error.statusCode,
                },
              });
            } else {
              this.dialogRef.close('successOnboarding');
            }
            this.isLoading.set(false);
          });
      });
  }
}
