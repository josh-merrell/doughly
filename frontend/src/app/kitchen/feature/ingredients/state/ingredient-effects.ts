import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { IngredientService } from '../data/ingredient.service';
import { IngredientActions } from './ingredient-actions';
import { IngredientStockActions } from '../../Inventory/feature/ingredient-inventory/state/ingredient-stock-actions';

@Injectable()
export class IngredientEffects {
  constructor(
    private actions$: Actions,
    private ingredientService: IngredientService
  ) {}

  addIngredient$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(IngredientActions.addIngredient),
      mergeMap((action) =>
        this.ingredientService.add(action.ingredient).pipe(
          map((ingredient) =>
            IngredientActions.addIngredientSuccess({ ingredient })
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
        this.ingredientService.getAll().pipe(
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

  loadIngredient$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IngredientActions.loadIngredient),
      mergeMap((action) =>
        this.ingredientService.getByID(action.ingredientID).pipe(
          map((ingredient) =>
            IngredientActions.loadIngredientSuccess({ ingredient })
          ),
          catchError((error) =>
            of(IngredientActions.loadIngredientFailure({ error }))
          )
        )
      )
    )
  );

  deleteIngredient$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IngredientActions.deleteIngredient),
      mergeMap((action) =>
        this.ingredientService.delete(action.ingredientID).pipe(
          map(() =>
            IngredientActions.deleteIngredientSuccess({
              ingredientID: action.ingredientID,
            })
          ),
          catchError((error) =>
            of(IngredientActions.deleteIngredientFailure({ error }))
          )
        )
      )
    )
  );

  loadIngredientStockAfterDelete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IngredientActions.deleteIngredientSuccess),
      map(() => IngredientStockActions.loadIngredientStocks())
    )
  );
}
