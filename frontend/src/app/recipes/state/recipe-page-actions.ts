import { createAction, props } from '@ngrx/store';

const setView = createAction(
  '[Recipe Page] Set View', 
  props<{ view: string }>()
);
export const RecipePageActions = {
  setView,
}