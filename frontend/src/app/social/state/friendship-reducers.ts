import { createReducer, on } from '@ngrx/store';
import { FriendshipActions } from './friendship-actions';
import { FriendshipState } from './friendship-state';

export const initialState: FriendshipState = {
  friendships: [],
  loading: false,
  deleting: false,
  adding: false,
  updating: false,
  error: null,
};

export const FriendshipReducer = createReducer(
  initialState,
  on(FriendshipActions.loadFriendships, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(FriendshipActions.loadFriendshipsSuccess, (state, { friendships }) => ({
    ...state,
    friendships,
    loading: false,
  })),
  on(FriendshipActions.loadFriendshipsFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(FriendshipActions.loadFriendship, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(FriendshipActions.loadFriendshipSuccess, (state, { friendship }) => {
    return {
      ...state,
      loading: false,
      friendships: state.friendships.map((storeFriendship) =>
        storeFriendship.friendshipID === friendship.friendshipID
          ? friendship
          : storeFriendship
      ),
    };
  }),
  on(FriendshipActions.loadFriendshipFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(FriendshipActions.addFriendship, (state) => ({
    ...state,
    adding: true,
    error: null,
  })),
  on(FriendshipActions.addFriendshipSuccess, (state, { friendship }) => ({
    ...state,
    adding: false,
    friendships: [...state.friendships, friendship],
  })),
  on(FriendshipActions.addFriendshipFailure, (state, { error }) => ({
    ...state,
    error,
    adding: false,
  })),
  on(FriendshipActions.editFriendship, (state) => ({
    ...state,
    updating: true,
    error: null,
  })),
  on(FriendshipActions.editFriendshipSuccess, (state, { friendship }) => ({
    ...state,
    updating: false,
    friendships: state.friendships.map((storeFriendship) =>
      storeFriendship.friendshipID === friendship.friendshipID
        ? friendship
        : storeFriendship
    ),
  })),
  on(FriendshipActions.editFriendshipFailure, (state, { error }) => ({
    ...state,
    error,
    updating: false,
  })),
  on(FriendshipActions.deleteFriendship, (state) => ({
    ...state,
    deleting: true,
    error: null,
  })),
  on(FriendshipActions.deleteFriendshipSuccess, (state, { friendshipID }) => ({
    ...state,
    deleting: false,
    friendships: state.friendships.filter(
      (storeFriendship) =>
        storeFriendship.friendshipID !== friendshipID
    ),
  })),
  on(FriendshipActions.deleteFriendshipFailure, (state, { error }) => ({
    ...state,
    error,
    deleting: false,
  }))
)