import { Tool } from 'src/app/kitchen/feature/tools/state/tool-state';
import { Ingredient } from 'src/app/kitchen/state/kitchen-interfaces';

export interface RecipeState {
  recipes: Recipe[];
  discoverRecipes: Recipe[];
  newRecipeID?: number;
  recipeSubscriptions: RecipeSubscription[];
  loading: boolean;
  adding: boolean;
  updating: boolean;
  deleting: boolean;
  error: RecipeError | null;
}

export interface RecipeSubscription {
  subscriptionID: number;
  sourceRecipeID: number;
  userRecipeID: number;
  startDate: string;
  authorID: number;
  authorUsername: string;
  authorName: string;
  authorPhotoURL: string;
}

export interface RecipeUse {
  satisfaction: number;
  difficulty: number;
  note: string;
}

export enum RecipeType {
  public = 'public',
  private = 'private',
  subscription = 'subscription',
}

export interface Recipe {
  recipeID: number;
  userID: number;
  title: string;
  servings: number;
  recipeCategoryID: number;
  recipeCategoryName?: string;
  type: RecipeType;
  lifespanDays: number;
  timePrep?: number;
  timeBake?: number;
  status: RecipeStatus;
  photoURL?: string;
  version?: number;
  subscription?: RecipeSubscription;
  hidden: boolean;
  freeTier: boolean;
}

export interface RecipeError {
  errorType: string;
  message: string;
  statusCode?: number;
  rawError?: any;
}

export interface ShoppingListIngredient {
  type: 'ingredient';
  ingredientName: string;
  ingredientID: number;
  quantity: number;
  unit: string;
  purchaseAfter: string | null;
}

export interface ShoppingListTool {
  type: 'tool';
  tool: Tool;
  quantity: number;
}

export interface RecipeShoppingList {
  ingredients: ShoppingListIngredient[] | null;
  // tools: ShoppingListTool[] | null;
}

export enum RecipeStatus {
  noIngredients = 'noIngredients',
  noTools = 'noTools',
  noSteps = 'noSteps',
  published = 'published',
}
