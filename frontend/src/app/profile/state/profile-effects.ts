import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ProfileService } from '../data/profile.service';
import { ProfileActions } from './profile-actions';

@Injectable()
export class ProfileEffects {
  constructor(
    private actions$: Actions,
    private profileService: ProfileService
  ) {}

  loadFriends$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfileActions.loadFriends),
      mergeMap(() =>
        this.profileService.getFriends().pipe(
          map((friends) => ProfileActions.loadFriendsSuccess({ friends })),
          catchError((error) =>
            of(
              ProfileActions.loadFriendsFailure({
                error: {
                  message: error.error.error,
                  statusCode: error.status,
                  rawError: error,
                },
              })
            )
          )
        )
      )
    )
  );

  loadFriendRequests$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfileActions.loadFriendRequests),
      mergeMap(() =>
        this.profileService.getFriendRequests().pipe(
          map((friendRequestProfiles) =>
            ProfileActions.loadFriendRequestsSuccess({ friendRequestProfiles })
          ),
          catchError((error) =>
            of(
              ProfileActions.loadFriendRequestsFailure({
                error: {
                  message: error.error.error,
                  statusCode: error.status,
                  rawError: error,
                },
              })
            )
          )
        )
      )
    )
  );

  loadFriendRequestsSent$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfileActions.loadFriendRequestsSent),
      mergeMap(() =>
        this.profileService.getFriendRequestsSent().pipe(
          map((friendRequestSentProfiles) =>
            ProfileActions.loadFriendRequestsSentSuccess({
              friendRequestSentProfiles,
            })
          ),
          catchError((error) =>
            of(
              ProfileActions.loadFriendRequestsSentFailure({
                error: {
                  message: error.error.error,
                  statusCode: error.status,
                  rawError: error,
                },
              })
            )
          )
        )
      )
    )
  );

  loadFollowers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfileActions.loadFollowers),
      mergeMap(() =>
        this.profileService.getFollowers().pipe(
          map((followers) =>
            ProfileActions.loadFollowersSuccess({ followers })
          ),
          catchError((error) =>
            of(
              ProfileActions.loadFollowersFailure({
                error: {
                  message: error.error.error,
                  statusCode: error.status,
                  rawError: error,
                },
              })
            )
          )
        )
      )
    )
  );

  loadFollowing$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfileActions.loadFollowing),
      mergeMap(() =>
        this.profileService.getFollowing().pipe(
          map((following) =>
            ProfileActions.loadFollowingSuccess({ following })
          ),
          catchError((error) =>
            of(
              ProfileActions.loadFollowingFailure({
                error: {
                  message: error.error.error,
                  statusCode: error.status,
                  rawError: error,
                },
              })
            )
          )
        )
      )
    )
  );

  loadFriend$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfileActions.loadFriend),
      mergeMap((action) =>
        this.profileService.getFriendByID(action.friendUserID).pipe(
          map((friend) => ProfileActions.loadFriendSuccess({ friend })),
          catchError((error) =>
            of(
              ProfileActions.loadFriendFailure({
                error: {
                  message: error.error.error,
                  statusCode: error.status,
                  rawError: error,
                },
              })
            )
          )
        )
      )
    )
  );

  loadProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfileActions.loadProfile),
      mergeMap((action) => {
        // Check if userID is provided
        const call$ = action.userID
          ? this.profileService.getProfile(action.userID)
          : this.profileService.getProfile();

        return call$.pipe(
          map((profile) => ProfileActions.loadProfileSuccess({ profile })),
          catchError((error) =>
            of(
              ProfileActions.loadProfileFailure({
                error: {
                  message: error.error.error,
                  statusCode: error.status,
                  rawError: error,
                },
              })
            )
          )
        );
      })
    )
  );

  searchProfiles$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfileActions.searchProfiles),
      mergeMap((action) =>
        this.profileService.searchProfiles(action.searchQuery).pipe(
          map((searchResults) =>
            ProfileActions.searchProfilesSuccess({ searchResults })
          ),
          catchError((error) =>
            of(
              ProfileActions.searchProfilesFailure({
                error: {
                  message: error.error.error,
                  statusCode: error.status,
                  rawError: error,
                },
              })
            )
          )
        )
      )
    )
  );

  // deleteFriend$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(ProfileActions.deleteFriend),
  //     mergeMap((action) =>
  //       this.profileService.deleteFriend(action.friendUserID).pipe(
  //         map(() =>
  //           ProfileActions.deleteFriendSuccess({
  //             friendUserID: action.friendUserID,
  //           })
  //         ),
  //         catchError((error) =>
  //           of(ProfileActions.deleteFriendFailure({ error }))
  //         )
  //       )
  //     )
  //   )
  // );

  // deleteFollower$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(ProfileActions.deleteFollower),
  //     mergeMap((action) =>
  //       this.profileService.deleteFollower(action.followerUserID).pipe(
  //         map(() =>
  //           ProfileActions.deleteFollowerSuccess({
  //             followerUserID: action.followerUserID,
  //           })
  //         ),
  //         catchError((error) =>
  //           of(ProfileActions.deleteFollowerFailure({ error }))
  //         )
  //       )
  //     )
  //   )
  // );
}
