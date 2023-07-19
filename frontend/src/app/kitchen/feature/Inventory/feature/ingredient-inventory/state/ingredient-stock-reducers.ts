import { createReducer, on } from '@ngrx/store';
import { IngredientStockActions } from './ingredient-stock-actions';
import { IngredientStockState } from './ingredient-stock-state';

export const initialState: IngredientStockState = {
  ingredientStocks: [],
  loading: false,
  error: null,
  adding: false,
  updating: false,
  deleting: false,
};

export const ingredientStockReducer = createReducer(
  initialState,
  on(IngredientStockActions.loadIngredientStocks, (state) => ({
    ...state,
    loading: true,
  })),
  on(
    IngredientStockActions.loadIngredientStocksSuccess,
    (state, { ingredientStocks }) => ({
      ...state,
      ingredientStocks,
      loading: false,
    })
  ),
  on(
    IngredientStockActions.loadIngredientStocksFailure,
    (state, { error }) => ({
      ...state,
      error,
      loading: false,
    })
  ),
  on(IngredientStockActions.loadIngredientStock, (state) => ({
    ...state,
    loading: true,
  })),
  on(
    IngredientStockActions.loadIngredientStockSuccess,
    (state, { ingredientStock }) => {
      return {
        ...state,
        loading: false,
        ingredientStocks: state.ingredientStocks.map((stock) =>
          stock.ingredientStockID === ingredientStock.ingredientStockID ? ingredientStock : stock
        ),
      };
    }
  ),
  on(IngredientStockActions.loadIngredientStockFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  }))
);