import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { RecipeIngredientService } from '../../data/recipe-ingredients.service';
import { RecipeIngredientActions } from './recipe-ingredient-actions';
import { RecipeIngredient } from './recipe-ingredient-state';

@Injectable()
export class RecipeIngredientEffects {
  constructor(
    private actions$: Actions,
    private recipeIngredientService: RecipeIngredientService
  ) {}

  addRecipeIngredient$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(RecipeIngredientActions.addRecipeIngredient),
      mergeMap((action) =>
        this.recipeIngredientService.add(action.recipeIngredient).pipe(
          map((recipeIngredient: RecipeIngredient) =>
            RecipeIngredientActions.addRecipeIngredientSuccess({
              recipeIngredient,
            })
          ),
          catchError((error) =>
            of(
              RecipeIngredientActions.addRecipeIngredientFailure({
                error: {
                  errorType: 'ADD_RECIPE_INGREDIENT_FAILURE',
                  message: 'Failed to add recipe ingredient',
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
                  errorType: 'LOAD_RECIPE_INGREDIENTS_FAILURE',
                  message: 'Failed to load recipe ingredients',
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
                  errorType: 'LOAD_RECIPE_INGREDIENT_FAILURE',
                  message: 'Failed to load recipe ingredient',
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
      mergeMap((action) =>
        this.recipeIngredientService.delete(action.recipeIngredientID).pipe(
          map(() =>
            RecipeIngredientActions.deleteRecipeIngredientSuccess({
              recipeIngredientID: action.recipeIngredientID,
            })
          ),
          catchError((error) =>
            of(
              RecipeIngredientActions.deleteRecipeIngredientFailure({
                error: {
                  errorType: 'DELETE_RECIPE_INGREDIENT_FAILURE',
                  message: 'Failed to delete recipe ingredient',
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
                  errorType: 'UPDATE_RECIPE_INGREDIENT_FAILURE',
                  message: 'Failed to update recipe ingredient',
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
