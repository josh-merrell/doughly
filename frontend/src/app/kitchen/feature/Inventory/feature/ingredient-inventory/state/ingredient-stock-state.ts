export interface IngredientStock {
  ingredientStockID: number;
  ingredientID: number;
  purchasedBy: string;
  purchasedDate: string;
  grams: number;
  userID: string;
}

export interface IngredientStockState {
  ingredientStocks: IngredientStock[];
  loading: boolean;
  error: any;
}


export interface IngredientStockRow {
  ingredientStockID: number;
  name: string;
  brand: string;
  quantity: string;
  expiration: string;
}
