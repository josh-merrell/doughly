import { createSelector } from '@ngrx/store';
import { Followship } from './followship-state';

export const selectFollowships = (state: any) => state.followships.followships;

export const selectFollowers = (state: any) => state.followship.followers;

export const selectFollowshipByID = (followshipID: number) =>
  createSelector(selectFollowships, (followships) => {
    return followships.find(
      (followship: Followship) => followship.followshipID === followshipID
    );
  });

export const selectDeleting = (state: any) => state.followship.deleting;

export const selectAdding = (state: any) => state.followship.adding;

export const selectUpdating = (state: any) => state.followship.updating;

export const selectError = (state: any) => state.followship.error;

export const selectLoading = (state: any) => state.followship.loading;

