export interface Ingredient {
  ingredientID?: number;
  name?: string;
  lifespanDays?: number;
  brand?: string;
  purchaseUnit?: string;
  gramRatio?: number;
}

export interface IngredientResponse {
  ingredientID: number;
}