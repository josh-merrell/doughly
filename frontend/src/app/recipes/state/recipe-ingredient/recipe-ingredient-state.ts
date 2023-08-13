export interface RecipeIngredientState {
  recipeIngredients: RecipeIngredient[];
  loading: boolean;
  adding: boolean;
  updating: boolean;
  deleting: boolean;
  error: RecipeIngredientError | null;
}

export interface RecipeIngredient {
  recipeIngredientID: number;
  recipeID: number;
  ingredientID: number;
  measurement: number;
  measurementUnit: string;
}

export interface RecipeIngredientError {
  errorType: string;
  message: string;
  statusCode?: number;
  rawError?: any;
}