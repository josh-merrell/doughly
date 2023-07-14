import { createSelector } from '@ngrx/store';
import { Ingredient } from './ingredient-state';

export const selectIngredients = (state: any) => state.ingredient.ingredients;

export const selectIngredientByID = (ingredientID: number) =>
    createSelector(selectIngredients, (ingredients) => {
      return ingredients.find((ingredient: Ingredient) => ingredient.ingredientID === ingredientID)
    }
  );

export const selectDeleting = (state: any) => state.ingredient.deleting;

export const selectAdding = (state: any) => state.ingredient.adding;
