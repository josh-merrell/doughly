import { createReducer, on } from '@ngrx/store';
import { RecipeStepActions } from './recipe-step-actions';
import { RecipeStepState } from './recipe-step-state';

export const initialState: RecipeStepState = {
  recipeSteps: [],
  loading: false,
  error: null,
  adding: false,
  updating: false,
  deleting: false,
};

export const RecipeStepReducer = createReducer(
  initialState,
  on(RecipeStepActions.loadRecipeSteps, state => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(RecipeStepActions.loadRecipeStepsSuccess, (state, { recipeSteps }) => ({
    ...state,
    recipeSteps,
    loading: false,
  })),
  on(RecipeStepActions.loadRecipeStepsFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(RecipeStepActions.loadRecipeStep, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(RecipeStepActions.loadRecipeStepSuccess, (state, { recipeStep }) => {
    return {
      ...state,
      loading: false,
      recipeSteps: state.recipeSteps.map((existingRecipeStep) => existingRecipeStep.recipeStepID === recipeStep.recipeStepID ? recipeStep : existingRecipeStep
      ),
    };
  }),
  on(RecipeStepActions.loadRecipeStepFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(RecipeStepActions.addRecipeStep, (state) => ({
    ...state,
    adding: true,
    error: null,
  })),
  on(RecipeStepActions.addRecipeStepSuccess, (state, { recipeStep }) => ({
    ...state,
    recipeSteps: [...state.recipeSteps, recipeStep],
    adding: false,
  })),
  on(RecipeStepActions.addRecipeStepFailure, (state, { error }) => ({
    ...state,
    error,
    adding: false,
  })),
  on(RecipeStepActions.updateRecipeStep, (state) => ({
    ...state,
    updating: true,
    error: null,
  })),
  on(RecipeStepActions.updateRecipeStepSuccess, (state, { recipeStep }) => ({
    ...state,
    recipeSteps: state.recipeSteps.map((existingRecipeStep) => existingRecipeStep.recipeStepID === recipeStep.recipeStepID ? recipeStep : existingRecipeStep
    ),
    updating: false,
  })),
  on(RecipeStepActions.updateRecipeStepFailure, (state, { error }) => ({
    ...state,
    error,
    updating: false,
  })),
  on(RecipeStepActions.deleteRecipeStep, (state) => ({
    ...state,
    deleting: true,
    error: null,
  })),
  on(RecipeStepActions.deleteRecipeStepSuccess, (state, { recipeStepID }) => ({
    ...state,
    recipeSteps: state.recipeSteps.filter((existingRecipeStep) => existingRecipeStep.recipeStepID !== recipeStepID),
    deleting: false,
  })),
  on(RecipeStepActions.deleteRecipeStepFailure, (state, { error }) => ({
    ...state,
    error,
    deleting: false,
  })),
  on(RecipeStepActions.updateRecipeStepSequence, (state, { recipeStep, newSequence }) => ({
    ...state,
    error: null,
    recipeSteps: state.recipeSteps.map((existingRecipeStep) => existingRecipeStep.recipeStepID === recipeStep.recipeStepID ? { ...recipeStep, sequence: newSequence } : existingRecipeStep),
  }))
)