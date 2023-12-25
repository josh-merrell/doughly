import { createSelector } from '@ngrx/store';
import { RecipeTool } from './recipe-tool-state';

export const selectRecipeTools = (state: any) => state.recipeTool.recipeTools;

export const selectRecipeToolByID = (recipeToolID: number) => {
  return createSelector(selectRecipeTools, (recipeTools: RecipeTool[]) => {
    return recipeTools.find((recipeTool: RecipeTool) => recipeTool.recipeToolID === recipeToolID);
  });
}

export const selectRecipeToolsByRecipeID = (recipeID: number) => {
  return createSelector(selectRecipeTools, (recipeTools: RecipeTool[]) => {
    return recipeTools.filter((recipeTool: RecipeTool) => recipeTool.recipeID === recipeID);
  });
}

export const selectRecipeIDsByToolID = (toolID: number) => {
  return createSelector(
    selectRecipeTools,
    (recipeTools: RecipeTool[]) => {
      const filtered = recipeTools.filter(
        (recipeTool: RecipeTool) => recipeTool.toolID === toolID
      );
      //return list of recipeIDs without duplicates
      return filtered
        .map((recipeTool: RecipeTool) => recipeTool.recipeID)
        .filter(
          (recipeID: number, index: number, self: number[]) =>
            self.indexOf(recipeID) === index
        );
    }
  );
};

export const selectDeleting = (state: any) => state.recipeTool.deleting;

export const selectAdding = (state: any) => state.recipeTool.adding;

export const selectUpdating = (state: any) => state.recipeTool.updating;

export const selectError = (state: any) => state.recipeTool.error;

export const selectLoading = (state: any) => state.recipeTool.loading;
