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
  props<{ ingredientStock: IngredientStock }>()
);
const addIngredientStockFailure = createAction(
  '[IngredientStocks] Add Failure',
  props<{ error: any }>()
);
const bulkAddIngredientStocks = createAction(
  '[IngredientStocks] Bulk Add',
  props<{ ingredientStocks: any[], shoppingListID }>()
);
const bulkAddIngredientStocksSuccess = createAction(
  '[IngredientStocks] Bulk Add Success',
  props<{ ingredientStocks: IngredientStock[], shoppingListID: number }>()
);
const bulkAddIngredientStocksFailure = createAction(
  '[IngredientStocks] Bulk Add Failure',
  props<{ error: any }>()
);
const deleteIngredientStock = createAction(
  '[IngredientStocks] Delete',
  props<{ ingredientStockID: number }>()
);
const deleteIngredientStockSuccess = createAction(
  '[IngredientStocks] Delete Success',
  props<{ ingredientStockID: number }>()
);
const deleteIngredientStockFailure = createAction(
  '[IngredientStocks] Delete Failure',
  props<{ error: any }>()
);
const updateIngredientStock = createAction(
  '[IngredientStocks] Edit',
  props<{ ingredientStock: IngredientStock }>()
);
const updateIngredientStockSuccess = createAction(
  '[IngredientStocks] Edit Success',
  props<{ ingredientStock: IngredientStock }>()
);
const updateIngredientStockFailure = createAction(
  '[IngredientStocks] Edit Failure',
  props<{ error: any }>()
);

export const IngredientStockActions = {
  loadIngredientStocks,
  loadIngredientStocksSuccess,
  loadIngredientStocksFailure,
  addIngredientStock,
  addIngredientStockSuccess,
  addIngredientStockFailure,
  bulkAddIngredientStocks,
  bulkAddIngredientStocksSuccess,
  bulkAddIngredientStocksFailure,
  loadIngredientStock,
  loadIngredientStockSuccess,
  loadIngredientStockFailure,
  deleteIngredientStock,
  deleteIngredientStockSuccess,
  deleteIngredientStockFailure,
  updateIngredientStock,
  updateIngredientStockSuccess,
  updateIngredientStockFailure,
};
