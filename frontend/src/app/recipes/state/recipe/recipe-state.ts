import { Tool } from "src/app/kitchen/feature/tools/state/tool-state";
import { Ingredient } from "src/app/kitchen/state/kitchen-interfaces";

export interface RecipeState {
  recipes: Recipe[];
  loading: boolean;
  adding: boolean;
  updating: boolean;
  deleting: boolean;
  error: RecipeError | null;
}

export interface Recipe {
  recipeID: number;
  title: string;
  servings: number;
  recipeCategoryID: number;
  lifespanDays: number;
  timePrep?: number;
  timeBake?: number;
  status: RecipeStatus;
  photoURL?: string;
  recipeCategoryName?: string;
}

export interface RecipeError {
  errorType: string;
  message: string;
  statusCode?: number;
  rawError?: any;
}

export interface ShoppingListIngredient {
  type: 'ingredient',
  ingredientName: string,
  quantity: number,
  unit: string,
  purchaseAfter: string | null,
}

export interface ShoppingListTool {
  type: 'tool',
  tool: Tool,
  quantity: number,
}

export interface ShoppingList {
  ingredients: ShoppingListIngredient[] | null;
  // tools: ShoppingListTool[] | null;
}

export enum RecipeStatus {
  noIngredients = 'noIngredients',
  noTools = 'noTools',
  noSteps = 'noSteps',
  published = 'Published',
}


