import { createSelector } from '@ngrx/store';
import { Recipe } from './recipe-state';

export const selectRecipes = (state: any) => state.recipe.recipes;

export const selectRecipeByID = (recipeID: number) => {
  return createSelector(selectRecipes, (recipes: Recipe[]) => {
    return recipes.find((recipe: Recipe) => recipe.recipeID === recipeID);
  });
};

export const selectDeleting = (state: any) => state.recipe.deleting;

export const selectAdding = (state: any) => state.recipe.adding;

export const selectUpdating = (state: any) => state.recipe.updating;

export const selectError = (state: any) => state.recipe.error;

export const selectLoading = (state: any) => state.recipe.loading;
