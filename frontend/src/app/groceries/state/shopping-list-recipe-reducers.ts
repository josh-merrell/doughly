import { createReducer, on } from '@ngrx/store';
import { ShoppingListRecipeActions } from './shopping-list-recipe-actions';
import { ShoppingListRecipeState } from './shopping-list-recipe-state';


export const initialState: ShoppingListRecipeState = {
  shoppingListRecipes: [],
  loading: false,
  deleting: false,
  adding: false,
  updating: false,
  error: null,
};

export const ShoppingListRecipeReducer = createReducer(
  initialState,
  on(ShoppingListRecipeActions.loadAllShoppingListRecipes, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ShoppingListRecipeActions.loadAllShoppingListRecipesSuccess, (state, { shoppingListRecipes }) => ({
    ...state,
    shoppingListRecipes,
    loading: false,
  })),
  on(ShoppingListRecipeActions.loadAllShoppingListRecipesFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(ShoppingListRecipeActions.loadShoppingListRecipes, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ShoppingListRecipeActions.loadShoppingListRecipesSuccess, (state, { shoppingListRecipes }) => ({
    ...state,
    shoppingListRecipes,
    loading: false,
  })),
  on(ShoppingListRecipeActions.loadShoppingListRecipesFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(ShoppingListRecipeActions.addShoppingListRecipe, (state) => ({
    ...state,
    adding: true,
    error: null,
  })),
  on(ShoppingListRecipeActions.addShoppingListRecipeSuccess, (state, { shoppingListRecipe }) => ({
    ...state,
    shoppingListRecipes: [...state.shoppingListRecipes, shoppingListRecipe],
    adding: false,
  })),
  on(ShoppingListRecipeActions.addShoppingListRecipeFailure, (state, { error }) => ({
    ...state,
    error,
    adding: false,
  })),
  on(ShoppingListRecipeActions.deleteShoppingListRecipe, (state) => ({
    ...state,
    deleting: true,
    error: null,
  })),
  on(ShoppingListRecipeActions.deleteShoppingListRecipeSuccess, (state, { shoppingListRecipeID }) => ({
    ...state,
    shoppingListRecipes: state.shoppingListRecipes.filter((shoppingListRecipe) => shoppingListRecipe.shoppingListRecipeID !== shoppingListRecipeID),
    deleting: false,
  })),
  on(ShoppingListRecipeActions.deleteShoppingListRecipeFailure, (state, { error }) => ({
    ...state,
    error,
    deleting: false,
  }))
);