import { createSelector } from '@ngrx/store';
import { Profile } from './profile-state';

export const selectProfile = (state: any) => state.profile.profile;

export const selectFriends = (state: any) => state.profile.friends;

export const selectFriendByUserID = (userID: string) =>
  createSelector(selectFriends, (friends) => {
    return friends.find((friend: Profile) => friend.userID === userID);
  });

export const selectFollowers = (state: any) => state.profile.followers;

export const selectFollowerByUserID = (userID: string) =>
  createSelector(selectFollowers, (followers) => {
    return followers.find((follower: Profile) => follower.userID === userID);
  });

export const selectLoading = (state: any) => state.profile.loading;

export const selectDeleting = (state: any) => state.profile.deleting;

export const selectAdding = (state: any) => state.profile.adding;

export const selectUpdating = (state: any) => state.profile.updating;

export const selectError = (state: any) => state.profile.error;

