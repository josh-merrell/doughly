import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { IngredientStockService } from '../data/ingredient-stock.service';
import { IngredientStockActions } from './ingredient-stock-actions';
import { IngredientStock } from './ingredient-stock-state';


@Injectable()
export class IngredientStockEffects {
  constructor(
    private actions$: Actions,
    private ingredientStockService: IngredientStockService
  ) {}

  addIngredientStock$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(IngredientStockActions.addIngredientStock),
      mergeMap((action) =>
        this.ingredientStockService.add(action.ingredientStock).pipe(
          map((ingredientStock) =>
            IngredientStockActions.addIngredientStockSuccess({
              ingredientStock,
            })
          ),
          catchError((error) =>
            of(
              IngredientStockActions.addIngredientStockFailure({
                error: {
                  errorType: 'ADD_INGREDIENT_STOCK_FAILURE',
                  message: 'Failed to add ingredient stock',
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

  loadIngredientStocks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IngredientStockActions.loadIngredientStocks),
      mergeMap(() =>
        this.ingredientStockService.getAll().pipe(
          map((ingredientStocks) =>
            IngredientStockActions.loadIngredientStocksSuccess({
              ingredientStocks,
            })
          ),
          catchError((error) =>
            of(IngredientStockActions.loadIngredientStocksFailure({ error }))
          )
        )
      )
    )
  );

  loadIngredientStock$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IngredientStockActions.loadIngredientStock),
      mergeMap((action) =>
        this.ingredientStockService.getByID(action.ingredientStockID).pipe(
          map((ingredientStock) =>
            IngredientStockActions.loadIngredientStockSuccess({
              ingredientStock,
            })
          ),
          catchError((error) =>
            of(IngredientStockActions.loadIngredientStockFailure({ error }))
          )
        )
      )
    )
  );

  updateIngredientStock$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IngredientStockActions.updateIngredientStock),
      mergeMap((action) =>
        this.ingredientStockService.update(action.ingredientStock).pipe(
          map((ingredientStock) =>
            IngredientStockActions.updateIngredientStockSuccess({ ingredientStock })
          ),
          catchError((error) =>
            of(IngredientStockActions.updateIngredientStockFailure({
              error: {
                errorType: 'UPDATE_INGREDIENT_STOCK_FAILURE',
                message: 'Failed to update ingredient stock',
                statusCode: error.status,
                rawError: error,
              },
            }))
          )
        )
      )
    )
  );

  deleteIngredientStock$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IngredientStockActions.deleteIngredientStock),
      mergeMap((action) =>
        this.ingredientStockService.delete(action.ingredientStockID).pipe(
          map(() =>
            IngredientStockActions.deleteIngredientStockSuccess({ ingredientStockID: action.ingredientStockID })
          ),
          catchError((error) =>
            of(IngredientStockActions.deleteIngredientStockFailure({
              error: {
                errorType: 'DELETE_INGREDIENT_STOCK_FAILURE',
                message: 'Failed to delete ingredient stock',
                statusCode: error.status,
                rawError: error,
              },
            }))
          )
        )
      )
    )
  );
}