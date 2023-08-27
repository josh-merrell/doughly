import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription, combineLatest, map, take } from 'rxjs';
import { Store } from '@ngrx/store';
import {
  selectRecipeByID,
  selectRecipes,
} from '../../state/recipe/recipe-selectors';
import { selectRecipeIngredientsByRecipeID } from '../../state/recipe-ingredient/recipe-ingredient-selectors';
import { selectIngredients } from 'src/app/kitchen/feature/ingredients/state/ingredient-selectors';
import { selectRecipeToolsByRecipeID } from '../../state/recipe-tool/recipe-tool-selectors';
import { Recipe } from '../../state/recipe/recipe-state';
import { selectRecipeCategoryByID } from '../../state/recipe-category/recipe-category-selectors';

@Component({
  selector: 'dl-recipe',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recipe.component.html',
})
export class RecipeComponent {
  recipeID!: number;
  recipe$!: Observable<any>;
  recipeCategory$!: Observable<any>;
  recipeIngredients$!: Observable<any[]>;
  displayIngredients$!: Observable<any[]>;
  private recipeSubscription: Subscription = new Subscription();
  private recipeIngredientsSubscription: Subscription = new Subscription();
  ingredients$!: Observable<any[]>;
  recipeTools$!: Observable<any[]>;
  recipeSteps$!: Observable<any[]>;

  constructor(private route: ActivatedRoute, private store: Store) {
    this.route.params.subscribe((params) => {
      this.recipeID = Number(params['recipeID']);
    });
    this.recipe$ = this.store.select(selectRecipeByID(this.recipeID));
    this.recipeSubscription = this.store
      .select(selectRecipeByID(this.recipeID))
      .subscribe((recipe) => {
        this.recipeCategory$ = this.store.select(
          selectRecipeCategoryByID(recipe!.recipeCategoryID)
        );
      });
    this.recipeIngredients$ = this.store.select(
      selectRecipeIngredientsByRecipeID(this.recipeID)
    );
    this.ingredients$ = this.store.select(selectIngredients);
    this.recipeTools$ = this.store.select(
      selectRecipeToolsByRecipeID(this.recipeID)
    );
    this.recipeSteps$ = this.store.select(
      selectRecipeToolsByRecipeID(this.recipeID)
    );

    this.displayIngredients$ = combineLatest([
      this.recipeIngredients$,
      this.ingredients$,
    ]).pipe(
      map(([recipeIngredients, ingredients]) => {
        return recipeIngredients.map((recipeIngredient) => {
          const ingredient = ingredients.find(
            (ing) => ing.ingredientID === recipeIngredient.ingredientID
          );
          return {
            ...recipeIngredient,
            name: ingredient ? ingredient.name : 'Unknown',
          };
        });
      })
    );
  }

  timeString(minutes: number) {
    const hours = Math.floor(minutes / 60);
    if (hours === 0) return `${minutes} min`;
    const mins = minutes % 60;
    return `${hours} hr ${mins} min`;
  }

  editRecipe() {
    console.log('edit recipe');
  }

  editReciptIngredients() {
    console.log('edit recipe ingredients');
  }

  editRecipeTools() {
    console.log('edit recipe tools');
  }

  editRecipeSteps() {
    console.log('edit recipe steps');
  }

  ngOnDestroy() {
    if (this.recipeIngredientsSubscription) {
      this.recipeIngredientsSubscription.unsubscribe();
    }
    if (this.recipeSubscription) {
      this.recipeSubscription.unsubscribe();
    }
  }
}
