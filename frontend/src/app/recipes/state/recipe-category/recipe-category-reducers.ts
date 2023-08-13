import { createReducer, on } from '@ngrx/store';
import { RecipeCategoryActions } from './recipe-category-actions';
import { RecipeCategoryState } from './recipe-category-state';

export const initialState: RecipeCategoryState = {
  recipeCategories: [],
  loading: false,
  error: null,
  adding: false,
  updating: false,
  deleting: false,
};

export const recipeCategoryReducer = createReducer(
  initialState,
  on(RecipeCategoryActions.loadRecipeCategories, (state) => ({
    ...state,
    error: null,
    loading: true,
  })),
  on(
    RecipeCategoryActions.loadRecipeCategoriesSuccess,
    (state, { recipeCategories }) => ({
      ...state,
      recipeCategories,
      loading: false,
    })
  ),
  on(RecipeCategoryActions.loadRecipeCategoriesFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(RecipeCategoryActions.loadRecipeCategory, (state) => ({
    ...state,
    error: null,
    loading: true,
  })),
  on(
    RecipeCategoryActions.loadRecipeCategorySuccess,
    (state, { recipeCategory }) => {
      return {
        ...state,
        loading: false,
        recipeCategories: state.recipeCategories.map((category) =>
          category.recipeCategoryID === recipeCategory.recipeCategoryID
            ? recipeCategory
            : category
        ),
      };
    }
  ),
  on(RecipeCategoryActions.loadRecipeCategoryFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(RecipeCategoryActions.addRecipeCategory, (state) => ({
    ...state,
    error: null,
    adding: true,
  })),
  on(
    RecipeCategoryActions.addRecipeCategorySuccess,
    (state, { recipeCategory }) => ({
      ...state,
      recipeCategories: [...state.recipeCategories, recipeCategory],
      adding: false,
    })
  ),
  on(RecipeCategoryActions.addRecipeCategoryFailure, (state, { error }) => ({
    ...state,
    error,
    adding: false,
  })),
  on(RecipeCategoryActions.deleteRecipeCategory, (state) => ({
    ...state,
    error: null,
    deleting: true,
  })),
  on(
    RecipeCategoryActions.deleteRecipeCategorySuccess,
    (state, { recipeCategoryID }) => ({
      ...state,
      recipeCategories: state.recipeCategories.filter(
        (category) => category.recipeCategoryID !== recipeCategoryID
      ),
      deleting: false,
    })
  ),
  on(RecipeCategoryActions.deleteRecipeCategoryFailure, (state, { error }) => ({
    ...state,
    error,
    deleting: false,
  })),
  on(RecipeCategoryActions.updateRecipeCategory, (state) => ({
    ...state,
    error: null,
    updating: true,
  })),
  on(
    RecipeCategoryActions.updateRecipeCategorySuccess,
    (state, { recipeCategory }) => ({
      ...state,
      recipeCategories: state.recipeCategories.map((category) =>
        category.recipeCategoryID === recipeCategory.recipeCategoryID
          ? recipeCategory
          : category
      ),
      updating: false,
    })
  ),
  on(RecipeCategoryActions.updateRecipeCategoryFailure, (state, { error }) => ({
    ...state,
    error,
    updating: false,
  }))
);
