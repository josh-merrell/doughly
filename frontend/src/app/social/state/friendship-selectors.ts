import { createSelector } from '@ngrx/store';
import { Friendship } from './friendship-state';

export const selectFriendships = (state: any) => state.social.friendships;

export const selectFriendshipByID = (friendshipID: number) =>
  createSelector(selectFriendships, (friendships) => {
    return friendships.find(
      (friendship: Friendship) => friendship.friendshipID === friendshipID
    );
  });

export const selectDeleting = (state: any) => state.social.deleting;

export const selectAdding = (state: any) => state.social.adding;

export const selectUpdating = (state: any) => state.social.updating;

export const selectError = (state: any) => state.social.error;

export const selectLoading = (state: any) => state.social.loading;
