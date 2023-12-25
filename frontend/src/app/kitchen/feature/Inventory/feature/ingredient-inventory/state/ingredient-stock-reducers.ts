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
    error: null,
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
    error: null,
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
  })),
  on(IngredientStockActions.addIngredientStock, (state) => ({
    ...state,
    error: null,
    adding: true,
  })),
  on(
    IngredientStockActions.addIngredientStockSuccess,
    (state, { ingredientStock }) => ({
      ...state,
      adding: false,
      ingredientStocks: [...state.ingredientStocks, ingredientStock],
    })
  ),
  on(IngredientStockActions.addIngredientStockFailure, (state, { error }) => ({
    ...state,
    error,
    adding: false,
  })),
  on(IngredientStockActions.bulkAddIngredientStocks, (state) => ({
    ...state,
    error: null,
    adding: true,
  })),
  on(
    IngredientStockActions.bulkAddIngredientStocksSuccess,
    (state, { ingredientStocks }) => ({
      ...state,
      adding: false,
      ingredientStocks: [...state.ingredientStocks, ...ingredientStocks],
    })
  ),
  on(
    IngredientStockActions.bulkAddIngredientStocksFailure,
    (state, { error }) => ({
      ...state,
      error,
      adding: false,
    })
  ),
  on(IngredientStockActions.updateIngredientStock, (state) => ({
    ...state,
    error: null,
    updating: true,
  })),
  on(
    IngredientStockActions.updateIngredientStockSuccess,
    (state, { ingredientStock }) => ({
      ...state,
      updating: false,
      ingredientStocks: state.ingredientStocks.map((stock) =>
        stock.ingredientStockID === ingredientStock.ingredientStockID ? ingredientStock : stock
      ),
    })
  ),
  on(IngredientStockActions.updateIngredientStockFailure, (state, { error }) => ({
    ...state,
    error,
    updating: false,
  })),
  on(IngredientStockActions.deleteIngredientStock, (state) => ({
    ...state,
    error: null,
    deleting: true,
  })),
  on(
    IngredientStockActions.deleteIngredientStockSuccess,
    (state, { ingredientStockID }) => ({
      ...state,
      deleting: false,
      ingredientStocks: state.ingredientStocks.filter(
        (stock) => stock.ingredientStockID !== ingredientStockID
      ),
    })
  ),
  on(IngredientStockActions.deleteIngredientStockFailure, (state, { error }) => ({
    ...state,
    error,
    deleting: false,
  }))
);