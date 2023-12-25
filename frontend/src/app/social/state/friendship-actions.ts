import { createAction, props } from '@ngrx/store';
import { Friendship } from './friendship-state';

const loadFriendships = createAction('[Friendships] Load');
const loadFriendshipsSuccess = createAction(
  '[Friendships] Load Success',
  props<{ friendships: Friendship[] }>()
);
const loadFriendshipsFailure = createAction(
  '[Friendships] Load Failure',
  props<{ error: any }>()
);

const loadFriendship = createAction(
  '[Friendships] Load Single',
  props<{ friendshipID: number }>()
);
const loadFriendshipSuccess = createAction(
  '[Friendships] Load Single Success',
  props<{ friendship: Friendship }>()
);
const loadFriendshipFailure = createAction(
  '[Friendships] Load Single Failure',
  props<{ error: any }>()
);

const addFriendship = createAction(
  '[Friendships] Add',
  props<{ friend: string }>()
);
const addFriendshipSuccess = createAction(
  '[Friendships] Add Success',
  props<{ friendship: Friendship }>()
);
const addFriendshipFailure = createAction(
  '[Friendships] Add Failure',
  props<{ error: any }>()
);

const deleteFriendship = createAction(
  '[Friendships] Delete',
  props<{ friendshipID: number }>()
);
const deleteFriendshipSuccess = createAction(
  '[Friendships] Delete Success',
  props<{ friendshipID: number }>()
);
const deleteFriendshipFailure = createAction(
  '[Friendships] Delete Failure',
  props<{ error: any }>()
);

const editFriendship = createAction(
  '[Friendships] Edit',
  props<{ friendshipID: Number, newStatus: string }>()
);
const editFriendshipSuccess = createAction(
  '[Friendships] Edit Success',
  props<{ friendship: Friendship }>()
);
const editFriendshipFailure = createAction(
  '[Friendships] Edit Failure',
  props<{ error: any }>()
);

export const FriendshipActions = {
  loadFriendships,
  loadFriendshipsSuccess,
  loadFriendshipsFailure,
  loadFriendship,
  loadFriendshipSuccess,
  loadFriendshipFailure,
  addFriendship,
  addFriendshipSuccess,
  addFriendshipFailure,
  deleteFriendship,
  deleteFriendshipSuccess,
  deleteFriendshipFailure,
  editFriendship,
  editFriendshipSuccess,
  editFriendshipFailure,
};
