import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { IngredientsService } from '../data/ingredients.service';
import { IngredientActions } from './ingredient-actions';

@Injectable()
export class IngredientEffects {
  constructor(
    private actions$: Actions,
    private ingredientsService: IngredientsService
  ) {}

  addIngredient$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(IngredientActions.addIngredient),
      mergeMap((action) =>
        this.ingredientsService.add(action.ingredient).pipe(
          map((ingredients) =>
            IngredientActions.addIngredientSuccess({ ingredients })
          ),
          catchError((error) =>
            of(IngredientActions.addIngredientFailure({ error }))
          )
        )
      )
    );
  });

  loadIngredients$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IngredientActions.loadIngredients),
      mergeMap(() =>
        this.ingredientsService.getAll().pipe(
          map((ingredients) =>
            IngredientActions.loadIngredientsSuccess({ ingredients })
          ),
          catchError((error) => 
            of(IngredientActions.loadIngredientsFailure({ error }))
          )
        )
      )
    )
  );
}
