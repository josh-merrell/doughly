import { Input, Component, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeCategoryCardComponent } from '../../ui/recipe-category/recipe-category-card/recipe-category-card.component';
import { RecipeCardComponent } from '../../ui/recipe/recipe-card/recipe-card.component';
import { Recipe } from 'src/app/recipes/state/recipe/recipe-state';
import { RecipeCategory } from 'src/app/recipes/state/recipe-category/recipe-category-state';
import { Store } from '@ngrx/store';
import { selectRecipes } from 'src/app/recipes/state/recipe/recipe-selectors';
import { selectRecipeCategories } from 'src/app/recipes/state/recipe-category/recipe-category-selectors';

@Component({
  selector: 'dl-created-recipes',
  standalone: true,
  imports: [CommonModule, RecipeCategoryCardComponent, RecipeCardComponent],
  templateUrl: './created-recipes.component.html',
})
export class CreatedRecipesComponent {
  @Input() listView!: string;
  public searchFilter: WritableSignal<string> = signal('');
  public categories: WritableSignal<RecipeCategory[] | null> = signal(null);
  public recipes: WritableSignal<Recipe[] | null> = signal(null);

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.store.select(selectRecipes).subscribe((recipes) => {
      this.recipes.set(recipes);
    });
    this.store.select(selectRecipeCategories).subscribe((categories) => {
      this.categories.set(categories);
    });
  }

  //** INTERACTIVITY FUNCTIONS **************************
  updateSearchFilter(searchFilter: string): void {
    this.searchFilter.set(searchFilter);
  }
  onAddClick(): void {
    console.log('Add Clicked');
  }
  categoryCardClick(category: RecipeCategory): void {
    console.log('Category Card Clicked');
  }
  recipeCardClick(recipe: Recipe): void {
    console.log('Recipe Card Clicked');
  }
  // ***************************************************
}
