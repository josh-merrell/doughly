export interface Ingredient {
  ingredientID: number;
  name: string;
  lifespanDays: number;
  brand?: string;
  gramRatio: number;
  purchaseUnit: string;
}

export interface IngredientState {
  ingredients: Ingredient[];
  loading: boolean;
  deleting: boolean;
  adding: boolean;
  editing: boolean;
  error: IngredientError | null;
}

export interface IngredientError {
  errorType: string;
  message: string;
  statusCode?: number;
  rawError?: any;
}
