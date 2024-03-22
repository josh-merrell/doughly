import {
  Component,
  ElementRef,
  QueryList,
  ViewChildren,
  WritableSignal,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeCategory } from '../../state/recipe-category/recipe-category-state';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { RecipeCardComponent } from '../recipes-page/ui/recipe/recipe-card/recipe-card.component';
import { RecipeCategoryCardComponent } from '../recipes-page/ui/recipe-category/recipe-category-card/recipe-category-card.component';
import { selectRecipeCategories } from '../../state/recipe-category/recipe-category-selectors';
import { Recipe } from '../../state/recipe/recipe-state';
import { selectDiscoverRecipes } from '../../state/recipe/recipe-selectors';
import { selectRecipeByID } from '../../state/recipe/recipe-selectors';
import { selectProfile } from 'src/app/profile/state/profile-selectors';
@Component({
  selector: 'dl-discover-recipes',
  standalone: true,
  imports: [CommonModule, RecipeCategoryCardComponent, RecipeCardComponent],
  templateUrl: './discover-recipes.component.html',
})
export class DiscoverRecipesComponent {
  public discoverRecipes: WritableSignal<Recipe[]> = signal([]);
  public selectedCategory: WritableSignal<RecipeCategory | null> = signal(null);
  private categories: WritableSignal<RecipeCategory[]> = signal([]);
  public dayCategories: WritableSignal<RecipeCategory[]> = signal([]);
  public worldCategories: WritableSignal<RecipeCategory[]> = signal([]);
  private profile: WritableSignal<any> = signal(null);

  constructor(
    private store: Store,
    private router: Router,
    private el: ElementRef
  ) {
    effect(
      () => {
        const categories = this.categories();
        const recipes = this.discoverRecipes();

        // populate the 'recipes' array on each category with the recipes that belong to that category
        const categoriesWithRecipes = categories.map((category) => {
          const categoryWithRecipes = {
            ...category,
            recipes: recipes.filter(
              (recipe) => recipe.recipeCategoryID === category.recipeCategoryID
            ),
          };
          categoryWithRecipes['recipeCount'] =
            categoryWithRecipes.recipes.length;
          return categoryWithRecipes;
        });

        // remove the 'Other' category
        const otherCategoryIndex = categoriesWithRecipes.findIndex(
          (category) => category.recipeCategoryID === 1
        );
        if (otherCategoryIndex !== -1) {
          categoriesWithRecipes.splice(otherCategoryIndex, 1);
        }

        this.categoryPlacement(categoriesWithRecipes);
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit(): void {
    this.store.select(selectRecipeCategories).subscribe((categories) => {
      this.categories.set(categories);
    });
    this.store.select(selectDiscoverRecipes).subscribe((recipes) => {
      this.discoverRecipes.set(recipes);
    });
    this.store.select(selectProfile).subscribe((profile) => {
      this.profile.set(profile);
    });
  }

  onRecipeCardClick(recipeID: number): void {
    this.store
      .select(selectRecipeByID(recipeID))
      .subscribe((recipe: unknown) => {
        // Treat incoming data as unknown
        const typedRecipe = recipe as Recipe | undefined; // Assert the type
        if (typedRecipe && typedRecipe.userID === this.profile().userID) {
          this.router.navigate(['/recipe/', recipeID]);
        } else {
          // Else, navigate to the public recipe page
          this.router.navigate(['/recipe/public', recipeID]);
        }
      });
  }

  public scroll(element: any) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  scrollToCategory() {
    // Assuming you keep the selected category ID in a state variable.
    const categoryId = this.selectedCategory()?.recipeCategoryID;
    console.log(`CATEGORY ID: `, categoryId);
    if (categoryId !== null && categoryId !== undefined) {
      console.log('here');
      const categoryElement = document.querySelector(`.category-card`);
      if (categoryElement) {
        console.log(`CATEGORY ELEMENT: `, categoryElement);
        categoryElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }

  categoryCardClick(category: any) {
    if (category.recipeCount === 0) return;
    const previouslySelected =
      this.selectedCategory()?.recipeCategoryID === category.recipeCategoryID;
    this.selectedCategory.set(previouslySelected ? null : category);
  }

  categoryPlacement(categories: RecipeCategory[]) {
    const dayCategoryIDs = [
      9, 4, 5, 6, 10, 13, 19, 20, 24, 25, 26, 27, 30, 32, 33,
    ];
    const dayCategories = categories.filter((category) =>
      dayCategoryIDs.includes(category.recipeCategoryID)
    );
    const worldCategories = categories.filter(
      (category) => !dayCategoryIDs.includes(category.recipeCategoryID)
    );
    this.dayCategories.set(dayCategories);
    this.worldCategories.set(worldCategories);
  }
  // ********************************
}
