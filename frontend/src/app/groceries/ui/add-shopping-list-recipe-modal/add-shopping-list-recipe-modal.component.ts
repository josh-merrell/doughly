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
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RecipeCategory } from 'src/app/recipes/state/recipe-category/recipe-category-state';
import { selectRecipeCategories } from 'src/app/recipes/state/recipe-category/recipe-category-selectors';
import { RecipeCategoryCardComponent } from 'src/app/recipes/feature/recipes-page/ui/recipe-category/recipe-category-card/recipe-category-card.component';
import { RecipeCardComponent } from 'src/app/recipes/feature/recipes-page/ui/recipe/recipe-card/recipe-card.component';



@Component({
  selector: 'dl-add-shopping-list-recipe-modal',
  standalone: true,
  imports: [CommonModule, RecipeCategoryCardComponent, RecipeCardComponent],
  templateUrl: './add-shopping-list-recipe-modal.component.html',
})
export class AddShoppingListRecipeModalComponent {
  @ViewChild('scrollContainer', { static: false })
  scrollContainer!: ElementRef;
  showScrollDownArrow = false;
  showScrollUpArrow = false;

  public shoppingListRecipes: WritableSignal<any> = signal([]);
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
    return filteredRecipes;
  })
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
  plannedDate: WritableSignal<string> = signal('');

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private store: Store) {
    effect(
      () => {
        const filteredCategories = this.filteredCategories();
        // const recipes = this.recipes();
        // let newCategories: RecipeCategory[] = filteredCategories.map(
        //   (category) => {
        //     const recipeCount = recipes.filter((recipe) => {
        //       return recipe.recipeCategoryID === category.recipeCategoryID;
        //     }).length;

        //     return {
        //       ...category,
        //       recipeCount: recipeCount,
        //     };
        //   }
        // );
        // newCategories = newCategories.filter((category) => {
        //   return category.recipeCount !== 0;
        // });
        // this.displayCategories.set(newCategories);

        //filter out any categories that don't have any recipes in displayRecipes
        const displayRecipes = this.displayRecipes();
        const newCategories = filteredCategories.filter((category) => {
          return displayRecipes.find((recipe) => {
            return recipe.recipeCategoryID === category.recipeCategoryID;
          });
        });
        this.displayCategories.set(newCategories);
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit(): void {
    this.shoppingListRecipes.set(this.data.shoppingListRecipes);
    this.recipes.set(this.data.recipes);
    this.store.select(selectRecipeCategories).subscribe((categories) => {
      this.categories.set(categories);
    });
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.plannedDate.set(tomorrow.toISOString().slice(0, 10));
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

  checkScroll(target: EventTarget | null) {
    if (target) {
      let element = target as HTMLElement;
      this.showScrollUpArrow = element.scrollTop > 0;
      this.showScrollDownArrow =
        element.scrollHeight - element.scrollTop - element.clientHeight > 1;
    }
  }

  onViewClick(view: string): void {
    this.view.set(view);
    this.searchFilter.set('');
  }
  updateSearchFilter(searchFilter: string): void {
    this.searchFilter.set(searchFilter);
  }
  categoryCardClick(category: RecipeCategory): void {
    this.updateSearchFilter(category.name);
    this.view.set('all');
  }
  recipeCardClick(recipe: any): void {
    this.selectedRecipeID.set(recipe.recipeID);
  }
  onAddClick(): void {
    console.log(`ADDING RECIPE TO SHOPPING LIST: `, this.selectedRecipeID());
  }
}
