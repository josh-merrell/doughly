import { createAction, props } from '@ngrx/store';
import { ToolStock } from './tool-stock-state';

const loadToolStocks = createAction('[ToolStocks] Load');
const loadToolStocksSuccess = createAction(
  '[ToolStocks] Load Success',
  props<{ toolStocks: ToolStock[] }>()
);
const loadToolStocksFailure = createAction(
  '[ToolStocks] Load Failure',
  props<{ error: any }>()
);

const loadToolStock = createAction(
  '[ToolStocks] Load Single',
  props<{ toolStockID: number }>()
);
const loadToolStockSuccess = createAction(
  '[ToolStocks] Load Single Success',
  props<{ toolStock: ToolStock }>()
);
const loadToolStockFailure = createAction(
  '[ToolStocks] Load Single Failure',
  props<{ error: any }>()
);

const addToolStock = createAction(
  '[ToolStocks] Add',
  props<{ toolStock: ToolStock }>()
);
const addToolStockSuccess = createAction(
  '[ToolStocks] Add Success',
  props<{ toolStock: ToolStock }>()
);
const addToolStockFailure = createAction(
  '[ToolStocks] Add Failure',
  props<{ error: any }>()
);
const deleteToolStock = createAction(
  '[ToolStocks] Delete',
  props<{ toolStockID: number }>()
);
const deleteToolStockSuccess = createAction(
  '[ToolStocks] Delete Success',
  props<{ toolStockID: number }>()
);
const deleteToolStockFailure = createAction(
  '[ToolStocks] Delete Failure',
  props<{ error: any }>()
);
const updateToolStock = createAction(
  '[ToolStocks] Edit',
  props<{ toolStock: ToolStock }>()
);
const updateToolStockSuccess = createAction(
  '[ToolStocks] Edit Success',
  props<{ toolStock: ToolStock }>()
);
const updateToolStockFailure = createAction(
  '[ToolStocks] Edit Failure',
  props<{ error: any }>()
);

export const ToolStockActions = {
  loadToolStocks,
  loadToolStocksSuccess,
  loadToolStocksFailure,
  addToolStock,
  addToolStockSuccess,
  addToolStockFailure,
  loadToolStock,
  loadToolStockSuccess,
  loadToolStockFailure,
  deleteToolStock,
  deleteToolStockSuccess,
  deleteToolStockFailure,
  updateToolStock,
  updateToolStockSuccess,
  updateToolStockFailure,
};
