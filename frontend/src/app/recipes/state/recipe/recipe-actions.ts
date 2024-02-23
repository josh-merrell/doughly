import { createAction, props } from '@ngrx/store';
import { Recipe, RecipeStatus, RecipeSubscription } from './recipe-state';

const loadRecipes = createAction('[Recipes] Load');
const loadRecipesSuccess = createAction(
  '[Recipes] Load Success',
  props<{ recipes: Recipe[] }>()
);
const loadRecipesFailure = createAction(
  '[Recipes] Load Failure',
  props<{ error: any }>()
);

const loadDiscoverRecipes = createAction('[Recipes] Load Discover');
const loadDiscoverRecipesSuccess = createAction(
  '[Recipes] Load Discover Success',
  props<{ discoverRecipes: Recipe[] }>()
);
const loadDiscoverRecipesFailure = createAction(
  '[Recipes] Load Discover Failure',
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

const loadRecipeSubscriptions = createAction('[Recipes] Load Subscriptions');
const loadRecipeSubscriptionsSuccess = createAction(
  '[Recipes] Load Subscriptions Success',
  props<{ recipeSubscriptions: RecipeSubscription[] }>()
);
const loadRecipeSubscriptionsFailure = createAction(
  '[Recipes] Load Subscriptions Failure',
  props<{ error: any }>()
);

const deleteRecipeSubscription = createAction(
  '[Recipes] Delete Subscription',
  props<{ subscriptionID: number }>()
);
const deleteRecipeSubscriptionSuccess = createAction(
  '[Recipes] Delete Subscription Success',
  props<{ subscriptionID: number }>()
);
const deleteRecipeSubscriptionFailure = createAction(
  '[Recipes] Delete Subscription Failure',
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

const visionAddRecipe = createAction(
  '[Recipes] Vision Add',
  props<{ recipeSourceImageURL: string, recipePhotoURL?: string }>()
);
const visionAddRecipeSuccess = createAction(
  '[Recipes] Vision Add Success',
  props<{ recipeID: number }>()
);
const visionAddRecipeFailure = createAction(
  '[Recipes] Vision Add Failure',
  props<{ error: any }>()
);

const clearNewRecipeID = createAction('[Recipes] Clear New Recipe ID');

const constructRecipe = createAction(
  '[Recipes] Construct',
  props<{ constructBody: any }>()
);
const constructRecipeSuccess = createAction('[Recipes] Construct Success', props<{ recipeID: number }>());
const constructRecipeFailure = createAction(
  '[Recipes] Construct Failure',
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
const updateRecipeStatus = createAction(
  '[Recipes] Update Status',
  props<{ recipeID: number; status: RecipeStatus }>()
);
const useRecipe = createAction(
  '[Recipes] Use',
  props<{
    recipeID: number;
    satisfaction: number;
    difficulty: number;
    note: string;
  }>()
);
const useRecipeSuccess = createAction('[Recipes] Use Success');
const useRecipeFailure = createAction(
  '[Recipes] Use Failure',
  props<{ error: any }>()
);

export const RecipeActions = {
  loadRecipes,
  loadRecipesSuccess,
  loadRecipesFailure,
  loadDiscoverRecipes,
  loadDiscoverRecipesSuccess,
  loadDiscoverRecipesFailure,
  loadRecipe,
  loadRecipeSuccess,
  loadRecipeFailure,
  loadRecipeSubscriptions,
  loadRecipeSubscriptionsSuccess,
  loadRecipeSubscriptionsFailure,
  deleteRecipeSubscription,
  deleteRecipeSubscriptionSuccess,
  deleteRecipeSubscriptionFailure,
  addRecipe,
  addRecipeSuccess,
  addRecipeFailure,
  visionAddRecipe,
  visionAddRecipeSuccess,
  visionAddRecipeFailure,
  clearNewRecipeID,
  constructRecipe,
  constructRecipeSuccess,
  constructRecipeFailure,
  deleteRecipe,
  deleteRecipeSuccess,
  deleteRecipeFailure,
  updateRecipe,
  updateRecipeSuccess,
  updateRecipeFailure,
  updateRecipeStatus,
  useRecipe,
  useRecipeSuccess,
  useRecipeFailure,
};
