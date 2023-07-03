import { createReducer, on } from '@ngrx/store';
import { Ingredient } from './ingredient-state';
import { IngredientActions } from './ingredient-actions';
import { IngredientState } from './ingredient-state';

export const initialState: IngredientState = {
  ingredients: [],
  loading: false,
  error: null,
};

export const IngredientReducer = createReducer(
  initialState,
  on(IngredientActions.loadIngredients, (state) => ({
    ...state,
    loading: true,
  })),
  on(IngredientActions.loadIngredientsSuccess, (state, { ingredients }) => ({
    ...state,
    ingredients,
    loading: false,
  })),
  on(IngredientActions.loadIngredientsFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  }))
);
