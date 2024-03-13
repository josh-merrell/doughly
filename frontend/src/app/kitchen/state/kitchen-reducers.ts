// setCurrentView;

import { createReducer, on } from '@ngrx/store';
import { setView, setInventoryView, setReviewRecipe, removeReviewRecipe } from './kitchen-actions';
import { KitchenState } from './kitchen-state';

export const initialState: KitchenState = {
  view: 'ingredients',
  inventoryView: 'ingredients',
};

export const kitchenReducer = createReducer(
  initialState,
  on(setView, (state, { view }) => {
    const newState: KitchenState = { ...state, view, inventoryView: 'none' };
    return newState;
  }),
  on(setInventoryView, (state, { inventoryView }) => {
    const newState: KitchenState = { ...state, inventoryView: inventoryView };
    return newState;
  }),
  on(setReviewRecipe, (state, { recipeID }) => {
    const newState: KitchenState = { ...state, reviewRecipeID: recipeID };
    return newState;
  }),
  on(removeReviewRecipe, (state) => {
    const newState: KitchenState = { ...state, reviewRecipeID: undefined };
    return newState;
  })
);
