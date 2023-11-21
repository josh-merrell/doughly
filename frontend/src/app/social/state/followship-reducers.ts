import { createReducer, on } from '@ngrx/store';
import { FollowshipActions } from './followship-actions';
import { FollowshipState } from './followship-state';

export const initialState: FollowshipState = {
  followships: [],
  followers: [],
  loading: false,
  deleting: false,
  adding: false,
  updating: false,
  error: null,
};

export const FollowshipReducer = createReducer(
  initialState,
  on(FollowshipActions.loadFollowships, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(FollowshipActions.loadFollowshipsSuccess, (state, { followships }) => ({
    ...state,
    followships,
    loading: false,
  })),
  on(FollowshipActions.loadFollowshipsFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(FollowshipActions.loadFollowship, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(FollowshipActions.loadFollowshipSuccess, (state, { followship }) => {
    return {
      ...state,
      loading: false,
      followships: state.followships.map((storeFollowship) =>
        storeFollowship.followshipID === followship.followshipID
          ? followship
          : storeFollowship
      ),
    };
  }),
  on(FollowshipActions.loadFollowshipFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(FollowshipActions.loadFollowers, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(FollowshipActions.loadFollowersSuccess, (state, { followers }) => ({
    ...state,
    followers,
    loading: false,
  })),
  on(FollowshipActions.loadFollowersFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
  on(FollowshipActions.addFollowship, (state) => ({
    ...state,
    adding: true,
    error: null,
  })),
  on(FollowshipActions.addFollowshipSuccess, (state, { followship }) => ({
    ...state,
    adding: false,
    followships: [...state.followships, followship],
  })),
  on(FollowshipActions.addFollowshipFailure, (state, { error }) => ({
    ...state,
    error,
    adding: false,
  })),
  on(FollowshipActions.deleteFollowship, (state) => ({
    ...state,
    deleting: true,
    error: null,
  })),
  on(FollowshipActions.deleteFollowshipSuccess, (state, { followshipID }) => ({
    ...state,
    deleting: false,
    followships: state.followships.filter(
      (followship) => followship.followshipID !== followshipID
    ),
  })),
  on(FollowshipActions.deleteFollowshipFailure, (state, { error }) => ({
    ...state,
    error,
    deleting: false,
})),
);