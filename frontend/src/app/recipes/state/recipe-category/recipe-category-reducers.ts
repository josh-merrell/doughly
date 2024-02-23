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
);
