import { createSelector } from '@ngrx/store';

export const selectLoading = (state: any) => state.shoppingListRecipe.loading;
export const selectShoppingListRecipes = (state: any) => state.shoppingListRecipe.shoppingListRecipes;
export const selectAdding = (state: any) => state.shoppingListRecipe.adding;
export const selectError = (state: any) => state.shoppingListRecipe.error;
export const selectDeleting = (state: any) => state.shoppingListRecipe.deleting;