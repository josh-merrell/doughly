import { createAction, props } from '@ngrx/store';
import { ShoppingList, ShoppingListIngredient, ShoppingListRecipe } from './shopping-list-state';

const loadShoppingLists = createAction('[ShoppingLists] Load');
const loadShoppingListsSuccess = createAction(
  '[ShoppingLists] Load Success',
  props<{ shoppingLists: ShoppingList[] }>()
);
const loadShoppingListsFailure = createAction(
  '[ShoppingLists] Load Failure',
  props<{ error: any }>()
);

const loadShoppingListIngredients = createAction('[ShoppingListIngredients] Load');
const loadShoppingListIngredientsSuccess = createAction(
  '[ShoppingListIngredients] Load Success',
  props<{ shoppingListIngredients: ShoppingListIngredient[] }>()
);
const loadShoppingListIngredientsFailure = createAction(
  '[ShoppingListIngredients] Load Failure',
  props<{ error: any }>()
);

const loadShoppingListRecipes = createAction('[ShoppingListRecipes] Load');
const loadShoppingListRecipesSuccess = createAction(
  '[ShoppingListRecipes] Load Success',
  props<{ shoppingListRecipes: ShoppingListRecipe[] }>()
);
const loadShoppingListRecipesFailure = createAction(
  '[ShoppingListRecipes] Load Failure',
  props<{ error: any }>()
);

const addShoppingList = createAction('[ShoppingLists] Add');
const addShoppingListSuccess = createAction(
  '[ShoppingLists] Add Success',
  props<{ shoppingList: ShoppingList }>()
);
const addShoppingListFailure = createAction(
  '[ShoppingLists] Add Failure',
  props<{ error: any }>()
);

const editShoppingList = createAction('[ShoppingLists] Edit', props<any>());
const editShoppingListSuccess = createAction(
  '[ShoppingLists] Edit Success',
  props<{ shoppingList: ShoppingList }>()
);
const editShoppingListFailure = createAction(
  '[ShoppingLists] Edit Failure',
  props<{ error: any }>()
);

const deleteShoppingList = createAction('[ShoppingLists] Delete', props<{ shoppingListID: number }>());
const deleteShoppingListSuccess = createAction(
  '[ShoppingLists] Delete Success',
  props<{ shoppingListID: number }>()
);
const deleteShoppingListFailure = createAction(
  '[ShoppingLists] Delete Failure',
  props<{ error: any }>()
);

export const ShoppingListActions = {
  loadShoppingLists,
  loadShoppingListsSuccess,
  loadShoppingListsFailure,
  loadShoppingListIngredients,
  loadShoppingListIngredientsSuccess,
  loadShoppingListIngredientsFailure,
  loadShoppingListRecipes,
  loadShoppingListRecipesSuccess,
  loadShoppingListRecipesFailure,
  addShoppingList,
  addShoppingListSuccess,
  addShoppingListFailure,
  editShoppingList,
  editShoppingListSuccess,
  editShoppingListFailure,
  deleteShoppingList,
  deleteShoppingListSuccess,
  deleteShoppingListFailure,
}