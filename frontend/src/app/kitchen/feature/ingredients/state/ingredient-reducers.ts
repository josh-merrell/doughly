import { createReducer, on } from '@ngrx/store';
import { Ingredient } from './ingredient-state';
import { IngredientActions } from './ingredient-actions';
import { IngredientState } from './ingredient-state';

export const initialState: IngredientState = {
  ingredients: [],
  loading: false,
  deleting: false,
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
  })),
  on(IngredientActions.loadIngredient, (state) => ({
    ...state,
    loading: true,
  })),
  on(IngredientActions.loadIngredientSuccess, (state, { ingredient }) => {
    return {
      ...state,
      loading: false,
      ingredients: state.ingredients.map((storeIngredient) =>
        storeIngredient.ingredientID === ingredient.ingredientID ? ingredient : storeIngredient
      ),
    };
  }),
  on(IngredientActions.loadIngredientFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(IngredientActions.addIngredient, (state) => ({
    ...state,
    loading: true,
  })),
  on(IngredientActions.addIngredientSuccess, (state, { ingredient }) => ({
    ...state,
    loading: false,
    ingredients: [...state.ingredients, ingredient],
  })),
  on(IngredientActions.addIngredientFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(IngredientActions.deleteIngredient, (state) => ({
    ...state,
    deleting: true,
  })),
  on(IngredientActions.deleteIngredientSuccess, (state, { ingredientID }) => ({
    ...state,
    deleting: false,
    ingredients: state.ingredients.filter((ingredient) => ingredient.ingredientID !== ingredientID),
  })),
  on(IngredientActions.deleteIngredientFailure, (state, { error }) => ({
    ...state,
    error,
    deleting: false,
  }))

);
