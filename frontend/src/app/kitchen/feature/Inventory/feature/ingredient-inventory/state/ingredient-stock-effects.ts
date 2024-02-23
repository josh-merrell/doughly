import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { IngredientStockService } from '../data/ingredient-stock.service';
import { IngredientStockActions } from './ingredient-stock-actions';
import { IngredientStock } from './ingredient-stock-state';
import { ShoppingListActions } from 'src/app/groceries/state/shopping-list-actions';


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

  bulkAddIngredientStocks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IngredientStockActions.bulkAddIngredientStocks),
      // pass the provided ingredientStocks to the 'bulkAdd' service method. Subscribe to the result. If result.success is true, dispatch the bulkAddIngredientStocksSuccess action with the ingredientStocks. If result.success is false, dispatch the bulkAddIngredientStocksFailure action with the result.error.
      mergeMap((action) =>
        this.ingredientStockService.bulkAdd(action.ingredientStocks).pipe(
          map((ingredientStocks) =>
            IngredientStockActions.bulkAddIngredientStocksSuccess({
              ingredientStocks,
              shoppingListID: action.shoppingListID,
            })
          ),
          catchError((error) =>
            of(
              IngredientStockActions.bulkAddIngredientStocksFailure({
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
            of(
              IngredientStockActions.loadIngredientStocksFailure({
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
            of(
              IngredientStockActions.loadIngredientStockFailure({
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

  updateIngredientStock$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IngredientStockActions.updateIngredientStock),
      mergeMap((action) =>
        this.ingredientStockService.update(action.ingredientStock).pipe(
          map((ingredientStock) =>
            IngredientStockActions.updateIngredientStockSuccess({
              ingredientStock,
            })
          ),
          catchError((error) =>
            of(
              IngredientStockActions.updateIngredientStockFailure({
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

  deleteIngredientStock$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IngredientStockActions.deleteIngredientStock),
      mergeMap((action) =>
        this.ingredientStockService.delete(action.ingredientStockID).pipe(
          map(() =>
            IngredientStockActions.deleteIngredientStockSuccess({
              ingredientStockID: action.ingredientStockID,
            })
          ),
          catchError((error) =>
            of(
              IngredientStockActions.deleteIngredientStockFailure({
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