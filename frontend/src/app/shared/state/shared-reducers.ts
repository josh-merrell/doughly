import { createReducer, on } from '@ngrx/store';
import { setCurrentUrl } from './shared-actions';
import { SharedState } from './shared-state';

export const initialState: SharedState = {
  currentUrl: '/',
};

export const sharedReducer = createReducer(
  initialState,
  on(setCurrentUrl, (state, { url }) => ({ ...state, currentUrl: url })),
);
