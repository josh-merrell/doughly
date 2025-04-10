import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { StepActions } from './step-actions';
import { Step } from './step-state';
import { StepService } from '../../data/step.service';

@Injectable()
export class StepEffects {
  constructor(private actions$: Actions, private stepService: StepService) {}

  addStep$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(StepActions.addStep),
      mergeMap((action) =>
        this.stepService.add(action.step).pipe(
          map((step: Step) => StepActions.addStepSuccess({ step })),
          catchError((error) =>
            of(
              StepActions.addStepFailure({
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

  loadSteps$ = createEffect(() =>
    this.actions$.pipe(
      ofType(StepActions.loadSteps),
      mergeMap(() =>
        this.stepService.getAll().pipe(
          map((steps: Step[]) => StepActions.loadStepsSuccess({ steps })),
          catchError((error) =>
            of(
              StepActions.loadStepsFailure({
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

  loadStep$ = createEffect(() =>
    this.actions$.pipe(
      ofType(StepActions.loadStep),
      mergeMap((action) =>
        this.stepService.getByID(action.stepID).pipe(
          map((step: Step) => StepActions.loadStepSuccess({ step })),
          catchError((error) =>
            of(
              StepActions.loadStepFailure({
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

  updateStep$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(StepActions.updateStep),
      mergeMap((action) =>
        this.stepService.update(action.step).pipe(
          map((step: Step) => StepActions.updateStepSuccess({ step })),
          catchError((error) =>
            of(
              StepActions.updateStepFailure({
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

  deleteStep$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(StepActions.deleteStep),
      mergeMap((action) =>
        this.stepService.delete(action.stepID).pipe(
          map(() => StepActions.deleteStepSuccess({ stepID: action.stepID })),
          catchError((error) =>
            of(
              StepActions.deleteStepFailure({
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
}