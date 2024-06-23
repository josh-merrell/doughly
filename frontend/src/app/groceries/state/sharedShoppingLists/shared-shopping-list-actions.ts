import { createAction, props } from '@ngrx/store';
import { SharedShoppingList } from './shared-shopping-list-state';

const loadSharedShoppingLists = createAction('[SharedShoppingLists] Load');
const loadSharedShoppingListsSuccess = createAction(
  '[SharedShoppingLists] Load Success',
  props<{ sharedShoppingLists: SharedShoppingList[] }>()
);
const loadSharedShoppingListsFailure = createAction(
  '[SharedShoppingLists] Load Failure',
  props<{ error: any }>()
);

export const SharedShoppingListActions = {
  loadSharedShoppingLists,
  loadSharedShoppingListsSuccess,
  loadSharedShoppingListsFailure,
};
