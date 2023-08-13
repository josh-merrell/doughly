import { createSelector } from '@ngrx/store';
import { RecipeTool } from './recipe-tool-state';

export const selectRecipeTools = (state: any) => state.recipeTool.recipeTools;

export const selectRecipeToolByID = (recipeToolID: number) => {
  return createSelector(selectRecipeTools, (recipeTools: RecipeTool[]) => {
    return recipeTools.find((recipeTool: RecipeTool) => recipeTool.recipeToolID === recipeToolID);
  });
}

export const selectDeleting = (state: any) => state.recipeTool.deleting;

export const selectAdding = (state: any) => state.recipeTool.adding;

export const selectUpdating = (state: any) => state.recipeTool.updating;

export const selectError = (state: any) => state.recipeTool.error;

export const selectLoading = (state: any) => state.recipeTool.loading;
