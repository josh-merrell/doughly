import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { RecipeCategoryService } from '../../data/recipe-category.service';
import { RecipeCategoryActions } from './recipe-category-actions';

@Injectable()
export class RecipeCategoryEffects {
  constructor(
    private actions$: Actions,
    private recipeCategoryService: RecipeCategoryService
  ) {}

  addRecipeCategory$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(RecipeCategoryActions.addRecipeCategory),
      mergeMap((action) =>
        this.recipeCategoryService.add(action.recipeCategory).pipe(
          map((recipeCategory) =>
            RecipeCategoryActions.addRecipeCategorySuccess({
              recipeCategory,
            })
          ),
          catchError((error) =>
            of(
              RecipeCategoryActions.addRecipeCategoryFailure({
                error: {
                  errorType: 'ADD_RECIPE_CATEGORY_FAILURE',
                  message: 'Failed to add recipe category',
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

  loadRecipeCategories$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeCategoryActions.loadRecipeCategories),
      mergeMap(() =>
        this.recipeCategoryService.getAll().pipe(
          map((recipeCategories) =>
            RecipeCategoryActions.loadRecipeCategoriesSuccess({
              recipeCategories,
            })
          ),
          catchError((error) =>
            of(
              RecipeCategoryActions.loadRecipeCategoriesFailure({
                error: {
                  errorType: 'LOAD_RECIPE_CATEGORIES_FAILURE',
                  message: 'Failed to load recipe categories',
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

  loadRecipeCategory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeCategoryActions.loadRecipeCategory),
      mergeMap((action) =>
        this.recipeCategoryService.getByID(action.recipeCategoryID).pipe(
          map((recipeCategory) =>
            RecipeCategoryActions.loadRecipeCategorySuccess({ recipeCategory })
          ),
          catchError((error) =>
            of(
              RecipeCategoryActions.loadRecipeCategoryFailure({
                error: {
                  errorType: 'LOAD_RECIPE_CATEGORY_FAILURE',
                  message: 'Failed to load recipe category',
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

  updateRecipeCategory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeCategoryActions.updateRecipeCategory),
      mergeMap((action) =>
        this.recipeCategoryService.update(action.recipeCategory).pipe(
          map((recipeCategory) =>
            RecipeCategoryActions.updateRecipeCategorySuccess({
              recipeCategory,
            })
          ),
          catchError((error) =>
            of(
              RecipeCategoryActions.updateRecipeCategoryFailure({
                error: {
                  errorType: 'UPDATE_RECIPE_CATEGORY_FAILURE',
                  message: 'Failed to update recipe category',
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

  deleteRecipeCategory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipeCategoryActions.deleteRecipeCategory),
      mergeMap((action) =>
        this.recipeCategoryService.delete(action.recipeCategoryID).pipe(
          map(() =>
            RecipeCategoryActions.deleteRecipeCategorySuccess({
              recipeCategoryID: action.recipeCategoryID,
            })
          ),
          catchError((error) =>
            of(
              RecipeCategoryActions.deleteRecipeCategoryFailure({
                error: {
                  errorType: 'DELETE_RECIPE_CATEGORY_FAILURE',
                  message: 'Failed to delete recipe category',
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
