export interface ShoppingListIngredient {
  shoppingListIngredientID: number;
  shoppingListID: number;
  ingredientID: number;
  needMeasurement: number;
  needUnit: string;
  source: string;
  purchasedMeasurement?: number;
  purchasedUnit?: string;
  store?: string;
}

export interface ShoppingListIngredientState {
  shoppingListIngredients: ShoppingListIngredient[];
  loading: boolean;
  adding: boolean;
  updating: boolean;
  deleting: boolean;
  error: ShoppingListIngredientError | null;
}

export interface ShoppingListIngredientError {
  errorType: string;
  message: string;
  statusCode?: number;
  rawError?: any;
}