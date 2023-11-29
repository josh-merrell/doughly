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


export const RecipeCategoryActions = {
  loadRecipeCategories,
  loadRecipeCategoriesSuccess,
  loadRecipeCategoriesFailure,
  loadRecipeCategory,
  loadRecipeCategorySuccess,
  loadRecipeCategoryFailure,
};
