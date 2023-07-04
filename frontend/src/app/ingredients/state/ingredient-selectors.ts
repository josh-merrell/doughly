import { createSelector } from '@ngrx/store';

export const selectIngredients = (state: any) => state.ingredient.ingredients;

export const selectIngredientByID = (ingredientID: number) =>
  createSelector(selectIngredients, (ingredients) =>
    ingredients.find((ingredient: any) => ingredient.ingredientID === ingredientID)
  );
