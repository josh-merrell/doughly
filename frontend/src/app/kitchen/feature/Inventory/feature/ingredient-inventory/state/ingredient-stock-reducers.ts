import { createReducer, on } from '@ngrx/store';
import { IngredientStock } from './ingredient-stock-state';
import { IngredientStockActions } from './ingredient-stock-actions';
import { IngredientStockState } from './ingredient-stock-state';

export const initialState: IngredientStockState = {
  ingredientStocks: [],
  loading: false,
  error: null,
};

export const ingredientStockReducer = createReducer(
  initialState,
  on(IngredientStockActions.loadIngredientStocks, (state) => ({
    ...state,
    loading: true,
  })),
  on(IngredientStockActions.loadIngredientStocksSuccess, (state, { ingredientStocks }) => ({
    ...state,
    ingredientStocks,
    loading: false,
  })),
  on(IngredientStockActions.loadIngredientStocksFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  }))
);