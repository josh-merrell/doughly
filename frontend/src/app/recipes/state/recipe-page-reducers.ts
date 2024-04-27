import { createReducer, on } from '@ngrx/store';
import { RecipePageActions } from './recipe-page-actions';
import { RecipePageState } from './recipe-page-state';

export const initialState: RecipePageState = {
  view: 'list',
};

export const recipePageReducer = createReducer(
  initialState,
  on(RecipePageActions.setView, (state, { view }) => ({ ...state, view })),
);