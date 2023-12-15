import { createSelector } from '@ngrx/store';
import { ShoppingList } from './shopping-list-state';

export const selectShoppingLists = (state: any) => state.shoppingList.shoppingLists;