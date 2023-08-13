import { createSelector } from '@ngrx/store';
import { RecipeIngredient } from './recipe-ingredient-state';

export const selectRecipeIngredients = (state: any) => state.recipeIngredient.recipeIngredients;

export const selectRecipeIngredientByID = (recipeIngredientID: number) => {
  return createSelector(selectRecipeIngredients, (recipeIngredients: RecipeIngredient[]) => {
    return recipeIngredients.find((recipeIngredient: RecipeIngredient) => recipeIngredient.recipeIngredientID === recipeIngredientID);
  });
};

export const selectRecipeIngredientsByRecipeID = (recipeID: number) => {
  return createSelector(selectRecipeIngredients, (recipeIngredients: RecipeIngredient[]) => {
    return recipeIngredients.filter((recipeIngredient: RecipeIngredient) => recipeIngredient.recipeID === recipeID);
  });
}

export const selectDeleting = (state: any) => state.recipeIngredient.deleting;

export const selectAdding = (state: any) => state.recipeIngredient.adding;

export const selectUpdating = (state: any) => state.recipeIngredient.updating;

export const selectError = (state: any) => state.recipeIngredient.error;

export const selectLoading = (state: any) => state.recipeIngredient.loading;
