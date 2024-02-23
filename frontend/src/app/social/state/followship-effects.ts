import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, concatMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { SocialService } from '../data/social.service';
import { FollowshipActions } from './followship-actions';
import { ProfileActions } from 'src/app/profile/state/profile-actions';

@Injectable()
export class FollowshipEffects {
  constructor(
    private actions$: Actions,
    private socialService: SocialService
  ) {}

  addFollowship$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(FollowshipActions.addFollowship),
      mergeMap((action) =>
        this.socialService.addFollowship(action.following).pipe(
          map((followship) =>
            FollowshipActions.addFollowshipSuccess({ followship })
          ),
          catchError((error) =>
            of(
              FollowshipActions.addFollowshipFailure({
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

  loadFollowships$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FollowshipActions.loadFollowships),
      mergeMap(() =>
        this.socialService.getAllFollowships().pipe(
          map((followships) =>
            FollowshipActions.loadFollowshipsSuccess({ followships })
          ),
          catchError((error) =>
            of(
              FollowshipActions.loadFollowshipsFailure({
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

  loadFollowship$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FollowshipActions.loadFollowship),
      mergeMap((action) =>
        this.socialService.getFollowshipByID(action.followshipID).pipe(
          map((followship) =>
            FollowshipActions.loadFollowshipSuccess({ followship })
          ),
          catchError((error) =>
            of(
              FollowshipActions.loadFollowshipFailure({
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
      ofType(FollowshipActions.loadFollowers),
      mergeMap(() =>
        this.socialService.getAllFollowers().pipe(
          map((followers) =>
            FollowshipActions.loadFollowersSuccess({ followers })
          ),
          catchError((error) =>
            of(
              FollowshipActions.loadFollowersFailure({
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

  deleteFollowship$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FollowshipActions.deleteFollowship),
      mergeMap((action) =>
        this.socialService.deleteFollowship(action.followshipID).pipe(
          concatMap(() => [
            FollowshipActions.deleteFollowshipSuccess({
              followshipID: action.followshipID,
            }),
            ProfileActions.loadFollowers(),
            ProfileActions.loadFollowing(),
          ]),
          catchError((error) =>
            of(
              FollowshipActions.deleteFollowshipFailure({
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

  loadFollowshipsAfterDelete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FollowshipActions.deleteFollowshipSuccess),
      mergeMap(() => of(FollowshipActions.loadFollowships()))
    )
  );
}
