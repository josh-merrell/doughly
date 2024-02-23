import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {
  catchError,
  map,
  mergeMap,
  switchMap,
  take,
} from 'rxjs/operators';
import { of } from 'rxjs';
import { RecipeToolService } from '../../data/recipe-tool.service';
import { RecipeToolActions } from './recipe-tool-actions';
import { RecipeTool } from './recipe-tool-state';
import { RecipeService } from '../../data/recipe.service';
import { Recipe } from '../recipe/recipe-state';
import { RecipeActions } from '../recipe/recipe-actions';
import { Store, select } from '@ngrx/store';
import { selectRecipeToolByID } from './recipe-tool-selectors';

@Injectable()
export class RecipeToolEffects {
  constructor(
    private actions$: Actions,
    private recipeToolService: RecipeToolService,
    private recipeService: RecipeService,
    private store: Store
  ) {}

  addRecipeTool$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(RecipeToolActions.addRecipeTool),
      mergeMap((action) =>
        this.recipeToolService.add(action.recipeTool).pipe(
          switchMap((recipeTool: RecipeTool) =>
            this.recipeService.getByID(recipeTool.recipeID).pipe(
              mergeMap((response: Recipe[]) => {
                const recipe = response[0]; // Access the first element of the response array
                return [
                  RecipeToolActions.addRecipeToolSuccess({
                    recipeTool,
                  }),
                  RecipeActions.updateRecipeStatus({
                    recipeID: recipe.recipeID,
                    status: recipe.status,
                  }),
                ];
              })
            )
          ),
          catchError((error) =>
            of(
              RecipeToolActions.addRecipeToolFailure({
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

  deleteRecipeTool$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeToolActions.deleteRecipeTool),
      switchMap((action) =>
        this.store.pipe(
          select((state) => selectRecipeToolByID(action.recipeToolID)(state)),
          take(1),
          mergeMap((recipeTool) =>
            this.recipeToolService.delete(action.recipeToolID).pipe(
              switchMap(() =>
                this.recipeService.getByID(recipeTool!.recipeID).pipe(
                  mergeMap((response: Recipe[]) => {
                    const recipe = response[0]; // Access the first element of the response array
                    return [
                      RecipeToolActions.deleteRecipeToolSuccess({
                        recipeToolID: action.recipeToolID,
                      }),
                      RecipeActions.updateRecipeStatus({
                        recipeID: recipe.recipeID,
                        status: recipe.status,
                      }),
                    ];
                  })
                )
              ),
              catchError((error) =>
                of(
                  RecipeToolActions.deleteRecipeToolFailure({
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
