import { AppState } from './app-state';
import { SharedState } from './shared-state';
import { createSelector} from '@ngrx/store';

export const selectShared = (state: AppState) => state.shared;

export const selectCurrentUrl = createSelector(selectShared, (state: SharedState) => state.currentUrl);
