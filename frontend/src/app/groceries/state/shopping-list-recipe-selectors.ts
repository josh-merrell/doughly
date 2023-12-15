import { createSelector } from '@ngrx/store';

export const selectLoading = (state: any) => state.shoppingList.loading;
export const selectShoppingListRecipes = (state: any) => state.shoppingListRecipe.shoppingListRecipes;