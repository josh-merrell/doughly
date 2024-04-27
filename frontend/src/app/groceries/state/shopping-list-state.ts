import { ShoppingListRecipe } from "./shopping-list-recipe-state";

export interface ShoppingList {
  shoppingListID: number;
  status: string;
  fulfilledDate?: Date;
  fulfilledMethod?: string;
  ingredients: ShoppingListIngredient[];
  recipes: ShoppingListRecipe[];
}

export interface ShoppingListIngredient {
  shoppingListIngredientID: number;
  shoppingListID: number;
  ingredientID: number;
  shoppingListRecipeID?: number;
  needMeasurement: number;
  needUnit: string;
  purchasedMeasurement?: number;
  purchasedUnit?: string;
  status: string;
}

export interface ShoppingListState {
  shoppingLists: ShoppingList[];
  shoppingListIngredients: ShoppingListIngredient[];
  shoppingListRecipes: ShoppingListRecipe[];
  loading: boolean;
  adding: boolean;
  updating: boolean;
  deleting: boolean;
  error: ShoppingListError | null;
}

export interface ShoppingListError {
  errorType: string;
  message: string;
  statusCode?: number;
  rawError?: any;
}