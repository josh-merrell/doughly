import { createSelector } from '@ngrx/store';
import { RecipeStep } from './recipe-step-state';

export const selectRecipeSteps = (state: any) => state.recipeStep.recipeSteps;

export const selectRecipeStepByID = (recipeStepID: number) => {
  return createSelector(selectRecipeSteps, (recipeSteps: RecipeStep[]) => {
    return recipeSteps.find((recipeStep: RecipeStep) => recipeStep.recipeStepID === recipeStepID);
  });
};

export const selecteDeleting = (state: any) => state.recipeStep.deleting;

export const selectAdding = (state: any) => state.recipeStep.adding;

export const selectUpdating = (state: any) => state.recipeStep.updating;

export const selectError = (state: any) => state.recipeStep.error;

export const selectLoading = (state: any) => state.recipeStep.loading;