import { createSelector } from '@ngrx/store';
const memoize = require('lodash.memoize');
import { Recipe } from './recipe-state';

export const selectRecipes = (state: any) => state.recipe.recipes;

export const selectDiscoverRecipes = (state: any) => state.recipe.discoverRecipes;

export const selectRecipeSubscriptions = (state: any) => state.recipe.recipeSubscriptions;

export const selectRecipeByID = memoize((recipeID: number) => {
  return createSelector(
    selectRecipes,
    (recipes: Recipe[]): Recipe | undefined => {
      return recipes.find((recipe: Recipe) => recipe.recipeID === recipeID);
    }
  );
});

export const selectSubscriptionByNewRecipeID = memoize((recipeID: number) => {
  return createSelector(
    selectRecipeSubscriptions,
    (recipeSubscriptions: any[]): any | undefined => {
      return recipeSubscriptions.find((subscription: any) => subscription.newRecipeID === recipeID);
    }
  );
});

export const selectSubscriptionBySourceRecipeID = memoize((recipeID: number) => {
  return createSelector(
    selectRecipeSubscriptions,
    (recipeSubscriptions: any[]): any | undefined => {
      return recipeSubscriptions.find(
        (subscription: any) => subscription.sourceRecipeID === recipeID
      );
    }
  );
});

export const selectNewRecipeID = (state: any) => state.recipe.newRecipeID;

export const selectDeleting = (state: any) => state.recipe.deleting;

export const selectAdding = (state: any) => state.recipe.adding;

export const selectUpdating = (state: any) => state.recipe.updating;

export const selectError = (state: any) => state.recipe.error;

export const selectLoading = (state: any) => state.recipe.loading;
