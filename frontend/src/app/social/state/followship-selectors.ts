import { createSelector } from '@ngrx/store';
import { Followship } from './followship-state';

export const selectFollowships = (state: any) => state.followships.followships;

export const selectFollowers = (state: any) => state.followships.followers;

export const selectFollowshipByID = (followshipID: number) =>
  createSelector(selectFollowships, (followships) => {
    return followships.find(
      (followship: Followship) => followship.followshipID === followshipID
    );
  });

export const selectDeleting = (state: any) => state.followships.deleting;

export const selectAdding = (state: any) => state.followships.adding;

export const selectUpdating = (state: any) => state.followships.updating;

export const selectError = (state: any) => state.followships.error;

export const selectLoading = (state: any) => state.followships.loading;

