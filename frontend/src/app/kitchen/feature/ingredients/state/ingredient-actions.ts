import { createAction, props } from '@ngrx/store';
import { Ingredient } from './ingredient-state';

const loadIngredients = createAction('[Ingredients] Load');
const loadIngredientsSuccess = createAction(
  '[Ingredients] Load Success',
  props<{ ingredients: Ingredient[] }>()
);
const loadIngredientsFailure = createAction(
  '[Ingredients] Load Failure',
  props<{ error: any }>()
);

const loadIngredient = createAction(
  '[Ingredients] Load Single',
  props<{ ingredientID: number }>()
);
const loadIngredientSuccess = createAction(
  '[Ingredients] Load Single Success',
  props<{ ingredient: Ingredient }>()
);
const loadIngredientFailure = createAction(
  '[Ingredients] Load Single Failure',
  props<{ error: any }>()
);

const addIngredient = createAction(
  '[Ingredients] Add',
  props<{ ingredient: Ingredient }>()
);
const addIngredientSuccess = createAction(
  '[Ingredients] Add Success',
  props<{ ingredient: Ingredient }>()
);
const addIngredientFailure = createAction(
  '[Ingredients] Add Failure',
  props<{ error: any }>()
);
const deleteIngredient = createAction(
  '[Ingredients] Delete',
  props<{ ingredientID: number }>()
);
const deleteIngredientSuccess = createAction(
  '[Ingredients] Delete Success',
  props<{ ingredientID: number }>()
);
const deleteIngredientFailure = createAction(
  '[Ingredients] Delete Failure',
  props<{ error: any }>()
);

export const IngredientActions = {
  loadIngredients,
  loadIngredientsSuccess,
  loadIngredientsFailure,
  loadIngredient,
  loadIngredientSuccess,
  loadIngredientFailure,
  addIngredient,
  addIngredientSuccess,
  addIngredientFailure,
  deleteIngredient,
  deleteIngredientSuccess,
  deleteIngredientFailure,
};
