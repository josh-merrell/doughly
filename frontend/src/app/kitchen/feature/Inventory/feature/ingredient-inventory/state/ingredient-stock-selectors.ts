import { createSelector } from '@ngrx/store';
import { IngredientStockState, IngredientStock } from './ingredient-stock-state';

export const selectIngredientStocks = (state: any) => state.ingredientStock.ingredientStocks;

export const selectIngredientStockByID = (ingredientStockID: number) =>
  createSelector(selectIngredientStocks, (ingredientStocks) =>
    ingredientStocks.find((ingredientStock: IngredientStock) => ingredientStock.ingredientStockID === ingredientStockID)
  );