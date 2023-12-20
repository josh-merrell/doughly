import { createSelector } from '@ngrx/store';

export const selectShoppingListIngredients = (state: any) => state.shoppingListIngredient.shoppingListIngredients;
export const selectAdding = (state: any) => state.shoppingListIngredient.adding;
export const selectError = (state: any) => state.shoppingListIngredient.error;