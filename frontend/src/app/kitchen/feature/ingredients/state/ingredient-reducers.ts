import { createReducer, on } from '@ngrx/store';
import { IngredientActions } from './ingredient-actions';
import { IngredientState } from './ingredient-state';

export const initialState: IngredientState = {
  ingredients: [],
  loading: false,
  deleting: false,
  adding: false,
  updating: false,
  error: null,
};

export const IngredientReducer = createReducer(
  initialState,
  on(IngredientActions.loadIngredients, (state) => ({
    ...state,
    loading: true,
    error: null,
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
    error: null,
  })),
  on(IngredientActions.loadIngredientSuccess, (state, { ingredient }) => {
    return {
      ...state,
      loading: false,
      ingredients: state.ingredients.map((storeIngredient) =>
        storeIngredient.ingredientID === ingredient.ingredientID
          ? ingredient
          : storeIngredient
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
    adding: true,
    error: null,
  })),
  on(IngredientActions.addIngredientSuccess, (state, { ingredient }) => ({
    ...state,
    adding: false,
    ingredients: [...state.ingredients, ingredient],
  })),
  on(IngredientActions.addIngredientFailure, (state, { error }) => ({
    ...state,
    error,
    adding: false,
  })),
  on(IngredientActions.deleteIngredient, (state) => ({
    ...state,
    deleting: true,
    error: null,
  })),
  on(IngredientActions.deleteIngredientSuccess, (state, { ingredientID }) => ({
    ...state,
    deleting: false,
    ingredients: state.ingredients.filter(
      (ingredient) => ingredient.ingredientID !== ingredientID
    ),
  })),
  on(IngredientActions.deleteIngredientFailure, (state, { error }) => ({
    ...state,
    error,
    deleting: false,
  })),
  on(IngredientActions.editIngredient, (state) => ({
    ...state,
    editing: true,
    error: null,
  })),
  on(IngredientActions.editIngredientSuccess, (state, { ingredient }) => ({
    ...state,
    editing: false,
    ingredients: state.ingredients.map((storeIngredient) =>
      storeIngredient.ingredientID === ingredient.ingredientID
        ? ingredient
        : storeIngredient
    ),
  })),
  on(IngredientActions.editIngredientFailure, (state, { error }) => ({
    ...state,
    error,
    editing: false,
  }))
);
