import { AppState } from '../../shared/state/app-state';
import { KitchenState } from './kitchen-state';
import { createSelector } from '@ngrx/store';

export const selectKitchen = (state: AppState) => state.kitchen;

export const selectView = createSelector(selectKitchen, (state: KitchenState) => state.view);
export const selectInventoryView = createSelector(selectKitchen, (state: KitchenState) => state.inventoryView);