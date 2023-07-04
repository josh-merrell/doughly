import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { IngredientStockService } from '../data/ingredient-stock.service';
import { IngredientStockActions } from './ingredient-stock-actions';


@Injectable()
export class IngredientStockEffects {
  constructor(
    private actions$: Actions,
    private ingredientStockService: IngredientStockService
  ) { }

  addIngredientStock$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(IngredientStockActions.addIngredientStock),
      mergeMap((action) =>
        this.ingredientStockService.add(action.ingredientStock).pipe(
          map((ingredientStocks) =>
            IngredientStockActions.addIngredientStockSuccess({ ingredientStocks })
          ),
          catchError((error) =>
            of(IngredientStockActions.addIngredientStockFailure({ error }))
          )
        )
      )
    );
  });

  loadIngredientStocks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IngredientStockActions.loadIngredientStocks),
      mergeMap(() =>
        this.ingredientStockService.getAll().pipe(
          map((ingredientStocks) =>
            IngredientStockActions.loadIngredientStocksSuccess({ ingredientStocks })
          ),
          catchError((error) =>
            of(IngredientStockActions.loadIngredientStocksFailure({ error }))
          )
        )
      )
    )
  );
}