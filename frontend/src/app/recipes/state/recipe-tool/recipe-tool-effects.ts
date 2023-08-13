import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { RecipeToolService } from '../../data/recipe-tool.service';
import { RecipeToolActions } from './recipe-tool-actions';
import { RecipeTool } from './recipe-tool-state';

@Injectable()
export class RecipeToolEffects {
  constructor(
    private actions$: Actions,
    private recipeToolService: RecipeToolService
  ) {}

  addRecipeTool$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(RecipeToolActions.addRecipeTool),
      mergeMap((action) =>
        this.recipeToolService.add(action.recipeTool).pipe(
          map((recipeTool: RecipeTool) =>
            RecipeToolActions.addRecipeToolSuccess({
              recipeTool,
            })
          ),
          catchError((error) =>
            of(
              RecipeToolActions.addRecipeToolFailure({
                error: {
                  errorType: 'ADD_RECIPE_TOOL_FAILURE',
                  message: 'Failed to add recipe tool',
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

  loadRecipeTools$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeToolActions.loadRecipeTools),
      mergeMap(() =>
        this.recipeToolService.getAll().pipe(
          map((recipeTools: RecipeTool[]) =>
            RecipeToolActions.loadRecipeToolsSuccess({
              recipeTools,
            })
          ),
          catchError((error) =>
            of(
              RecipeToolActions.loadRecipeToolsFailure({
                error: {
                  errorType: 'LOAD_RECIPE_TOOLS_FAILURE',
                  message: 'Failed to load recipe tools',
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

  loadRecipeTool$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeToolActions.loadRecipeTool),
      mergeMap((action) =>
        this.recipeToolService.getByID(action.recipeToolID).pipe(
          map((recipeTool: RecipeTool) =>
            RecipeToolActions.loadRecipeToolSuccess({
              recipeTool,
            })
          ),
          catchError((error) =>
            of(
              RecipeToolActions.loadRecipeToolFailure({
                error: {
                  errorType: 'LOAD_RECIPE_TOOL_FAILURE',
                  message: 'Failed to load recipe tool',
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

  updateRecipeTool$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeToolActions.updateRecipeTool),
      mergeMap((action) =>
        this.recipeToolService.update(action.recipeTool).pipe(
          map((recipeTool: RecipeTool) =>
            RecipeToolActions.updateRecipeToolSuccess({
              recipeTool,
            })
          ),
          catchError((error) =>
            of(
              RecipeToolActions.updateRecipeToolFailure({
                error: {
                  errorType: 'UPDATE_RECIPE_TOOL_FAILURE',
                  message: 'Failed to update recipe tool',
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

  deleteRecipeTool$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeToolActions.deleteRecipeTool),
      mergeMap((action) =>
        this.recipeToolService.delete(action.recipeToolID).pipe(
          map(() =>
            RecipeToolActions.deleteRecipeToolSuccess({
              recipeToolID: action.recipeToolID,
            })
          ),
          catchError((error) =>
            of(
              RecipeToolActions.deleteRecipeToolFailure({
                error: {
                  errorType: 'DELETE_RECIPE_TOOL_FAILURE',
                  message: 'Failed to delete recipe tool',
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
}

