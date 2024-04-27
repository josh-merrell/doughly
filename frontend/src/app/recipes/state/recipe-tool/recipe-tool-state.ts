export interface RecipeToolState {
  recipeTools: RecipeTool[];
  loading: boolean;
  adding: boolean;
  updating: boolean;
  deleting: boolean;
  error: RecipeToolError | null;
}

export interface RecipeTool {
  recipeToolID: number;
  recipeID: number;
  toolID: number;
  quantity: number;
}

export interface RecipeToolError {
  errorType: string;
  message: string;
  statusCode?: number;
  rawError?: any;
}
