import { createAction, props } from '@ngrx/store';
import { Profile } from './profile-state';

const loadProfile = createAction('[Profile] Load', props<{ userID?: string }>());
const loadProfileSuccess = createAction(
  '[Profile] Load Success',
  props<{ profile: Profile }>()
);
const loadProfileFailure = createAction(
  '[Profile] Load Failure',
  props<{ error: any }>()
);

const loadFriends = createAction('[Profile] Load Friends');
const loadFriendsSuccess = createAction(
  '[Profile] Load Friends Success',
  props<{ friends: Profile[] }>()
);
const loadFriendsFailure = createAction(
  '[Profile] Load Friends Failure',
  props<{ error: any }>()
);

const loadFriendRequests = createAction('[Profile] Load Friend Requests');
const loadFriendRequestsSuccess = createAction(
  '[Profile] Load Friend Requests Success',
  props<{ friendRequestProfiles: Profile[] }>()
);
const loadFriendRequestsFailure = createAction(
  '[Profile] Load Friend Requests Failure',
  props<{ error: any }>()
);

const loadFriendRequestsSent = createAction('[Profile] Load Friend Requests Sent');
const loadFriendRequestsSentSuccess = createAction(
  '[Profile] Load Friend Requests Sent Success',
  props<{ friendRequestSentProfiles: Profile[] }>()
);
const loadFriendRequestsSentFailure = createAction(
  '[Profile] Load Friend Requests Sent Failure',
  props<{ error: any }>()
);

const loadFriend = createAction('[Profile] Load Friend', props<{ friendUserID: string }>());
const loadFriendSuccess = createAction(
  '[Profile] Load Friend Success',
  props<{ friend: Profile }>()
);
const loadFriendFailure = createAction(
  '[Profile] Load Friend Failure',
  props<{ error: any }>()
);

const loadFollowers = createAction('[Profile] Load Followers');
const loadFollowersSuccess = createAction(
  '[Profile] Load Followers Success',
  props<{ followers: Profile[] }>()
);
const loadFollowersFailure = createAction(
  '[Profile] Load Followers Failure',
  props<{ error: any }>()
);

const loadFollowing = createAction('[Profile] Load Following');
const loadFollowingSuccess = createAction(
  '[Profile] Load Following Success',
  props<{ following: Profile[] }>()
);
const loadFollowingFailure = createAction(
  '[Profile] Load Following Failure',
  props<{ error: any }>()
);

const searchProfiles = createAction('[Profile] Search Profiles', props<{ searchQuery: string }>());
const searchProfilesSuccess = createAction(
  '[Profile] Search Profiles Success',
  props<{ searchResults: Profile[] }>()
);
const searchProfilesFailure = createAction(
  '[Profile] Search Profiles Failure',
  props<{ error: any }>()
);

const deleteFriend = createAction('[Profile] Delete Friend', props<{ friendUserID: string }>());
const deleteFriendSuccess = createAction(
  '[Profile] Delete Friend Success',
  props<{ friendUserID: string }>()
);
const deleteFriendFailure = createAction(
  '[Profile] Delete Friend Failure',
  props<{ error: any }>()
);

const deleteFollower = createAction('[Profile] Delete Follower', props<{ followerUserID: string }>());
const deleteFollowerSuccess = createAction(
  '[Profile] Delete Follower Success',
  props<{ followerUserID: string }>()
);
const deleteFollowerFailure = createAction(
  '[Profile] Delete Follower Failure',
  props<{ error: any }>()
);

export const ProfileActions = {
  loadProfile,
  loadProfileSuccess,
  loadProfileFailure,
  loadFriends,
  loadFriendsSuccess,
  loadFriendsFailure,
  loadFriendRequests,
  loadFriendRequestsSuccess,
  loadFriendRequestsFailure,
  loadFriendRequestsSent,
  loadFriendRequestsSentSuccess,
  loadFriendRequestsSentFailure,
  loadFriend,
  loadFriendSuccess,
  loadFriendFailure,
  loadFollowers,
  loadFollowersSuccess,
  loadFollowersFailure,
  loadFollowing,
  loadFollowingSuccess,
  loadFollowingFailure,
  searchProfiles,
  searchProfilesSuccess,
  searchProfilesFailure,
  deleteFriend,
  deleteFriendSuccess,
  deleteFriendFailure,
  deleteFollower,
  deleteFollowerSuccess,
  deleteFollowerFailure,
};
