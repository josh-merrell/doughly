// setCurrentView;

import { createReducer, on } from '@ngrx/store';
import { setView, setInventoryView } from './kitchen-actions';
import { KitchenState } from './kitchen-state';

export const initialState: KitchenState = {
  view: 'inventory',
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
  })
);
