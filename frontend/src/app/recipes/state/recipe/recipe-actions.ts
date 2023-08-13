import { createAction, props } from '@ngrx/store';
import { Recipe } from './recipe-state';

const loadRecipes = createAction('[Recipes] Load');
const loadRecipesSuccess = createAction(
  '[Recipes] Load Success',
  props<{ recipes: Recipe[] }>()
);
const loadRecipesFailure = createAction(
  '[Recipes] Load Failure',
  props<{ error: any }>()
);

const loadRecipe = createAction(
  '[Recipes] Load Single',
  props<{ recipeID: number }>()
);
const loadRecipeSuccess = createAction(
  '[Recipes] Load Single Success',
  props<{ recipe: Recipe }>()
);
const loadRecipeFailure = createAction(
  '[Recipes] Load Single Failure',
  props<{ error: any }>()
);

const addRecipe = createAction('[Recipes] Add', props<{ recipe: Recipe }>());
const addRecipeSuccess = createAction(
  '[Recipes] Add Success',
  props<{ recipe: Recipe }>()
);
const addRecipeFailure = createAction(
  '[Recipes] Add Failure',
  props<{ error: any }>()
);

const deleteRecipe = createAction(
  '[Recipes] Delete',
  props<{ recipeID: number }>()
);
const deleteRecipeSuccess = createAction(
  '[Recipes] Delete Success',
  props<{ recipeID: number }>()
);
const deleteRecipeFailure = createAction(
  '[Recipes] Delete Failure',
  props<{ error: any }>()
);

const updateRecipe = createAction(
  '[Recipes] Edit',
  props<{ recipe: Recipe }>()
);
const updateRecipeSuccess = createAction(
  '[Recipes] Edit Success',
  props<{ recipe: Recipe }>()
);
const updateRecipeFailure = createAction(
  '[Recipes] Edit Failure',
  props<{ error: any }>()
);

export const RecipeActions = {
  loadRecipes,
  loadRecipesSuccess,
  loadRecipesFailure,
  loadRecipe,
  loadRecipeSuccess,
  loadRecipeFailure,
  addRecipe,
  addRecipeSuccess,
  addRecipeFailure,
  deleteRecipe,
  deleteRecipeSuccess,
  deleteRecipeFailure,
  updateRecipe,
  updateRecipeSuccess,
  updateRecipeFailure,
};
