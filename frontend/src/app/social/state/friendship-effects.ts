import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { SocialService } from '../data/social.service';
import { FriendshipActions } from './friendship-actions';

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
        this.socialService.addFriendship(action.friendship).pipe(
          map((friendship) =>
            FriendshipActions.addFriendshipSuccess({friendship})
          ),
          catchError((error) =>
            of(
              FriendshipActions.addFriendshipFailure({
                error: {
                  errorType: 'ADD_FRIENDSHIP_FAILURE',
                  message: 'Failed to add friendship',
                  statusCode: error.status,
                  rawError: error,
                },
              })
            )
          )
        )
      )
    );
  })

  loadFriendships$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FriendshipActions.loadFriendships),
      mergeMap(() =>
        this.socialService.getAllFriendships().pipe(
          map((friendships) =>
            FriendshipActions.loadFriendshipsSuccess({ friendships })
          ),
          catchError((error) =>
            of(FriendshipActions.loadFriendshipsFailure({ error }))
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
            of(FriendshipActions.loadFriendshipFailure({ error }))
          )
        )
      )
    )
  );

  editFriendship$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FriendshipActions.editFriendship),
      mergeMap((action) =>
        this.socialService.updateFriendship(action.friendship).pipe(
          map((friendship) =>
            FriendshipActions.editFriendshipSuccess({ friendship })
          ),
          catchError((error) =>
            of(FriendshipActions.editFriendshipFailure({ error }))
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
          map(() =>
            FriendshipActions.deleteFriendshipSuccess({
              friendshipID: action.friendshipID,
            })
          ),
          catchError((error) =>
            of(FriendshipActions.deleteFriendshipFailure({ error }))
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