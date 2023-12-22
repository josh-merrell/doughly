import { createAction, props } from '@ngrx/store';
import { ShoppingListIngredient } from './shopping-list-ingredient-state';

const loadShoppingListIngredients = createAction('[ShoppingListIngredients] Load', props<{ shoppingListID: number }>());
const loadShoppingListIngredientsSuccess = createAction(
  '[ShoppingListIngredients] Load Success',
  props<{ shoppingListIngredients: ShoppingListIngredient[] }>()
);
const loadShoppingListIngredientsFailure = createAction(
  '[ShoppingListIngredients] Load Failure',
  props<{ error: any }>()
);

const addShoppingListIngredient = createAction('[ShoppingListIngredients] Add', props<{ shoppingListID: number, ingredientID: number, needMeasurement: number, needUnit: string, source: string }>());
const addShoppingListIngredientSuccess = createAction(
  '[ShoppingListIngredients] Add Success',
  props<{ shoppingListIngredient: ShoppingListIngredient }>()
);
const addShoppingListIngredientFailure = createAction(
  '[ShoppingListIngredients] Add Failure',
  props<{ error: any }>()
);

const batchAddShoppingListIngredients = createAction('[ShoppingListIngredients] Batch Add', props<{ shoppingListID: number, ingredients: { ingredientID: number, needMeasurement: number, needUnit: string, source: string }[] }>());
const batchAddShoppingListIngredientsSuccess = createAction(
  '[ShoppingListIngredients] Batch Add Success',
  props<{ shoppingListIngredients: ShoppingListIngredient[] }>()
);
const batchAddShoppingListIngredientsFailure = createAction(
  '[ShoppingListIngredients] Batch Add Failure',
  props<{ error: any }>()
);

const updateShoppingListIngredient = createAction('[ShoppingListIngredients] Update', props<{ shoppingListIngredientID: number, shoppingListID: number, purchasedMeasurement: number, purchasedUnit: string, store: string }>());
const updateShoppingListIngredientSuccess = createAction(
  '[ShoppingListIngredients] Update Success',
  props<{ shoppingListIngredientID: number, shoppingListID: number }>()
);
const updateShoppingListIngredientFailure = createAction(
  '[ShoppingListIngredients] Update Failure',
  props<{ error: any }>()
);

const deleteShoppingListIngredient = createAction(
  '[ShoppingListIngredients] Delete',
  props<{ shoppingListIngredientID: number, shoppingListID: number }>()
);
const deleteShoppingListIngredientSuccess = createAction(
  '[ShoppingListIngredients] Delete Success',
  props<{ shoppingListIngredientID: number, shoppingListID: number }>()
);
const deleteShoppingListIngredientFailure = createAction(
  '[ShoppingListIngredients] Delete Failure',
  props<{ error: any }>()
);

export const ShoppingListIngredientActions = {
  loadShoppingListIngredients,
  loadShoppingListIngredientsSuccess,
  loadShoppingListIngredientsFailure,
  addShoppingListIngredient,
  addShoppingListIngredientSuccess,
  addShoppingListIngredientFailure,
  batchAddShoppingListIngredients,
  batchAddShoppingListIngredientsSuccess,
  batchAddShoppingListIngredientsFailure,
  updateShoppingListIngredient,
  updateShoppingListIngredientSuccess,
  updateShoppingListIngredientFailure,
  deleteShoppingListIngredient,
  deleteShoppingListIngredientSuccess,
  deleteShoppingListIngredientFailure,
};
