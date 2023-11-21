import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { SocialService } from '../data/social.service';
import { FollowshipActions } from './followship-actions';

@Injectable()
export class FollowshipEffects {
  constructor(private actions$: Actions, private socialService: SocialService) {}

  addFollowship$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(FollowshipActions.addFollowship),
      mergeMap((action) =>
        this.socialService.addFollowship(action.followship).pipe(
          map((followship) =>
            FollowshipActions.addFollowshipSuccess({ followship })
          ),
          catchError((error) =>
            of(
              FollowshipActions.addFollowshipFailure({
                error: {
                  errorType: 'ADD_FOLLOWSHIP_FAILURE',
                  message: 'Failed to add followship',
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

  loadFollowships$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FollowshipActions.loadFollowships),
      mergeMap(() =>
        this.socialService.getAllFollowships().pipe(
          map((followships) =>
            FollowshipActions.loadFollowshipsSuccess({ followships })
          ),
          catchError((error) =>
            of(FollowshipActions.loadFollowshipsFailure({ error }))
          )
        )
      )
    )
  );

  loadFollowship$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FollowshipActions.loadFollowship),
      mergeMap((action) =>
        this.socialService.getFollowshipByID(action.followshipID).pipe(
          map((followship) =>
            FollowshipActions.loadFollowshipSuccess({ followship })
          ),
          catchError((error) =>
            of(FollowshipActions.loadFollowshipFailure({ error }))
          )
        )
      )
    )
  );

  loadFollowers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FollowshipActions.loadFollowers),
      mergeMap(() =>
        this.socialService.getAllFollowers().pipe(
          map((followers) =>
            FollowshipActions.loadFollowersSuccess({ followers })
          ),
          catchError((error) =>
            of(FollowshipActions.loadFollowersFailure({ error }))
          )
        )
      )
    )
  );

  deleteFollowship$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FollowshipActions.deleteFollowship),
      mergeMap((action) =>
        this.socialService.deleteFollowship(action.followshipID).pipe(
          map(() =>
            FollowshipActions.deleteFollowshipSuccess({
              followshipID: action.followshipID,
            })
          ),
          catchError((error) =>
            of(FollowshipActions.deleteFollowshipFailure({ error }))
          )
        )
      )
    )
  );

  loadFollowshipsAfterDelete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FollowshipActions.deleteFollowshipSuccess),
      mergeMap(() => of(FollowshipActions.loadFollowships()))
    )
  );
}
