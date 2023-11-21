import { createSelector } from '@ngrx/store';
import { Friendship } from './friendship-state';

export const selectFriendships = (state: any) => state.friendships;

export const selectFriendshipByID = (friendshipID: number) =>
  createSelector(selectFriendships, (friendships) => {
    return friendships.find(
      (friendship: Friendship) => friendship.friendshipID === friendshipID
    );
  });

export const selectDeleting = (state: any) => state.friendships.deleting;

export const selectAdding = (state: any) => state.friendships.adding;

export const selectUpdating = (state: any) => state.friendships.updating;

export const selectError = (state: any) => state.friendships.error;

export const selectLoading = (state: any) => state.friendships.loading;
