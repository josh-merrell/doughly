import { createAction, props } from '@ngrx/store';
import { RecipeStep } from './recipe-step-state';

const loadRecipeSteps = createAction(`[RecipeStep] Load`);
const loadRecipeStepsSuccess = createAction(`[RecipeStep] Load Success`, props<{ recipeSteps: RecipeStep[] }>());
const loadRecipeStepsFailure = createAction(`[RecipeStep] Load Failure`, props<{ error: any }>());

const loadRecipeStep = createAction(`[RecipeStep] Load Single`, props<{ recipeStepID: number }>());
const loadRecipeStepSuccess = createAction(`[RecipeStep] Load Single Success`, props<{ recipeStep: RecipeStep }>());
const loadRecipeStepFailure = createAction(`[RecipeStep] Load Single Failure`, props<{ error: any }>());

const addRecipeStep = createAction(`[RecipeStep] Add`, props<{ recipeStep: any }>());
const addRecipeStepSuccess = createAction(`[RecipeStep] Add Success`, props<{ recipeStep: RecipeStep }>());
const addRecipeStepFailure = createAction(`[RecipeStep] Add Failure`, props<{ error: any }>());

const updateRecipeStep = createAction(`[RecipeStep] Edit`, props<{ recipeStep: RecipeStep }>());
const updateRecipeStepSuccess = createAction(`[RecipeStep] Edit Success`, props<{ recipeStep: RecipeStep }>());
const updateRecipeStepFailure = createAction(`[RecipeStep] Edit Failure`, props<{ error: any }>());

const deleteRecipeStep = createAction(`[RecipeStep] Delete`, props<{ recipeStepID: number }>());
const deleteRecipeStepSuccess = createAction(`[RecipeStep] Delete Success`, props<{ recipeStepID: number }>());
const deleteRecipeStepFailure = createAction(`[RecipeStep] Delete Failure`, props<{ error: any }>());

const updateRecipeStepSequence = createAction(`[RecipeStep] Update Sequence`, props<{ recipeStep: RecipeStep, newSequence: number }>());

export const RecipeStepActions = {
  loadRecipeSteps,
  loadRecipeStepsSuccess,
  loadRecipeStepsFailure,
  loadRecipeStep,
  loadRecipeStepSuccess,
  loadRecipeStepFailure,
  addRecipeStep,
  addRecipeStepSuccess,
  addRecipeStepFailure,
  updateRecipeStep,
  updateRecipeStepSuccess,
  updateRecipeStepFailure,
  deleteRecipeStep,
  deleteRecipeStepSuccess,
  deleteRecipeStepFailure,
  updateRecipeStepSequence,
};
