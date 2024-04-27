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
