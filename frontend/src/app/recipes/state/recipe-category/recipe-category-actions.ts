import { createAction, props } from '@ngrx/store';
import { RecipeCategory } from './recipe-category-state';

const loadRecipeCategories = createAction('[RecipeCategories] Load');
const loadRecipeCategoriesSuccess = createAction(
  '[RecipeCategories] Load Success',
  props<{ recipeCategories: RecipeCategory[] }>()
);
const loadRecipeCategoriesFailure = createAction(
  '[RecipeCategories] Load Failure',
  props<{ error: any }>()
);

const loadRecipeCategory = createAction(
  '[RecipeCategories] Load Single',
  props<{ recipeCategoryID: number }>()
);
const loadRecipeCategorySuccess = createAction(
  '[RecipeCategories] Load Single Success',
  props<{ recipeCategory: RecipeCategory }>()
);
const loadRecipeCategoryFailure = createAction(
  '[RecipeCategories] Load Single Failure',
  props<{ error: any }>()
);

const addRecipeCategory = createAction(
  '[RecipeCategories] Add',
  props<{ recipeCategory: RecipeCategory }>()
);
const addRecipeCategorySuccess = createAction(
  '[RecipeCategories] Add Success',
  props<{ recipeCategory: RecipeCategory }>()
);
const addRecipeCategoryFailure = createAction(
  '[RecipeCategories] Add Failure',
  props<{ error: any }>()
);

const deleteRecipeCategory = createAction(
  '[RecipeCategories] Delete',
  props<{ recipeCategoryID: number }>()
);
const deleteRecipeCategorySuccess = createAction(
  '[RecipeCategories] Delete Success',
  props<{ recipeCategoryID: number }>()
);
const deleteRecipeCategoryFailure = createAction(
  '[RecipeCategories] Delete Failure',
  props<{ error: any }>()
);

const updateRecipeCategory = createAction(
  '[RecipeCategories] Edit',
  props<{ recipeCategory: RecipeCategory }>()
);
const updateRecipeCategorySuccess = createAction(
  '[RecipeCategories] Edit Success',
  props<{ recipeCategory: RecipeCategory }>()
);
const updateRecipeCategoryFailure = createAction(
  '[RecipeCategories] Edit Failure',
  props<{ error: any }>()
);

export const RecipeCategoryActions = {
  loadRecipeCategories,
  loadRecipeCategoriesSuccess,
  loadRecipeCategoriesFailure,
  loadRecipeCategory,
  loadRecipeCategorySuccess,
  loadRecipeCategoryFailure,
  addRecipeCategory,
  addRecipeCategorySuccess,
  addRecipeCategoryFailure,
  deleteRecipeCategory,
  deleteRecipeCategorySuccess,
  deleteRecipeCategoryFailure,
  updateRecipeCategory,
  updateRecipeCategorySuccess,
  updateRecipeCategoryFailure,
};
