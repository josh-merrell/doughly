import { createSelector } from '@ngrx/store';
import { IngredientStockState, IngredientStock } from './ingredient-stock-state';

export const selectIngredientStocks = (state: any) => state.ingredientStock.ingredientStocks;

export const selectIngredientStockByID = (ingredientStockID: number) => {
  return createSelector(selectIngredientStocks, (ingredientStocks) => {
    return ingredientStocks.find(
      (ingredientStock: IngredientStock) =>
        ingredientStock.ingredientStockID === ingredientStockID
    );
  });
};

export const selectIngredientStocksByIngredientID = (ingredientID: number) => {
  return createSelector(selectIngredientStocks, (ingredientStocks) => {
    return ingredientStocks.filter(
      (ingredientStock: IngredientStock) => ingredientStock.ingredientID === ingredientID
    );
  });
};

export const selectDeleting = (state: any) => state.ingredientStock.deleting;

export const selectAdding = (state: any) => state.ingredientStock.adding;

export const selectUpdating = (state: any) => state.ingredientStock.updating;

export const selectError = (state: any) => state.ingredientStock.error;

export const selectLoading = (state: any) => state.ingredientStock.loading;
