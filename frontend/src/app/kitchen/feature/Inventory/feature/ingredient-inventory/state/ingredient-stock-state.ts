export interface IngredientStockState {
  ingredientStocks: IngredientStock[];
  loading: boolean;
  adding: boolean;
  updating: boolean;
  deleting: boolean;
  error: IngredientStockError | null;
}
export interface IngredientStock {
  IDtype?: number;
  ingredientStockID: number;
  ingredientID: number;
  purchasedDate: string;
  grams: number;
  userID: string;
}


export interface IngredientStockRow {
  ingredientStockID: number;
  name: string;
  brand?: string;
  quantity: string;
  expiration: string;
}

export interface IngredientStockError {
  errorType: string;
  message: string;
  statusCode?: number;
  rawError?: any;
}
