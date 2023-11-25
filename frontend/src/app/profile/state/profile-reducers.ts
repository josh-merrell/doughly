import { createReducer, on } from '@ngrx/store';
import { ProfileActions } from './profile-actions';
import { ProfileState } from './profile-state';

export const initialState: ProfileState = {
  profile: null,
  friends: [],
  followers: [],
  following: [],
  friendRequestProfiles: [],
  friendRequestSentProfiles: [],
  searchResults: [],
  loading: false,
  deleting: false,
  adding: false,
  updating: false,
  error: null,
};

export const ProfileReducer = createReducer(
  initialState,
  on(ProfileActions.loadProfile, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ProfileActions.loadProfileSuccess, (state, { profile }) => ({
    ...state,
    profile,
    loading: false,
  })),
  on(ProfileActions.loadProfileFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(ProfileActions.loadFriends, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ProfileActions.loadFriendsSuccess, (state, { friends }) => ({
    ...state,
    friends,
    loading: false,
  })),
  on(ProfileActions.loadFriendsFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(ProfileActions.loadFriendRequests, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(
    ProfileActions.loadFriendRequestsSuccess,
    (state, { friendRequestProfiles }) => ({
      ...state,
      friendRequestProfiles,
      loading: false,
    })
  ),
  on(ProfileActions.loadFriendRequestsFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(ProfileActions.loadFriendRequestsSent, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(
    ProfileActions.loadFriendRequestsSentSuccess,
    (state, { friendRequestSentProfiles }) => ({
      ...state,
      friendRequestSentProfiles,
      loading: false,
    })
  ),
  on(ProfileActions.loadFriendRequestsSentFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(ProfileActions.loadFriend, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ProfileActions.loadFriendSuccess, (state, { friend }) => {
    return {
      ...state,
      loading: false,
      friends: state.friends.map((storeFriend) =>
        storeFriend.userID === friend.userID ? friend : storeFriend
      ),
    };
  }),
  on(ProfileActions.loadFriendFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(ProfileActions.loadFollowers, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ProfileActions.loadFollowersSuccess, (state, { followers }) => ({
    ...state,
    followers,
    loading: false,
  })),
  on(ProfileActions.loadFollowersFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(ProfileActions.loadFollowing, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ProfileActions.loadFollowingSuccess, (state, { following }) => ({
    ...state,
    following,
    loading: false,
  })),
  on(ProfileActions.loadFollowingFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(ProfileActions.searchProfiles, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ProfileActions.searchProfilesSuccess, (state, { searchResults }) => ({
    ...state,
    searchResults,
    loading: false,
  })),
  on(ProfileActions.searchProfilesFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(ProfileActions.deleteFriend, (state) => ({
    ...state,
    deleting: true,
    error: null,
  })),
  on(ProfileActions.deleteFriendSuccess, (state, { friendUserID }) => ({
    ...state,
    deleting: false,
    friends: state.friends.filter(
      (storeFriend) => storeFriend.userID !== friendUserID
    ),
  })),
  on(ProfileActions.deleteFriendFailure, (state, { error }) => ({
    ...state,
    error,
    deleting: false,
  })),
  on(ProfileActions.deleteFollower, (state) => ({
    ...state,
    deleting: true,
    error: null,
  })),
  on(ProfileActions.deleteFollowerSuccess, (state, { followerUserID }) => ({
    ...state,
    deleting: false,
    followers: state.followers.filter(
      (storeFollower) => storeFollower.userID !== followerUserID
    ),
  })),
  on(ProfileActions.deleteFollowerFailure, (state, { error }) => ({
    ...state,
    error,
    deleting: false,
  }))
);