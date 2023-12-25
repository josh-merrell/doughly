import { createAction, props } from '@ngrx/store';
import { RecipeTool } from './recipe-tool-state';

const loadRecipeTools = createAction('[RecipeTools] Load');
const loadRecipeToolsSuccess = createAction(
  '[RecipeTools] Load Success',
  props<{ recipeTools: RecipeTool[] }>()
);
const loadRecipeToolsFailure = createAction(
  '[RecipeTools] Load Failure',
  props<{ error: any }>()
);

const loadRecipeTool = createAction(
  '[RecipeTools] Load Single',
  props<{ recipeToolID: number }>()
);
const loadRecipeToolSuccess = createAction(
  '[RecipeTools] Load Single Success',
  props<{ recipeTool: RecipeTool }>()
);
const loadRecipeToolFailure = createAction(
  '[RecipeTools] Load Single Failure',
  props<{ error: any }>()
);

const addRecipeTool = createAction(
  '[RecipeTools] Add',
  props<{ recipeTool: any }>()
);
const addRecipeToolSuccess = createAction(
  '[RecipeTools] Add Success',
  props<{ recipeTool: RecipeTool }>()
);
const addRecipeToolFailure = createAction(
  '[RecipeTools] Add Failure',
  props<{ error: any }>()
);

const deleteRecipeTool = createAction(
  '[RecipeTools] Delete',
  props<{ recipeToolID: number }>()
);
const deleteRecipeToolSuccess = createAction(
  '[RecipeTools] Delete Success',
  props<{ recipeToolID: number }>()
);
const deleteRecipeToolFailure = createAction(
  '[RecipeTools] Delete Failure',
  props<{ error: any }>()
);

const updateRecipeTool = createAction(
  '[RecipeTools] Edit',
  props<{ recipeTool: RecipeTool }>()
);
const updateRecipeToolSuccess = createAction(
  '[RecipeTools] Edit Success',
  props<{ recipeTool: RecipeTool }>()
);
const updateRecipeToolFailure = createAction(
  '[RecipeTools] Edit Failure',
  props<{ error: any }>()
);

export const RecipeToolActions = {
  loadRecipeTools,
  loadRecipeToolsSuccess,
  loadRecipeToolsFailure,
  loadRecipeTool,
  loadRecipeToolSuccess,
  loadRecipeToolFailure,
  addRecipeTool,
  addRecipeToolSuccess,
  addRecipeToolFailure,
  deleteRecipeTool,
  deleteRecipeToolSuccess,
  deleteRecipeToolFailure,
  updateRecipeTool,
  updateRecipeToolSuccess,
  updateRecipeToolFailure,
};