import { createAction, props } from '@ngrx/store';
import { RecipeIngredient } from './recipe-ingredient-state';

const loadRecipeIngredients = createAction('[RecipeIngredients] Load');
const loadRecipeIngredientsSuccess = createAction(
  '[RecipeIngredients] Load Success',
  props<{ recipeIngredients: RecipeIngredient[] }>()
);
const loadRecipeIngredientsFailure = createAction(
  '[RecipeIngredients] Load Failure',
  props<{ error: any }>()
);

const loadRecipeIngredient = createAction(
  '[RecipeIngredients] Load Single',
  props<{ recipeIngredientID: number }>()
);
const loadRecipeIngredientSuccess = createAction(
  '[RecipeIngredients] Load Single Success',
  props<{ recipeIngredient: RecipeIngredient }>()
);
const loadRecipeIngredientFailure = createAction(
  '[RecipeIngredients] Load Single Failure',
  props<{ error: any }>()
);

const addRecipeIngredient = createAction(
  '[RecipeIngredients] Add',
  props<{ recipeIngredient: RecipeIngredient }>()
);
const addRecipeIngredientSuccess = createAction(
  '[RecipeIngredients] Add Success',
  props<{ recipeIngredient: RecipeIngredient }>()
);
const addRecipeIngredientFailure = createAction(
  '[RecipeIngredients] Add Failure',
  props<{ error: any }>()
);

const deleteRecipeIngredient = createAction(
  '[RecipeIngredients] Delete',
  props<{ recipeIngredientID: number }>()
);
const deleteRecipeIngredientSuccess = createAction(
  '[RecipeIngredients] Delete Success',
  props<{ recipeIngredientID: number }>()
);
const deleteRecipeIngredientFailure = createAction(
  '[RecipeIngredients] Delete Failure',
  props<{ error: any }>()
);

const updateRecipeIngredient = createAction(
  '[RecipeIngredients] Edit',
  props<{ recipeIngredient: RecipeIngredient }>()
);
const updateRecipeIngredientSuccess = createAction(
  '[RecipeIngredients] Edit Success',
  props<{ recipeIngredient: RecipeIngredient }>()
);
const updateRecipeIngredientFailure = createAction(
  '[RecipeIngredients] Edit Failure',
  props<{ error: any }>()
);

export const RecipeIngredientActions = {
  loadRecipeIngredients,
  loadRecipeIngredientsSuccess,
  loadRecipeIngredientsFailure,
  loadRecipeIngredient,
  loadRecipeIngredientSuccess,
  loadRecipeIngredientFailure,
  addRecipeIngredient,
  addRecipeIngredientSuccess,
  addRecipeIngredientFailure,
  deleteRecipeIngredient,
  deleteRecipeIngredientSuccess,
  deleteRecipeIngredientFailure,
  updateRecipeIngredient,
  updateRecipeIngredientSuccess,
  updateRecipeIngredientFailure,
};
