import { createSelector } from '@ngrx/store';
import { IngredientStockState } from './ingredient-stock-state';

export const selectIngredientStocks = (state: IngredientStockState) => state.ingredientStocks;

export const selectIngredientStockByID = (ingredientStockID: number) =>
  createSelector(selectIngredientStocks, (ingredientStocks) =>
    ingredientStocks.find((ingredientStock) => ingredientStock.ingredientStockID === ingredientStockID)
  );