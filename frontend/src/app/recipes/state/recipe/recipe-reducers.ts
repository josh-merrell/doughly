import { createReducer, on } from '@ngrx/store';
import { RecipeActions } from './recipe-actions';
import { RecipeState, RecipeStatus } from './recipe-state';

export const initialState: RecipeState = {
  recipes: [],
  discoverRecipes: [],
  recipeSubscriptions: [],
  loading: false,
  error: null,
  adding: false,
  updating: false,
  deleting: false,
};

export const recipeReducer = createReducer(
  initialState,
  on(RecipeActions.loadRecipes, (state) => ({
    ...state,
    error: null,
    loading: true,
  })),
  on(RecipeActions.loadRecipesSuccess, (state, { recipes }) => ({
    ...state,
    recipes,
    loading: false,
  })),
  on(RecipeActions.loadRecipesFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(RecipeActions.loadDiscoverRecipes, (state) => ({
    ...state,
    error: null,
    loading: true,
  })),
  on(RecipeActions.loadDiscoverRecipesSuccess, (state, { discoverRecipes }) => ({
    ...state,
    discoverRecipes: discoverRecipes,
    loading: false,
  })),
  on(RecipeActions.loadRecipe, (state) => ({
    ...state,
    error: null,
    loading: true,
  })),
  on(RecipeActions.loadRecipeSuccess, (state, { recipe }) => {
    return {
      ...state,
      loading: false,
      recipes: state.recipes.map((existingRecipe) =>
        existingRecipe.recipeID === recipe.recipeID ? recipe : existingRecipe
      ),
    };
  }),
  on(RecipeActions.loadRecipeFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(RecipeActions.loadRecipeSubscriptions, (state) => ({
    ...state,
    error: null,
    loading: true,
  })),
  on(
    RecipeActions.loadRecipeSubscriptionsSuccess,
    (state, { recipeSubscriptions }) => ({
      ...state,
      recipeSubscriptions: recipeSubscriptions,
      loading: false,
    })
  ),
  on(RecipeActions.loadRecipeSubscriptionsFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(RecipeActions.deleteRecipeSubscription, (state) => ({
    ...state,
    error: null,
    deleting: true,
  })),
  on(
    RecipeActions.deleteRecipeSubscriptionSuccess,
    (state, { subscriptionID }) => ({
      ...state,
      recipeSubscriptions: state.recipeSubscriptions.filter(
        (item) => item.subscriptionID !== subscriptionID
      ),
      deleting: false,
    })
  ),
  on(RecipeActions.deleteRecipeSubscriptionFailure, (state, { error }) => ({
    ...state,
    error,
    deleting: false,
  })),
  on(RecipeActions.addRecipe, (state) => ({
    ...state,
    error: null,
    adding: true,
  })),
  on(RecipeActions.addRecipeSuccess, (state, { recipe }) => ({
    ...state,
    recipes: [...state.recipes, recipe],
    adding: false,
  })),
  on(RecipeActions.addRecipeFailure, (state, { error }) => ({
    ...state,
    error,
    adding: false,
  })),
  on(RecipeActions.visionAddRecipe, (state) => ({
    ...state,
    error: null,
    adding: true,
  })),
  on(RecipeActions.visionAddRecipeSuccess, (state, { recipeID }) => ({
    ...state,
    newRecipeID: recipeID,
    adding: false,
  })),
  on(RecipeActions.visionAddRecipeFailure, (state, { error }) => ({
    ...state,
    error,
    adding: false,
  })),
  on(RecipeActions.clearNewRecipeID, (state) => ({
    ...state,
    newRecipeID: undefined,
  })),
  on(RecipeActions.constructRecipe, (state) => ({
    ...state,
    error: null,
    adding: true,
  })),
  on(RecipeActions.constructRecipeSuccess, (state, { recipeID }) => ({
    ...state,
    newRecipeID: recipeID,
    adding: false,
  })),
  on(RecipeActions.constructRecipeFailure, (state, { error }) => ({
    ...state,
    error,
    adding: false,
  })),
  on(RecipeActions.updateRecipe, (state) => ({
    ...state,
    error: null,
    updating: true,
  })),
  on(RecipeActions.updateRecipeSuccess, (state, { recipe }) => ({
    ...state,
    recipes: state.recipes.map((item) =>
      item.recipeID === recipe.recipeID ? recipe : item
    ),
    updating: false,
  })),
  on(RecipeActions.updateRecipeFailure, (state, { error }) => ({
    ...state,
    error,
    updating: false,
  })),
  on(RecipeActions.deleteRecipe, (state) => ({
    ...state,
    error: null,
    deleting: true,
  })),
  on(RecipeActions.deleteRecipeSuccess, (state, { recipeID }) => ({
    ...state,
    recipes: state.recipes.filter((item) => item.recipeID !== recipeID),
    deleting: false,
  })),
  on(RecipeActions.deleteRecipeFailure, (state, { error }) => ({
    ...state,
    error,
    deleting: false,
  })),
  on(RecipeActions.updateRecipeStatus, (state, { recipeID, status }) => ({
    ...state,
    recipes: state.recipes.map((recipe) =>
      recipe.recipeID === recipeID
        ? { ...recipe, status: status as RecipeStatus }
        : recipe
    ),
  })),
  on(RecipeActions.useRecipe, (state) => ({
    ...state,
    error: null,
    updating: true,
  })),
  on(RecipeActions.useRecipeSuccess, (state) => ({
    ...state,
    updating: false,
  })),
  on(RecipeActions.useRecipeFailure, (state, { error }) => ({
    ...state,
    error,
    updating: false,
  }))
);
