import { createReducer, on } from '@ngrx/store';
import { ShoppingListIngredientActions } from './shopping-list-ingredient-actions';
import { ShoppingListIngredientState } from './shopping-list-ingredient-state';

export const initialState: ShoppingListIngredientState = {
  shoppingListIngredients: [],
  loading: false,
  deleting: false,
  adding: false,
  updating: false,
  error: null,
};

export const ShoppingListIngredientReducer = createReducer(
  initialState,
  on(ShoppingListIngredientActions.loadShoppingListIngredients, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ShoppingListIngredientActions.loadShoppingListIngredientsSuccess, (state, { shoppingListIngredients }) => ({
    ...state,
    shoppingListIngredients,
    loading: false,
  })),
  on(ShoppingListIngredientActions.loadShoppingListIngredientsFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(ShoppingListIngredientActions.addShoppingListIngredient, (state) => ({
    ...state,
    adding: true,
    error: null,
  })),
  on(ShoppingListIngredientActions.addShoppingListIngredientSuccess, (state, { shoppingListIngredient }) => ({
    ...state,
    shoppingListIngredients: [...state.shoppingListIngredients, shoppingListIngredient],
    adding: false,
  })),
  on(ShoppingListIngredientActions.addShoppingListIngredientFailure, (state, { error }) => ({
    ...state,
    error,
    adding: false,
  })),
  on(ShoppingListIngredientActions.updateShoppingListIngredient, (state) => ({
    ...state,
    updating: true,
    error: null,
  })),
  on(ShoppingListIngredientActions.updateShoppingListIngredientSuccess, (state, { shoppingListIngredientID }) => ({
    ...state,
    shoppingListIngredients: state.shoppingListIngredients.map((shoppingListIngredient) => {
      if (shoppingListIngredient.shoppingListIngredientID === shoppingListIngredientID) {
        return { ...shoppingListIngredient, purchasedMeasurement: shoppingListIngredient.purchasedMeasurement, purchasedUnit: shoppingListIngredient.purchasedUnit, store: shoppingListIngredient.store };
      }
      return shoppingListIngredient;
    }),
    updating: false,
  })),
  on(ShoppingListIngredientActions.updateShoppingListIngredientFailure, (state, { error }) => ({
    ...state,
    error,
    updating: false,
  })),
  on(ShoppingListIngredientActions.deleteShoppingListIngredient, (state) => ({
    ...state,
    deleting: true,
    error: null,
  })),
  on(ShoppingListIngredientActions.deleteShoppingListIngredientSuccess, (state, { shoppingListIngredientID }) => ({
    ...state,
    shoppingListIngredients: state.shoppingListIngredients.filter((shoppingListIngredient) => shoppingListIngredient.shoppingListIngredientID !== shoppingListIngredientID),
    deleting: false,
  })),
  on(ShoppingListIngredientActions.deleteShoppingListIngredientFailure, (state, { error }) => ({
    ...state,
    error,
    deleting: false,
  }))
);