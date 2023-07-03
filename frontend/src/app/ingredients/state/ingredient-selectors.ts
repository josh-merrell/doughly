import { createSelector } from '@ngrx/store';
import { IngredientState } from './ingredient-state';

export const selectIngredients = (state: any) => state.ingredient.ingredients;

export const selectIngredientByID = (ingredientID: number) =>
  createSelector(selectIngredients, (ingredients) =>
    ingredients.find((ingredient: any) => ingredient.ingredientID === ingredientID)
  );
