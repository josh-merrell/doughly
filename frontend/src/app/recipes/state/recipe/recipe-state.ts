export interface RecipeState {
  recipes: Recipe[];
  loading: boolean;
  adding: boolean;
  updating: boolean;
  deleting: boolean;
  error: RecipeError | null;
}

export interface Recipe {
  recipeID: number;
  title: string;
  servings: number;
  recipeCategoryID: number;
  lifespanDays: number;
  status: RecipeStatus;
  recipeCategoryName?: string;
}

export interface RecipeError {
  errorType: string;
  message: string;
  statusCode?: number;
  rawError?: any;
}

export enum RecipeStatus {
  noIngredients = 'noIngredients',
  noTools = 'noTools',
  noSteps = 'noSteps',
  published = 'Published',
}

