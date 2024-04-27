import { RecipePageState } from './recipe-page-state';
import { createSelector } from '@ngrx/store';

export const selectRecipePage = (state: any) => state.recipePage;

export const selectView = createSelector(selectRecipePage, (state: RecipePageState) => state.view);