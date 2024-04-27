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

export const selectUpdating = (state: any) => state.ingredient.updating;

export const selectError = (state: any) => state.ingredient.error;

export const selectLoading = (state: any) => state.ingredient.loading;

export const selectIngredientByName = (name: string) =>
  createSelector(selectIngredients, (ingredients) => {
    return ingredients.find((ingredient: Ingredient) => ingredient.name === name);
  });