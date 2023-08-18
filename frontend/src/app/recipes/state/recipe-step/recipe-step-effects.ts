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
                  errorType: 'ADD_RECIPE_STEP_FAILURE',
                  message: 'Failed to add Recipe Step',
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
                  errorType: 'LOAD_RECIPE_STEPS_FAILURE',
                  message: 'Failed to load Recipe Steps',
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
                  errorType: 'LOAD_RECIPE_STEP_FAILURE',
                  message: 'Failed to load Recipe Step',
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
                  errorType: 'UPDATE_RECIPE_STEP_FAILURE',
                  message: 'Failed to update Recipe Step',
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

  // deleteRecipeStep$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(RecipeStepActions.deleteRecipeStep),
  //     switchMap((action) =>
  //       this.store.pipe(
  //         select((state) => selectRecipeStepByID(action.recipeStepID)(state)),
  //         take(1),
  //         mergeMap((recipeStep) =>
  //           this.recipeStepService.delete(action.recipeStepID).pipe(
  //             switchMap(() =>
  //               this.recipeService.getByID(recipeStep!.recipeID).pipe(
  //                 mergeMap((response: Recipe[]) => {
  //                   const recipe = response[0]; // Access the first element of the response array
  //                   return [
  //                     RecipeStepActions.deleteRecipeStepSuccess({
  //                       recipeStepID: action.recipeStepID,
  //                     }),
  //                     RecipeActions.updateRecipeStatus({
  //                       recipeID: recipe.recipeID,
  //                       status: recipe.status,
  //                     }),
  //                   ];
  //                 })
  //               )
  //             ),
  //             catchError((error) =>
  //               of(
  //                 RecipeStepActions.deleteRecipeStepFailure({
  //                   error: {
  //                     errorType: 'DELETE_RECIPE_STEP_FAILURE',
  //                     message: 'Failed to delete Recipe Step',
  //                     statusCode: error.status,
  //                     rawError: error,
  //                   },
  //                 })
  //               )
  //             )
  //           )
  //         )
  //       )
  //     )
  //   )
  // );

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
                      errorType: 'DELETE_RECIPE_STEP_FAILURE',
                      message: 'Failed to delete Recipe Step',
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
