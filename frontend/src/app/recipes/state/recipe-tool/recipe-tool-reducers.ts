import { createReducer, on } from '@ngrx/store';
import { RecipeToolActions } from './recipe-tool-actions';
import { RecipeToolState } from './recipe-tool-state';

export const initialState: RecipeToolState = {
  recipeTools: [],
  loading: false,
  error: null,
  adding: false,
  updating: false,
  deleting: false,
};

export const RecipeToolReducer = createReducer(
  initialState,
  on(RecipeToolActions.loadRecipeTools, (state) => ({
    ...state,
    error: null,
    loading: true,
  })),
  on(
    RecipeToolActions.loadRecipeToolsSuccess,
    (state, { recipeTools }) => ({
      ...state,
      recipeTools,
      loading: false,
    })
  ),
  on(
    RecipeToolActions.loadRecipeToolsFailure,
    (state, { error }) => ({
      ...state,
      error,
      loading: false,
    })
  ),
  on(RecipeToolActions.loadRecipeTool, (state) => ({
    ...state,
    error: null,
    loading: true,
  })),
  on(
    RecipeToolActions.loadRecipeToolSuccess,
    (state, { recipeTool }) => {
      return {
        ...state,
        loading: false,
        recipeTools: state.recipeTools.map(
          (existingRecipeTool) =>
            existingRecipeTool.recipeToolID ===
            recipeTool.recipeToolID
              ? recipeTool
              : existingRecipeTool
        ),
      };
    }
  ),
  on(
    RecipeToolActions.loadRecipeToolFailure,
    (state, { error }) => ({
      ...state,
      error,
      loading: false,
    })
  ),
  on(RecipeToolActions.addRecipeTool, (state) => ({
    ...state,
    error: null,
    adding: true,
  })),
  on(
    RecipeToolActions.addRecipeToolSuccess,
    (state, { recipeTool }) => ({
      ...state,
      recipeTools: [...state.recipeTools, recipeTool],
      adding: false,
    })
  ),
  on(
    RecipeToolActions.addRecipeToolFailure,
    (state, { error }) => ({
      ...state,
      error,
      adding: false,
    })
  ),
  on(RecipeToolActions.deleteRecipeTool, (state) => ({
    ...state,
    error: null,
    deleting: true,
  })),
  on(
    RecipeToolActions.deleteRecipeToolSuccess,
    (state, { recipeToolID }) => ({
      ...state,
      recipeTools: state.recipeTools.filter(
        (recipeTool) => recipeTool.recipeToolID !== recipeToolID
      ),
      deleting: false,
    })
  ),
  on(
    RecipeToolActions.deleteRecipeToolFailure,
    (state, { error }) => ({
      ...state,
      error,
      deleting: false,
    })
  ),
  on(RecipeToolActions.updateRecipeTool, (state) => ({
    ...state,
    error: null,
    updating: true,
  })),
  on(
    RecipeToolActions.updateRecipeToolSuccess,
    (state, { recipeTool }) => ({
      ...state,
      recipeTools: state.recipeTools.map((item) =>

        item.recipeToolID === recipeTool.recipeToolID
          ? recipeTool
          : item
      ),
      updating: false,
    })
  ),
  on(
    RecipeToolActions.updateRecipeToolFailure,
    (state, { error }) => ({
      ...state,
      error,
      updating: false,
    })
  )
);

