import { createSelector } from '@ngrx/store';
import { Friendship } from './friendship-state';

export const selectFriendships = (state: any) => state.friendship.friendships;

export const selectFriendshipByID = (friendshipID: number) =>
  createSelector(selectFriendships, (friendships) => {
    return friendships.find(
      (friendship: Friendship) => friendship.friendshipID === friendshipID
    );
  });

export const selectFriendshipByFriendID = (friendID: string) =>
  createSelector(selectFriendships, (friendships) => {
    return friendships.find(
      (friendship: Friendship) => friendship.friend === friendID
    );
  });

export const selectDeleting = (state: any) => state.friendship.deleting;

export const selectAdding = (state: any) => state.friendship.adding;

export const selectUpdating = (state: any) => state.friendship.updating;

export const selectError = (state: any) => state.friendship.error;

export const selectLoading = (state: any) => state.friendship.loading;
