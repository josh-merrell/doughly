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

const addIngredient = createAction(
  '[Ingredients] Add',
  props<{ ingredient: Ingredient }>()
);
const addIngredientSuccess = createAction(
  '[Ingredients] Add Success',
  props<{ ingredients: Ingredient }>()
);
const addIngredientFailure = createAction(
  '[Ingredients] Add Failure',
  props<{ error: any }>()
);

export const IngredientActions = {
  loadIngredients,
  loadIngredientsSuccess,
  loadIngredientsFailure,
  addIngredient,
  addIngredientSuccess,
  addIngredientFailure,
};
