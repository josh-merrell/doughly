export interface ShoppingListRecipe {
  shoppingListRecipeID: number;
  shoppingListID: number;
  recipeID: number;
  plannedDate: Date; 
}

export interface ShoppingListRecipeState {
  shoppingListRecipes: ShoppingListRecipe[];
  loading: boolean;
  adding: boolean;
  updating: boolean;
  deleting: boolean;
  error: ShoppingListRecipeError | null;
}

export interface ShoppingListRecipeError {
  errorType: string;
  message: string;
  statusCode?: number;
  rawError?: any;
}