import { createReducer, on } from '@ngrx/store';
import { RecipeIngredientActions } from './recipe-ingredient-actions';
import { RecipeIngredientState } from './recipe-ingredient-state';

export const initialState: RecipeIngredientState = {
  recipeIngredients: [],
  loading: false,
  error: null,
  adding: false,
  updating: false,
  deleting: false,
};

export const RecipeIngredientReducer = createReducer(
  initialState,
  on(RecipeIngredientActions.loadRecipeIngredients, (state) => ({
    ...state,
    error: null,
    loading: true,
  })),
  on(
    RecipeIngredientActions.loadRecipeIngredientsSuccess,
    (state, { recipeIngredients }) => ({
      ...state,
      recipeIngredients,
      loading: false,
    })
  ),
  on(
    RecipeIngredientActions.loadRecipeIngredientsFailure,
    (state, { error }) => ({
      ...state,
      error,
      loading: false,
    })
  ),
  on(RecipeIngredientActions.loadRecipeIngredient, (state) => ({
    ...state,
    error: null,
    loading: true,
  })),
  on(
    RecipeIngredientActions.loadRecipeIngredientSuccess,
    (state, { recipeIngredient }) => {
      return {
        ...state,
        loading: false,
        recipeIngredients: state.recipeIngredients.map(
          (existingRecipeIngredient) =>
            existingRecipeIngredient.recipeIngredientID ===
            recipeIngredient.recipeIngredientID
              ? recipeIngredient
              : existingRecipeIngredient
        ),
      };
    }
  ),
  on(
    RecipeIngredientActions.loadRecipeIngredientFailure,
    (state, { error }) => ({
      ...state,
      error,
      loading: false,
    })
  ),
  on(RecipeIngredientActions.addRecipeIngredient, (state) => ({
    ...state,
    error: null,
    adding: true,
  })),
  on(
    RecipeIngredientActions.addRecipeIngredientSuccess,
    (state, { recipeIngredient }) => ({
      ...state,
      recipeIngredients: [...state.recipeIngredients, recipeIngredient],
      adding: false,
    })
  ),
  on(
    RecipeIngredientActions.addRecipeIngredientFailure,
    (state, { error }) => ({
      ...state,
      error,
      adding: false,
    })
  ),
  on(RecipeIngredientActions.updateRecipeIngredient, (state) => ({
    ...state,
    error: null,
    updating: true,
  })),
  on(
    RecipeIngredientActions.updateRecipeIngredientSuccess,
    (state, { recipeIngredient }) => ({
      ...state,
      recipeIngredients: state.recipeIngredients.map((item) =>
        item.recipeIngredientID === recipeIngredient.recipeIngredientID
          ? recipeIngredient
          : item
      ),
      updating: false,
    })
  ),
  on(
    RecipeIngredientActions.updateRecipeIngredientFailure,
    (state, { error }) => ({
      ...state,
      error,
      updating: false,
    })
  ),
  on(RecipeIngredientActions.deleteRecipeIngredient, (state) => ({
    ...state,
    error: null,
    deleting: true,
  })),
  on(
    RecipeIngredientActions.deleteRecipeIngredientSuccess,
    (state, { recipeIngredientID }) => ({
      ...state,
      recipeIngredients: state.recipeIngredients.filter(
        (item) =>
          item.recipeIngredientID !== recipeIngredientID
      ),
      deleting: false,
    })
  ),
  on(
    RecipeIngredientActions.deleteRecipeIngredientFailure,
    (state, { error }) => ({
      ...state,
      error,
      deleting: false,
    })
  )
);

