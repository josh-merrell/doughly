import { createAction, props } from '@ngrx/store';
import { ShoppingListRecipe } from './shopping-list-recipe-state';

const loadShoppingListRecipes = createAction('[ShoppingListRecipes] Load', props<{ shoppingListID: number }>());
const loadShoppingListRecipesSuccess = createAction(
  '[ShoppingListRecipes] Load Success',
  props<{ shoppingListRecipes: ShoppingListRecipe[] }>()
);
const loadShoppingListRecipesFailure = createAction(
  '[ShoppingListRecipes] Load Failure',
  props<{ error: any }>()
);

const addShoppingListRecipe = createAction('[ShoppingListRecipes] Add', props<{ shoppingListID: number, recipeID: number, plannedDate: string }>());
const addShoppingListRecipeSuccess = createAction(
  '[ShoppingListRecipes] Add Success',
  props<{ shoppingListRecipe: ShoppingListRecipe }>()
);
const addShoppingListRecipeFailure = createAction(
  '[ShoppingListRecipes] Add Failure',
  props<{ error: any }>()
);

const deleteShoppingListRecipe = createAction(
  '[ShoppingListRecipes] Delete',
  props<{ shoppingListRecipeID: number; shoppingListID: number }>()
);
const deleteShoppingListRecipeSuccess = createAction(
  '[ShoppingListRecipes] Delete Success',
  props<{ shoppingListRecipeID: number, shoppingListID: number }>()
);
const deleteShoppingListRecipeFailure = createAction(
  '[ShoppingListRecipes] Delete Failure',
  props<{ error: any }>()
);

export const ShoppingListRecipeActions = {
  loadShoppingListRecipes,
  loadShoppingListRecipesSuccess,
  loadShoppingListRecipesFailure,
  addShoppingListRecipe,
  addShoppingListRecipeSuccess,
  addShoppingListRecipeFailure,
  deleteShoppingListRecipe,
  deleteShoppingListRecipeSuccess,
  deleteShoppingListRecipeFailure,
};
