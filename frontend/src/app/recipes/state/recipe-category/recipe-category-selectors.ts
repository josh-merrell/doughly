import { createSelector } from '@ngrx/store';
import { RecipeCategory } from './recipe-category-state';

export const selectRecipeCategories = (state: any) =>
  state.recipeCategory.recipeCategories;

export const selectRecipeCategoryByID = (recipeCategoryID: number) => {
  return createSelector(selectRecipeCategories, (recipeCategories) => {
    return recipeCategories.find(
      (recipeCategory: RecipeCategory) =>
        recipeCategory.recipeCategoryID === recipeCategoryID
    );
  });
};

export const selectDeleting = (state: any) => state.recipeCategory.deleting;

export const selectAdding = (state: any) => state.recipeCategory.adding;

export const selectUpdating = (state: any) => state.recipeCategory.updating;

export const selectError = (state: any) => state.recipeCategory.error;

export const selectLoading = (state: any) => state.recipeCategory.loading;
