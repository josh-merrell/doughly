import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {
  catchError,
  map,
  mergeAll,
  mergeMap,
  switchMap,
  take,
} from 'rxjs/operators';
import { of } from 'rxjs';
import { RecipeIngredientService } from '../../data/recipe-ingredients.service';
import { RecipeIngredientActions } from './recipe-ingredient-actions';
import { RecipeIngredient } from './recipe-ingredient-state';
import { RecipeActions } from '../recipe/recipe-actions';
import { Recipe } from '../recipe/recipe-state';
import { RecipeService } from '../../data/recipe.service';
import { Store, select } from '@ngrx/store';
import { selectRecipeIngredientByID } from './recipe-ingredient-selectors';

@Injectable()
export class RecipeIngredientEffects {
  RecipeActions: any;
  constructor(
    private actions$: Actions,
    private recipeIngredientService: RecipeIngredientService,
    private recipeService: RecipeService,
    private store: Store
  ) {}

  addRecipeIngredient$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(RecipeIngredientActions.addRecipeIngredient),
      mergeMap((action) =>
        this.recipeIngredientService.add(action.recipeIngredient).pipe(
          switchMap((recipeIngredient: RecipeIngredient) =>
            this.recipeService.getByID(recipeIngredient.recipeID).pipe(
              map((response: Recipe[]) => {
                const recipe = response[0];
                return [
                  RecipeIngredientActions.addRecipeIngredientSuccess({
                    recipeIngredient,
                  }),
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
              RecipeIngredientActions.addRecipeIngredientFailure({
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

  loadRecipeIngredients$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeIngredientActions.loadRecipeIngredients),
      mergeMap(() =>
        this.recipeIngredientService.getAll().pipe(
          map((recipeIngredients: RecipeIngredient[]) =>
            RecipeIngredientActions.loadRecipeIngredientsSuccess({
              recipeIngredients,
            })
          ),
          catchError((error) =>
            of(
              RecipeIngredientActions.loadRecipeIngredientsFailure({
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

  loadRecipeIngredient$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeIngredientActions.loadRecipeIngredient),
      mergeMap((action) =>
        this.recipeIngredientService.getByID(action.recipeIngredientID).pipe(
          map((recipeIngredient: RecipeIngredient) =>
            RecipeIngredientActions.loadRecipeIngredientSuccess({
              recipeIngredient,
            })
          ),
          catchError((error) =>
            of(
              RecipeIngredientActions.loadRecipeIngredientFailure({
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

  deleteRecipeIngredient$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeIngredientActions.deleteRecipeIngredient),
      switchMap((action) =>
        this.store.pipe(
          select((state) =>
            selectRecipeIngredientByID(action.recipeIngredientID)(state)
          ),
          take(1),
          mergeMap((recipeIngredient) =>
            this.recipeIngredientService.delete(action.recipeIngredientID).pipe(
              switchMap(() =>
                this.recipeService.getByID(recipeIngredient!.recipeID).pipe(
                  mergeMap((response: Recipe[]) => {
                    const recipe = response[0]; // Access the first element of the response array
                    return [
                      RecipeIngredientActions.deleteRecipeIngredientSuccess({
                        recipeIngredientID: action.recipeIngredientID,
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
                  RecipeIngredientActions.deleteRecipeIngredientFailure({
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

  loadRecipeAfterDelete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeIngredientActions.deleteRecipeIngredientSuccess),
      map(() => RecipeActions.loadRecipes())
    )
  );

  updateRecipeIngredient$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeIngredientActions.updateRecipeIngredient),
      mergeMap((action) =>
        this.recipeIngredientService.update(action.recipeIngredient).pipe(
          map((recipeIngredient: RecipeIngredient) =>
            RecipeIngredientActions.updateRecipeIngredientSuccess({
              recipeIngredient,
            })
          ),
          catchError((error) =>
            of(
              RecipeIngredientActions.updateRecipeIngredientFailure({
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
}
