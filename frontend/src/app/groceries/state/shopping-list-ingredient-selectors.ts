import { createSelector } from '@ngrx/store';

export const selectShoppingListIngredients = (state: any) => state.shoppingListIngredient.shoppingListIngredients;
export const selectAdding = (state: any) => state.shoppingListIngredient.adding;
export const selectError = (state: any) => state.shoppingListIngredient.error;
export const selectUpdating = (state: any) => state.shoppingListIngredient.updating;
export const selectTempPurchasing = (state: any) => state.shoppingListIngredient.tempPurchasing;
export const selectDeleting = (state: any) => state.shoppingListIngredient.deleting;