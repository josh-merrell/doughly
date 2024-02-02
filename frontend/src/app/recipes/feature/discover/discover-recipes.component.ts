import { Component, WritableSignal, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeCategory } from '../../state/recipe-category/recipe-category-state';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { RecipeCategoryCardComponent } from '../recipes-page/ui/recipe-category/recipe-category-card/recipe-category-card.component';
import { selectRecipeCategories } from '../../state/recipe-category/recipe-category-selectors';
import { Recipe } from '../../state/recipe/recipe-state';
import { selectDiscoverRecipes } from '../../state/recipe/recipe-selectors';

@Component({
  selector: 'dl-discover-recipes',
  standalone: true,
  imports: [CommonModule, RecipeCategoryCardComponent],
  templateUrl: './discover-recipes.component.html',
})
export class DiscoverRecipesComponent {
  public discoverRecipes: WritableSignal<Recipe[]> = signal([]);
  public selectedCategory: WritableSignal<RecipeCategory | null> = signal(null);
  private categories: WritableSignal<RecipeCategory[]> = signal([]);
  public displayCategories: WritableSignal<RecipeCategory[]> = signal([]);

  constructor(private store: Store, private router: Router) {
    effect(() => {
      const categories = this.categories();
      const recipes = this.discoverRecipes();

      // populate the 'recipes' array on each category with the recipes that belong to that category
      const categoriesWithRecipes = categories.map((category) => {
        const categoryWithRecipes = {
          ...category,
          recipes: recipes.filter((recipe) => recipe.recipeCategoryID === category.recipeCategoryID),
        };
        categoryWithRecipes['recipeCount'] = categoryWithRecipes.recipes.length;
        return categoryWithRecipes;
      });
      
      this.displayCategories.set(categoriesWithRecipes);
    }, { allowSignalWrites: true })
  }

  ngOnInit(): void {
    this.store.select(selectRecipeCategories).subscribe((categories) => {
      this.categories.set(categories);
    });
    this.store.select(selectDiscoverRecipes).subscribe((recipes) => {
      this.discoverRecipes.set(recipes);
    });
  }

  categoryCardClick(category: any) {
    if (this.selectedCategory() === null) {
      this.selectedCategory.set(category);
    } else if (this.selectedCategory()?.recipeCategoryID === category.recipeCategoryID) {
      this.selectedCategory.set(null);
    } else {
      this.selectedCategory.set(category);
    }
  }
}
