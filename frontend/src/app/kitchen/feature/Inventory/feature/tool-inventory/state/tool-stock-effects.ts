import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ToolStockService } from '../data/tool-stock.service';
import { ToolStockActions } from './tool-stock-actions';
import { ToolStock } from './tool-stock-state';

@Injectable()
export class ToolStockEffects {
  constructor(
    private actions$: Actions,
    private toolStockService: ToolStockService
  ) {}

  addToolStock$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ToolStockActions.addToolStock),
      mergeMap((action) =>
        this.toolStockService.add(action.toolStock).pipe(
          map((toolStock) =>
            ToolStockActions.addToolStockSuccess({
              toolStock,
            })
          ),
          catchError((error) =>
            of(
              ToolStockActions.addToolStockFailure({
                error: {
                  errorType: 'ADD_INGREDIENT_STOCK_FAILURE',
                  message: 'Failed to add tool stock',
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

  loadToolStocks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ToolStockActions.loadToolStocks),
      mergeMap(() =>
        this.toolStockService.getAll().pipe(
          map((toolStocks) =>
            ToolStockActions.loadToolStocksSuccess({
              toolStocks,
            })
          ),
          catchError((error) =>
            of(ToolStockActions.loadToolStocksFailure({ error }))
          )
        )
      )
    )
  );

  loadToolStock$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ToolStockActions.loadToolStock),
      mergeMap((action) =>
        this.toolStockService.getByID(action.toolStockID).pipe(
          map((toolStock) =>
            ToolStockActions.loadToolStockSuccess({
              toolStock,
            })
          ),
          catchError((error) =>
            of(ToolStockActions.loadToolStockFailure({ error }))
          )
        )
      )
    )
  );

  updateToolStock$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ToolStockActions.updateToolStock),
      mergeMap((action) =>
        this.toolStockService.update(action.toolStock).pipe(
          map((toolStock) =>
            ToolStockActions.updateToolStockSuccess({
              toolStock,
            })
          ),
          catchError((error) =>
            of(
              ToolStockActions.updateToolStockFailure({
                error: {
                  errorType: 'UPDATE_INGREDIENT_STOCK_FAILURE',
                  message: 'Failed to update tool stock',
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

  deleteToolStock$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ToolStockActions.deleteToolStock),
      mergeMap((action) =>
        this.toolStockService.delete(action.toolStockID).pipe(
          map(() =>
            ToolStockActions.deleteToolStockSuccess({
              toolStockID: action.toolStockID,
            })
          ),
          catchError((error) =>
            of(
              ToolStockActions.deleteToolStockFailure({
                error: {
                  errorType: 'DELETE_INGREDIENT_STOCK_FAILURE',
                  message: 'Failed to delete tool stock',
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