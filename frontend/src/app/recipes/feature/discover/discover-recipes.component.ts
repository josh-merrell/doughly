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
  public displayCategories: WritableSignal<RecipeCategory[]> = signal([]);

  // Auto-scrolling upon Category Selection
  @ViewChildren('categoryCard') categoryCards!: QueryList<ElementRef>;

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

        this.displayCategories.set(categoriesWithRecipes);
        // console.log(`RECIPES WITH CATEGORIES: `, categoriesWithRecipes)
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
  }

  onRecipeCardClick(recipeID: number): void {
    this.router.navigate(['/recipe/public', recipeID]);
  }

  // Category Click and Auto-Scrolling
  ngAfterViewInit() {
    this.categoryCards.changes.subscribe(() => {
      if (this.selectedCategory()) {
        this.scrollToCategory();
      }
    });
  }

  scrollToCategory() {
    const selectedCategoryIndex = this.displayCategories().findIndex(
      (category) =>
        category.recipeCategoryID === this.selectedCategory()?.recipeCategoryID
    );
    if (selectedCategoryIndex !== -1) {
      const categoryElement =
        this.categoryCards.toArray()[selectedCategoryIndex];
      categoryElement.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }

  categoryCardClick(category: any) {
    if (category.recipeCount === 0) return;
    const previouslySelected =
      this.selectedCategory()?.recipeCategoryID === category.recipeCategoryID;
    this.selectedCategory.set(previouslySelected ? null : category);
    if (!previouslySelected) {
      setTimeout(() => this.scrollToCategory(), 0); // Ensure DOM updates have occurred
    }
  }
  // ********************************
}
