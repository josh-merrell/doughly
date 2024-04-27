import { createAction, props } from '@ngrx/store';
import { Followship } from './followship-state';

const loadFollowships = createAction('[Followships] Load');
const loadFollowshipsSuccess = createAction(
  '[Followships] Load Success',
  props<{ followships: Followship[] }>()
);
const loadFollowshipsFailure = createAction(
  '[Followships] Load Failure',
  props<{ error: any }>()
);

const loadFollowship = createAction(
  '[Followships] Load Single',
  props<{ followshipID: number }>()
);
const loadFollowshipSuccess = createAction(
  '[Followships] Load Single Success',
  props<{ followship: Followship }>()
);
const loadFollowshipFailure = createAction(
  '[Followships] Load Single Failure',
  props<{ error: any }>()
);

const loadFollowers = createAction('[Followships] Load Followers');
const loadFollowersSuccess = createAction(
  '[Followships] Load Followers Success',
  props<{ followers: Followship[] }>()
);
const loadFollowersFailure = createAction(
  '[Followships] Load Followers Failure',
  props<{ error: any }>()
);

const addFollowship = createAction(
  '[Followships] Add',
  props<{ following: string }>()
);
const addFollowshipSuccess = createAction(
  '[Followships] Add Success',
  props<{ followship: Followship }>()
);
const addFollowshipFailure = createAction(
  '[Followships] Add Failure',
  props<{ error: any }>()
);

const deleteFollowship = createAction(
  '[Followships] Delete',
  props<{ followshipID: number }>()
);
const deleteFollowshipSuccess = createAction(
  '[Followships] Delete Success',
  props<{ followshipID: number }>()
);
const deleteFollowshipFailure = createAction(
  '[Followships] Delete Failure',
  props<{ error: any }>()
);

export const FollowshipActions = {
  loadFollowships,
  loadFollowshipsSuccess,
  loadFollowshipsFailure,
  loadFollowship,
  loadFollowshipSuccess,
  loadFollowshipFailure,
  loadFollowers,
  loadFollowersSuccess,
  loadFollowersFailure,
  addFollowship,
  addFollowshipSuccess,
  addFollowshipFailure,
  deleteFollowship,
  deleteFollowshipSuccess,
  deleteFollowshipFailure,
}