import { createAction, props } from '@ngrx/store';
import { IngredientStock } from './kitchen-interfaces';

export const setView = createAction(
  '[Kitchen] Set View',
  props<{ view: string }>()
);
export const setInventoryView = createAction(
  '[Kitchen] Set Inventory View',
  props<{ inventoryView: string }>()
);

export const loadIngredientStocks = createAction('[Kitchen] Load Ingredients');
export const loadIngredientStocksSuccess = createAction(
  '[Kitchen] Load Ingredients Success',
  props<{ ingredients: IngredientStock[] }>()
);

export const loadIngredientStocksFailure = createAction(
  '[Kitchen] Load Ingredients Failure',
  props<{ error: any }>()
);

export const setReviewRecipe = createAction(
  '[Kitchen] Add Review Recipe',
  props<{ recipeID: number }>()
);

export const removeReviewRecipe = createAction(
  '[Kitchen] Remove Review Recipe'
);
