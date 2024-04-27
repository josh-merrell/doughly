import { createSelector } from '@ngrx/store';
import { ShoppingList } from './shopping-list-state';

export const selectShoppingLists = (state: any) => state.shoppingList.shoppingLists;
export const selectDeleting = (state: any) => state.shoppingList.deleting;
export const selectError = (state: any) => state.shoppingList.error;
export const selectUpdating = (state: any) => state.shoppingList.updating;
export const selectLoading = (state: any) => state.shoppingList.loading;