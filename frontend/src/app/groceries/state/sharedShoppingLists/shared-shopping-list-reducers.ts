import { createReducer, on } from '@ngrx/store';
import { SharedShoppingListActions } from './shared-shopping-list-actions';
import { SharedShoppingListState } from './shared-shopping-list-state';

export const initialState: SharedShoppingListState = {
  sharedShoppingLists: [],
  adding: false,
  deleting: false,
  updating: false,
  loading: false,
  error: null,
};

export const SharedShoppingListReducer = createReducer(
  initialState,
  on(SharedShoppingListActions.loadSharedShoppingLists, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(
    SharedShoppingListActions.loadSharedShoppingListsSuccess,
    (state, { sharedShoppingLists }) => ({
      ...state,
      sharedShoppingLists,
      loading: false,
    })
  ),
  on(
    SharedShoppingListActions.loadSharedShoppingListsFailure,
    (state, { error }) => ({
      ...state,
      error,
      loading: false,
    })
  )
);
