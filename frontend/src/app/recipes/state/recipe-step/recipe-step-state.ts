export interface RecipeStepState {
  recipeSteps: RecipeStep[];
  loading: boolean;
  adding: boolean;
  updating: boolean;
  deleting: boolean;
  error: RecipeStepError | null;
}

export interface RecipeStep {
  recipeStepID?: number;
  recipeID: number;
  stepID: number;
  sequence: number;
  photoURL?: string;
}

export interface RecipeStepError {
  errorType: string;
  message: string;
  statusCode?: number;
  rawError?: any;
}
