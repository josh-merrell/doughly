import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { RecipeService } from '../../data/recipe.service';
import { RecipeActions } from './recipe-actions';

@Injectable()
export class RecipeEffects {
  constructor(
    private actions$: Actions,
    private recipeService: RecipeService
  ) {}

  addRecipe$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(RecipeActions.addRecipe),
      mergeMap((action) =>
        this.recipeService.add(action.recipe).pipe(
          map((recipe) =>
            RecipeActions.addRecipeSuccess({
              recipe,
            })
          ),
          catchError((error) =>
            of(
              RecipeActions.addRecipeFailure({
                error: {
                  errorType: 'ADD_RECIPE_FAILURE',
                  message: 'Failed to add recipe',
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

  loadRecipes$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeActions.loadRecipes),
      mergeMap(() =>
        this.recipeService.getAll().pipe(
          map((recipes) =>
            RecipeActions.loadRecipesSuccess({
              recipes,
            })
          ),
          catchError((error) =>
            of(
              RecipeActions.loadRecipesFailure({
                error: {
                  errorType: 'LOAD_RECIPES_FAILURE',
                  message: 'Failed to load recipes',
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

  loadRecipe$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeActions.loadRecipe),
      mergeMap((action) =>
        this.recipeService.getByID(action.recipeID).pipe(
          map((recipe) =>
            RecipeActions.loadRecipeSuccess({
              recipe,
            })
          ),
          catchError((error) =>
            of(
              RecipeActions.loadRecipeFailure({
                error: {
                  errorType: 'LOAD_RECIPE_FAILURE',
                  message: 'Failed to load recipe',
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

  loadRecipeSubsriptions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeActions.loadRecipeSubscriptions),
      mergeMap((action) =>
        this.recipeService.getSubscriptions().pipe(
          map((recipeSubscriptions) =>
            RecipeActions.loadRecipeSubscriptionsSuccess({
              recipeSubscriptions,
            })
          ),
          catchError((error) =>
            of(
              RecipeActions.loadRecipeSubscriptionsFailure({
                error: {
                  errorType: 'LOAD_RECIPE_SUBSCRIPTIONS_FAILURE',
                  message: 'Failed to load recipe subscriptions',
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

  deleteRecipeSubscription$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeActions.deleteRecipeSubscription),
      mergeMap((action) =>
        this.recipeService.deleteSubscription(action.subscriptionID).pipe(
          map(() =>
            RecipeActions.deleteRecipeSubscriptionSuccess({
              subscriptionID: action.subscriptionID,
            }),
            RecipeActions.loadRecipeSubscriptions()
          ),
          catchError((error) =>
            of(
              RecipeActions.deleteRecipeSubscriptionFailure({
                error: {
                  errorType: 'DELETE_RECIPE_SUBSCRIPTION_FAILURE',
                  message: 'Failed to delete recipe subscription',
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

  deleteRecipe$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeActions.deleteRecipe),
      mergeMap((action) =>
        this.recipeService.delete(action.recipeID).pipe(
          map(() =>
            RecipeActions.deleteRecipeSuccess({
              recipeID: action.recipeID,
            }),
            RecipeActions.loadRecipes()
          ),
          catchError((error) =>
            of(
              RecipeActions.deleteRecipeFailure({
                error: {
                  errorType: 'DELETE_RECIPE_FAILURE',
                  message: 'Failed to delete recipe',
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

  updateRecipe$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeActions.updateRecipe),
      mergeMap((action) =>
        this.recipeService.update(action.recipe).pipe(
          map((recipe) =>
            RecipeActions.updateRecipeSuccess({
              recipe,
            }),
            RecipeActions.loadRecipes()
          ),
          catchError((error) =>
            of(
              RecipeActions.updateRecipeFailure({
                error: {
                  errorType: 'UPDATE_RECIPE_FAILURE',
                  message: 'Failed to update recipe',
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
