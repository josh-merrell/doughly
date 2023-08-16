import { createSelector } from '@ngrx/store';
import { RecipeStep } from './recipe-step-state';

export const selectRecipeSteps = (state: any) => state.recipeStep.recipeSteps;

export const selectRecipeStepsByID = (recipeID: number) => {
  return createSelector(selectRecipeSteps, (recipeSteps: RecipeStep[]) => {
    return recipeSteps.filter((recipeStep: RecipeStep) => recipeStep.recipeID === recipeID);
  });
}

export const selectRecipeStepByID = (recipeStepID: number) => {
  return createSelector(selectRecipeSteps, (recipeSteps: RecipeStep[]) => {
    return recipeSteps.find((recipeStep: RecipeStep) => recipeStep.recipeStepID === recipeStepID);
  });
};

export const selecteDeletingRecipeStep = (state: any) => state.recipeStep.deleting;

export const selectAddingRecipeStep = (state: any) => state.recipeStep.adding;

export const selectUpdatingRecipeStep = (state: any) => state.recipeStep.updating;

export const selectErrorRecipeStep = (state: any) => state.recipeStep.error;

export const selectLoadingRecipeStep = (state: any) => state.recipeStep.loading;