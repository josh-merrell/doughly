import { createReducer, on } from '@ngrx/store';
import { ShoppingListActions } from './shopping-list-actions';
import { ShoppingListState } from './shopping-list-state';

export const initialState: ShoppingListState = {
  shoppingLists: [],
  shoppingListIngredients: [],
  shoppingListRecipes: [],
  loading: false,
  deleting: false,
  adding: false,
  updating: false,
  error: null,
};

export const ShoppingListReducer = createReducer(
  initialState,
  on(ShoppingListActions.loadShoppingLists, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(
    ShoppingListActions.loadShoppingListsSuccess,
    (state, { shoppingLists }) => ({
      ...state,
      shoppingLists,
      loading: false,
    })
  ),
  on(ShoppingListActions.loadShoppingListsFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(ShoppingListActions.loadShoppingListIngredients, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(
    ShoppingListActions.loadShoppingListIngredientsSuccess,
    (state, { shoppingListIngredients }) => ({
      ...state,
      shoppingListIngredients,
      loading: false,
    })
  ),
  on(
    ShoppingListActions.loadShoppingListIngredientsFailure,
    (state, { error }) => ({
      ...state,
      error,
      loading: false,
    })
  ),
  on(ShoppingListActions.loadShoppingListRecipes, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(
    ShoppingListActions.loadShoppingListRecipesSuccess,
    (state, { shoppingListRecipes }) => ({
      ...state,
      shoppingListRecipes,
      loading: false,
    })
  ),
  on(
    ShoppingListActions.loadShoppingListRecipesFailure,
    (state, { error }) => ({
      ...state,
      error,
      loading: false,
    })
  ),
  on(ShoppingListActions.addShoppingList, (state) => ({
    ...state,
    adding: true,
    error: null,
  })),
  on(ShoppingListActions.addShoppingListSuccess, (state, { shoppingList }) => ({
    ...state,
    adding: false,
    shoppingLists: [...state.shoppingLists, shoppingList],
  })),
  on(ShoppingListActions.addShoppingListFailure, (state, { error }) => ({
    ...state,
    error,
    adding: false,
  })),

  on(ShoppingListActions.editShoppingList, (state) => ({
    ...state,
    updating: true,
    error: null,
  })),
  on(
    ShoppingListActions.editShoppingListSuccess,
    (state, { shoppingList }) => ({
      ...state,
      updating: false,
      shoppingLists: state.shoppingLists.map((storeShoppingList) =>
        storeShoppingList.shoppingListID === shoppingList.shoppingListID
          ? shoppingList
          : storeShoppingList
      ),
    })
  ),
  on(ShoppingListActions.editShoppingListFailure, (state, { error }) => ({
    ...state,
    error,
    updating: false,
  })),

  on(ShoppingListActions.deleteShoppingList, (state) => ({
    ...state,
    deleting: true,
    error: null,
  })),
  on(
    ShoppingListActions.deleteShoppingListSuccess,
    (state, { shoppingListID }) => ({
      ...state,
      deleting: false,
    })
  ),
  on(ShoppingListActions.deleteShoppingListFailure, (state, { error }) => ({
    ...state,
    error,
    deleting: false,
  })),
  on(ShoppingListActions.receiveItems, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ShoppingListActions.receiveItemsSuccess, (state, { shoppingListID }) => ({
    ...state,
    loading: false,
  })),
  on(ShoppingListActions.receiveItemsFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(ShoppingListActions.shareList, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ShoppingListActions.shareListSuccess, (state, { shoppingListID }) => ({
    ...state,
    loading: false,
  })),
  on(ShoppingListActions.shareListFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  }))
);
