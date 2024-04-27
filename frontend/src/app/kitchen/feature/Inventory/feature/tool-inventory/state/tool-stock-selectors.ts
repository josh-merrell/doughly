import { createSelector } from '@ngrx/store';
import {
  ToolStockState,
  ToolStock,
} from './tool-stock-state';

export const selectToolStocks = (state: any) =>
  state.toolStock.toolStocks;

export const selectToolStockByID = (toolStockID: number) => {
  return createSelector(selectToolStocks, (toolStocks) => {
    return toolStocks.find(
      (toolStock: ToolStock) =>
        toolStock.toolStockID === toolStockID
    );
  });
};

export const selectToolStocksByToolID = (toolID: number) => {
  return createSelector(selectToolStocks, (toolStocks) => {
    return toolStocks.filter(
      (toolStock: ToolStock) =>
        toolStock.toolID === toolID
    );
  });
};

export const selectDeleting = (state: any) => state.toolStock.deleting;

export const selectAdding = (state: any) => state.toolStock.adding;

export const selectUpdating = (state: any) => state.toolStock.updating;

export const selectError = (state: any) => state.toolStock.error;

export const selectLoading = (state: any) => state.toolStock.loading;
