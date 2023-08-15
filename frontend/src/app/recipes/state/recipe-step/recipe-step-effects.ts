import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { RecipeStepActions } from './recipe-step-actions';
import { RecipeStep } from './recipe-step-state';
import { RecipeStepService } from '../../data/recipe-step.service';

@Injectable()
export class RecipeStepEffects {
  constructor(private actions$: Actions, private recipeStepService: RecipeStepService) {}

  addRecipeStep$ = createEffect(() => this.actions$.pipe(
    ofType(RecipeStepActions.addRecipeStep),
    mergeMap((action) => 
      this.recipeStepService.add(action.recipeStep).pipe(
        map((recipeStep: RecipeStep) => RecipeStepActions.addRecipeStepSuccess({ recipeStep })),
        catchError((error) => of(RecipeStepActions.addRecipeStepFailure({
          error: {
            errorType: 'ADD_RECIPE_STEP_FAILURE',
            message: 'Failed to add Recipe Step',
            statusCode: error.status,
            rawError: error,
          }
        })))
      )
    )
  ));

  loadRecipeSteps$ = createEffect(() => this.actions$.pipe(
    ofType(RecipeStepActions.loadRecipeSteps),
    mergeMap(() =>
      this.recipeStepService.getAll().pipe(
        map((recipeSteps: RecipeStep[]) => RecipeStepActions.loadRecipeStepsSuccess({ recipeSteps })),
        catchError((error) => of(RecipeStepActions.loadRecipeStepsFailure({
          error: {
            errorType: 'LOAD_RECIPE_STEPS_FAILURE',
            message: 'Failed to load Recipe Steps',
            statusCode: error.status,
            rawError: error,
          }
        })))
      )
    )
  ));

  loadRecipeStep$ = createEffect(() => this.actions$.pipe(
    ofType(RecipeStepActions.loadRecipeStep),
    mergeMap((action) =>
      this.recipeStepService.getByID(action.recipeStepID).pipe(
        map((recipeStep: RecipeStep) => RecipeStepActions.loadRecipeStepSuccess({ recipeStep })),
        catchError((error) => of(RecipeStepActions.loadRecipeStepFailure({
          error: {
            errorType: 'LOAD_RECIPE_STEP_FAILURE',
            message: 'Failed to load Recipe Step',
            statusCode: error.status,
            rawError: error,
          }
        })))
      )
    )
  ));

  updateRecipeStep$ = createEffect(() => this.actions$.pipe(
    ofType(RecipeStepActions.updateRecipeStep),
    mergeMap((action) =>
      this.recipeStepService.update(action.recipeStep).pipe(
        map((recipeStep: RecipeStep) => RecipeStepActions.updateRecipeStepSuccess({ recipeStep })),
        catchError((error) => of(RecipeStepActions.updateRecipeStepFailure({
          error: {
            errorType: 'UPDATE_RECIPE_STEP_FAILURE',
            message: 'Failed to update Recipe Step',
            statusCode: error.status,
            rawError: error,
          }
        })))
      )
    )
  ));

  deleteRecipeStep$ = createEffect(() => this.actions$.pipe( 
    ofType(RecipeStepActions.deleteRecipeStep),
    mergeMap((action) =>
      this.recipeStepService.delete(action.recipeStepID).pipe(
        map(() => RecipeStepActions.deleteRecipeStepSuccess({ recipeStepID: action.recipeStepID })),
        catchError((error) => of(RecipeStepActions.deleteRecipeStepFailure({
          error: {
            errorType: 'DELETE_RECIPE_STEP_FAILURE',
            message: 'Failed to delete Recipe Step',
            statusCode: error.status,
            rawError: error,
          }
        })))
      )
    )
  ));
}