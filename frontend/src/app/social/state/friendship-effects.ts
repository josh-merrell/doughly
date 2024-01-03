import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, concatMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { SocialService } from '../data/social.service';
import { FriendshipActions } from './friendship-actions';
import { ProfileActions } from 'src/app/profile/state/profile-actions';

@Injectable()
export class FriendshipEffects {
  constructor(
    private actions$: Actions,
    private socialService: SocialService
  ) {}

  addFriendship$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(FriendshipActions.addFriendship),
      mergeMap((action) =>
        this.socialService.addFriendship(action.friend).pipe(
          map((friendship) =>
            FriendshipActions.addFriendshipSuccess({ friendship })
          ),
          catchError((error) =>
            of(
              FriendshipActions.addFriendshipFailure({
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
    );
  });

  loadFriendshipsAfterAdd$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FriendshipActions.addFriendshipSuccess),
      mergeMap(() => of(FriendshipActions.loadFriendships()))
    )
  );

  loadFriendships$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FriendshipActions.loadFriendships),
      mergeMap(() =>
        this.socialService.getAllFriendships().pipe(
          map((friendships) =>
            FriendshipActions.loadFriendshipsSuccess({ friendships })
          ),
          catchError((error) =>
            of(
              FriendshipActions.loadFriendshipsFailure({
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

  loadFriendship$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FriendshipActions.loadFriendship),
      mergeMap((action) =>
        this.socialService.getFriendshipByID(action.friendshipID).pipe(
          map((friendship) =>
            FriendshipActions.loadFriendshipSuccess({ friendship })
          ),
          catchError((error) =>
            of(
              FriendshipActions.loadFriendshipFailure({
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

  editFriendship$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FriendshipActions.editFriendship),
      mergeMap((action) =>
        this.socialService
          .updateFriendship(action.friendshipID, action.newStatus)
          .pipe(
            concatMap((friendship) => [
              FriendshipActions.editFriendshipSuccess({ friendship }),
              ProfileActions.loadFriends(),
              ProfileActions.loadFriendRequests(),
            ]),
            catchError((error) =>
              of(
                FriendshipActions.editFriendshipFailure({
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

  deleteFriendship$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FriendshipActions.deleteFriendship),
      mergeMap((action) =>
        this.socialService.deleteFriendship(action.friendshipID).pipe(
          concatMap(() => [
            FriendshipActions.deleteFriendshipSuccess({
              friendshipID: action.friendshipID,
            }),
            ProfileActions.loadFriends(),
            ProfileActions.loadFriendRequests(),
          ]),
          catchError((error) =>
            of(
              FriendshipActions.deleteFriendshipFailure({
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

  loadFriendshipsAfterDelete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FriendshipActions.deleteFriendshipSuccess),
      mergeMap(() => of(FriendshipActions.loadFriendships()))
    )
  );
}
