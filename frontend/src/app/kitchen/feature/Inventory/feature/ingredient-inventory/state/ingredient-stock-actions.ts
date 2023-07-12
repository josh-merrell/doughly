import { createAction, props } from '@ngrx/store';
import { IngredientStock } from './ingredient-stock-state';

const loadIngredientStocks = createAction('[IngredientStocks] Load');
const loadIngredientStocksSuccess = createAction(
  '[IngredientStocks] Load Success',
  props<{ ingredientStocks: IngredientStock[] }>()
  );  
const loadIngredientStocksFailure = createAction(
  '[IngredientStocks] Load Failure',
  props<{ error: any }>()
  );

const loadIngredientStock = createAction(
  '[IngredientStocks] Load Single',
  props<{ ingredientStockID: number }>()
);
const loadIngredientStockSuccess = createAction(
  '[IngredientStocks] Load Single Success',
  props<{ ingredientStock: IngredientStock }>()
);
const loadIngredientStockFailure = createAction(
  '[IngredientStocks] Load Single Failure',
  props<{ error: any }>()
);
    
const addIngredientStock = createAction(
  '[IngredientStocks] Add',
  props<{ ingredientStock: IngredientStock }>()
);
const addIngredientStockSuccess = createAction(
  '[IngredientStocks] Add Success',
  props<{ ingredientStocks: IngredientStock }>()
);
const addIngredientStockFailure = createAction(
  '[IngredientStocks] Add Failure',
  props<{ error: any }>()
);

export const IngredientStockActions = {
  loadIngredientStocks,
  loadIngredientStocksSuccess,
  loadIngredientStocksFailure,
  addIngredientStock,
  addIngredientStockSuccess,
  addIngredientStockFailure,
  loadIngredientStock,
  loadIngredientStockSuccess,
  loadIngredientStockFailure,
};
