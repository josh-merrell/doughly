import { createAction, props } from '@ngrx/store';

export const setView = createAction('[Kitchen] Set View', props<{ view: string }>());
export const setInventoryView = createAction(
  '[Kitchen] Set Inventory View',
  props<{ inventoryView: string }>()
);