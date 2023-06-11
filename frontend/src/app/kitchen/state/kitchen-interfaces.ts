export interface IngredientStock {
  userID?: number;
  ingredientStockID?: number;
  ingredientID?: number;
  grams?: number;
  purchasedBy?: string;
  purchasedDate?: string;
}

export interface Ingredient {
  ingredientID?: number;
  name?: string;
  lifespanDays?: number;
  brand?: string;
  purchaseUnit?: string;
  gramRatio?: number;
}
