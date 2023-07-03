export interface Ingredient {
  ingredientID: number;
  name: string;
  lifespanDays: number;
  brand: string;
  gramRatio: number;
  purchaseUnit: string;
}

export interface IngredientState {
  ingredients: Ingredient[];
  loading: boolean;
  error: any;
}
