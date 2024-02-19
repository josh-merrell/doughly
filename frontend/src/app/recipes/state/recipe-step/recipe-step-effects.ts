import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeAll, mergeMap, switchMap, take, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { RecipeStepActions } from './recipe-step-actions';
import { RecipeActions } from '../recipe/recipe-actions';
import { RecipeStep } from './recipe-step-state';
import { RecipeStepService } from '../../data/recipe-step.service';
import { RecipeService } from '../../data/recipe.service';
import { Recipe } from '../recipe/recipe-state';
import { Store, select } from '@ngrx/store';
import { selectRecipeStepByID, selectRecipeStepsByID } from './recipe-step-selectors';

@Injectable()
export class RecipeStepEffects {
  constructor(
    private actions$: Actions,
    private recipeStepService: RecipeStepService,
    private recipeService: RecipeService,
    private store: Store
  ) {}

  addRecipeStep$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(RecipeStepActions.addRecipeStep),
      mergeMap((action) =>
        this.recipeStepService.add(action.recipeStep).pipe(
          switchMap((recipeStep: RecipeStep) =>
            this.recipeService.getByID(recipeStep.recipeID).pipe(
              map((response: Recipe[]) => {
                const recipe = response[0];
                return [
                  RecipeStepActions.addRecipeStepSuccess({ recipeStep }),
                  RecipeActions.updateRecipeStatus({
                    recipeID: recipe.recipeID,
                    status: recipe.status,
                  }),
                ];
              }),
              mergeAll()
            )
          ),
          catchError((error) =>
            of(
              RecipeStepActions.addRecipeStepFailure({
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

  loadRecipeSteps$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeStepActions.loadRecipeSteps),
      mergeMap(() =>
        this.recipeStepService.getAll().pipe(
          map((recipeSteps: RecipeStep[]) =>
            RecipeStepActions.loadRecipeStepsSuccess({ recipeSteps })
          ),
          catchError((error) =>
            of(
              RecipeStepActions.loadRecipeStepsFailure({
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

  loadRecipeStep$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeStepActions.loadRecipeStep),
      mergeMap((action) =>
        this.recipeStepService.getByID(action.recipeStepID).pipe(
          map((recipeStep: RecipeStep) =>
            RecipeStepActions.loadRecipeStepSuccess({ recipeStep })
          ),
          catchError((error) =>
            of(
              RecipeStepActions.loadRecipeStepFailure({
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

  updateRecipeStep$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeStepActions.updateRecipeStep),
      mergeMap((action) =>
        this.recipeStepService.update(action.recipeStep).pipe(
          map((recipeStep: RecipeStep) =>
            RecipeStepActions.updateRecipeStepSuccess({ recipeStep })
          ),
          catchError((error) =>
            of(
              RecipeStepActions.updateRecipeStepFailure({
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

  // on success of update, call loadRecipeSteps$
  updateRecipeStepSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeStepActions.updateRecipeStepSuccess),
      map(() => RecipeStepActions.loadRecipeSteps())
    )
  );
    

  deleteRecipeStep$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeStepActions.deleteRecipeStep),
      switchMap((action) =>
        this.store.pipe(
          select(selectRecipeStepByID(action.recipeStepID)),
          take(1),
          mergeMap((deletedRecipeStep) =>
            this.recipeStepService.delete(action.recipeStepID).pipe(
              switchMap(() =>
                this.store.pipe(
                  select(selectRecipeStepsByID(deletedRecipeStep!.recipeID)),
                  take(1),
                  tap((remainingSteps) => {
                    // Sort the remaining steps by sequence.
                    const sortedSteps = [...remainingSteps].sort(
                      (a, b) => a.sequence - b.sequence
                    );

                    // Dispatch an action to update the sequence for each displaced step.
                    sortedSteps.forEach((step) => {
                      if (step.sequence > deletedRecipeStep!.sequence) {
                        this.store.dispatch(
                          RecipeStepActions.updateRecipeStepSequence({
                            recipeStep: step,
                            newSequence: step.sequence - 1,
                          })
                        );
                      }
                    });
                  }),
                  switchMap(() =>
                    this.recipeService
                      .getByID(deletedRecipeStep!.recipeID)
                      .pipe(
                        mergeMap((response: Recipe[]) => {
                          const recipe = response[0];
                          return [
                            RecipeStepActions.deleteRecipeStepSuccess({
                              recipeStepID: action.recipeStepID,
                            }),
                            RecipeActions.updateRecipeStatus({
                              recipeID: recipe.recipeID,
                              status: recipe.status,
                            }),
                          ];
                        })
                      )
                  )
                )
              ),
              catchError((error) =>
                of(
                  RecipeStepActions.deleteRecipeStepFailure({
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
      )
    )
  );
}
