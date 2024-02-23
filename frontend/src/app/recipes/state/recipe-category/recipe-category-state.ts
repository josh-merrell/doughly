import { Recipe } from "../recipe/recipe-state";

export interface RecipeCategoryState {
  recipeCategories: RecipeCategory[];
  loading: boolean;
  adding: boolean;
  updating: boolean;
  deleting: boolean;
  error: RecipeCategoryError | null;
}

export interface RecipeCategory {
  recipeCategoryID: number;
  name: string;
  photoURL: string;
  recipeCount?: number;
  recipes?: Recipe[];
}

export interface RecipeCategoryError {
  errorType: string;
  message: string;
  statusCode?: number;
  rawError?: any;
}