import { createSelector } from '@ngrx/store';
import { RecipeIngredient } from './recipe-ingredient-state';
import { RecipeTool } from '../recipe-tool/recipe-tool-state';

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

export const selectRecipeIDsByIngredientID = (ingredientID: number) => {
  return createSelector(selectRecipeIngredients, (recipeIngredients: RecipeIngredient[]) => {
    const filtered = recipeIngredients.filter((recipeIngredient: RecipeIngredient) => recipeIngredient.ingredientID === ingredientID);
    //return list of recipeIDs without duplicates
    return filtered
      .map((recipeIngredient: RecipeIngredient) => recipeIngredient.recipeID)
      .filter(
        (recipeID: number, index: number, self: number[]) =>
          self.indexOf(recipeID) === index
      );
  });
};

export const selectDeleting = (state: any) => state.recipeIngredient.deleting;

export const selectAdding = (state: any) => state.recipeIngredient.adding;

export const selectUpdating = (state: any) => state.recipeIngredient.updating;

export const selectError = (state: any) => state.recipeIngredient.error;

export const selectLoading = (state: any) => state.recipeIngredient.loading;
