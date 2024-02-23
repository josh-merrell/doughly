import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {
  catchError,
  filter,
  map,
  mergeMap,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import { ShoppingListIngredientService } from '../data/shopping-list-ingredient.service';
import { ShoppingListIngredientActions } from './shopping-list-ingredient-actions';
import { ShoppingListIngredient } from './shopping-list-ingredient-state';
import { IngredientStockActions } from 'src/app/kitchen/feature/Inventory/feature/ingredient-inventory/state/ingredient-stock-actions';
import { of } from 'rxjs';
import { ShoppingListActions } from './shopping-list-actions';
import { selectTempPurchasing } from './shopping-list-ingredient-selectors';
import { Store } from '@ngrx/store';

@Injectable()
export class ShoppingListIngredientEffects {
  constructor(
    private actions$: Actions,
    private shoppingListIngredientService: ShoppingListIngredientService,
    private store: Store
  ) {}

  loadShoppingListIngredients$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListIngredientActions.loadShoppingListIngredients),
      mergeMap((action) =>
        this.shoppingListIngredientService
          .getIngredientsByShoppingListID(action.shoppingListID)
          .pipe(
            map((shoppingListIngredients: ShoppingListIngredient[]) =>
              ShoppingListIngredientActions.loadShoppingListIngredientsSuccess({
                shoppingListIngredients,
              })
            ),
            catchError((error) =>
              of(
                ShoppingListIngredientActions.loadShoppingListIngredientsFailure(
                  {
                    error: {
                      message: error.error.error,
                      statusCode: error.status,
                      rawError: error,
                    },
                  }
                )
              )
            )
          )
      )
    )
  );

  createShoppingListIngredient$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListIngredientActions.addShoppingListIngredient),
      mergeMap((action) =>
        this.shoppingListIngredientService
          .createShoppingListIngredient(
            action.shoppingListID,
            action.ingredientID,
            action.needMeasurement,
            action.needUnit,
            action.source
          )
          .pipe(
            map((shoppingListIngredient: ShoppingListIngredient) =>
              ShoppingListIngredientActions.addShoppingListIngredientSuccess({
                shoppingListIngredient,
              })
            ),
            catchError((error) =>
              of(
                ShoppingListIngredientActions.addShoppingListIngredientFailure({
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

  loadShoppingListIngredientsAfterCreate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListIngredientActions.addShoppingListIngredientSuccess),
      map((action) =>
        ShoppingListIngredientActions.loadShoppingListIngredients({
          shoppingListID: action.shoppingListIngredient.shoppingListID,
        })
      )
    )
  );

  batchCreateShoppingListIngredients$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListIngredientActions.batchAddShoppingListIngredients),
      mergeMap((action) =>
        this.shoppingListIngredientService
          .batchCreateShoppingListIngredients(
            action.shoppingListID,
            action.ingredients
          )
          .pipe(
            map((shoppingListIngredients: ShoppingListIngredient[]) =>
              ShoppingListIngredientActions.batchAddShoppingListIngredientsSuccess(
                {
                  shoppingListIngredients,
                }
              )
            ),
            catchError((error) =>
              of(
                ShoppingListIngredientActions.batchAddShoppingListIngredientsFailure(
                  {
                    error: {
                      message: error.error.error,
                      statusCode: error.status,
                      rawError: error,
                    },
                  }
                )
              )
            )
          )
      )
    )
  );

  loadShoppingListIngredientsAfterBatchCreate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        ShoppingListIngredientActions.batchAddShoppingListIngredientsSuccess
      ),
      map((action) =>
        ShoppingListIngredientActions.loadShoppingListIngredients({
          shoppingListID: action.shoppingListIngredients[0].shoppingListID,
        })
      )
    )
  );

  updateShoppingListIngredient$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListIngredientActions.updateShoppingListIngredient),
      mergeMap((action) =>
        this.shoppingListIngredientService
          .updateShoppingListIngredient(
            action.shoppingListIngredientID,
            action.purchasedMeasurement,
            action.purchasedUnit,
            action.store
          )
          .pipe(
            map(() =>
              ShoppingListIngredientActions.updateShoppingListIngredientSuccess(
                {
                  shoppingListIngredientID: action.shoppingListIngredientID,
                  shoppingListID: action.shoppingListID,
                }
              )
            ),
            catchError((error) =>
              of(
                ShoppingListIngredientActions.updateShoppingListIngredientFailure(
                  {
                    error: {
                      message: error.error.error,
                      statusCode: error.status,
                      rawError: error,
                    },
                  }
                )
              )
            )
          )
      )
    )
  );

  loadShoppingListIngredientsAfterUpdate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListIngredientActions.updateShoppingListIngredientSuccess),
      map((action) =>
        ShoppingListIngredientActions.loadShoppingListIngredients({
          shoppingListID: action.shoppingListID,
        })
      )
    )
  );

  //**************** Perform multiple when user confirms purchase of items
  //First put the shoppingListIngredients in tempPurchasing, this state will be referenced by later effects
  addTempPurchasing$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        ShoppingListIngredientActions.batchUpdateShoppingListIngredientStocks
      ),
      map((action) =>
        ShoppingListIngredientActions.addTempPurchasing({
          shoppingListID: action.shoppingListID,
          store: action.store,
          shoppingListIngredients: action.shoppingListIngredients,
          listComplete: action.listComplete,
        })
      )
    )
  );
  // Initial call from component. We first try to add stock entries for each shoppingList ingredient
  batchUpdateShoppingListIngredientStocks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        ShoppingListIngredientActions.batchUpdateShoppingListIngredientStocks
      ),
      map((action) =>
        IngredientStockActions.bulkAddIngredientStocks({
          ingredientStocks: action.shoppingListIngredients.map((sli) => {
            return {
              ingredientID: sli.ingredientID,
              measurement: sli.purchasedMeasurement,
              purchasedDate: sli.purchasedDate,
            };
          }),
          shoppingListID: action.shoppingListID,
        })
      )
    )
  );
  // UPDATE shoppingListIngredients AFTER STOCKS ADDED
  bulkAddIngredientStocksSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IngredientStockActions.bulkAddIngredientStocksSuccess),
      withLatestFrom(this.store.select(selectTempPurchasing)),
      map(([action, tempPurchasing]) =>
        ShoppingListIngredientActions.batchUpdateShoppingListIngredients({
          shoppingListIngredients: tempPurchasing?.shoppingListIngredients,
          store: tempPurchasing?.store,
        })
      )
    )
  );
  // CALL Service method to bulk update shoppingListIngredients
  batchUpdateShoppingListIngredients$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListIngredientActions.batchUpdateShoppingListIngredients),
      mergeMap((action) =>
        this.shoppingListIngredientService
          .batchUpdateShoppingListIngredients(
            action.shoppingListIngredients,
            action.store
          )
          .pipe(
            map(() =>
              ShoppingListIngredientActions.batchUpdateShoppingListIngredientsSuccess()
            ),
            catchError((error) =>
              of(
                ShoppingListIngredientActions.batchUpdateShoppingListIngredientsFailure(
                  {
                    error: {
                      message: error.error.error,
                      statusCode: error.status,
                      rawError: error,
                    },
                  }
                )
              )
            )
          )
      )
    )
  );
  // EDIT SHOPPING LIST AFTER STOCKS ADDED AND SLI UPDATED IF LIST COMPLETE. If List is not complete, immediately get rid of tempPurchasing
  batchUpdateShoppingListIngredientsSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        ShoppingListIngredientActions.batchUpdateShoppingListIngredientsSuccess
      ),
      withLatestFrom(this.store.select(selectTempPurchasing)),
      switchMap(([action, tempPurchasing]) => {
        if (tempPurchasing?.listComplete) {
          return of(
            ShoppingListActions.editShoppingList({
              shoppingListID: tempPurchasing.shoppingListID,
              status: 'fulfilled',
              fulfilledDate: new Date().toISOString(),
              fulfilledMethod: 'manual',
            })
          );
        } else {
          return of(ShoppingListIngredientActions.removeTempPurchasing());
        }
      })
    )
  );
  // 'shopping-list-effects' will remove tempPurchasing AFTER ShoppingList Updated
  //CALL batchUpdateShoppingListIngredientStocksSuccess after we remove tempPurchasing
  removeTempPurchasing$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListIngredientActions.removeTempPurchasing),
      map(() =>
        ShoppingListIngredientActions.batchUpdateShoppingListIngredientStocksSuccess()
      )
    )
  );

  loadShoppingListsAfterPurchasing$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        ShoppingListIngredientActions.batchUpdateShoppingListIngredientStocksSuccess
      ),
      map((action) => ShoppingListActions.loadShoppingLists())
    )
  );
  // *************************************************************

  deleteShoppingListIngredient$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListIngredientActions.deleteShoppingListIngredient),
      mergeMap((action) =>
        this.shoppingListIngredientService
          .deleteShoppingListIngredient(action.shoppingListIngredientID)
          .pipe(
            map(() =>
              ShoppingListIngredientActions.deleteShoppingListIngredientSuccess(
                {
                  shoppingListIngredientID: action.shoppingListIngredientID,
                  shoppingListID: action.shoppingListID,
                }
              )
            ),
            catchError((error) =>
              of(
                ShoppingListIngredientActions.deleteShoppingListIngredientFailure(
                  {
                    error: {
                      message: error.error.error,
                      statusCode: error.status,
                      rawError: error,
                    },
                  }
                )
              )
            )
          )
      )
    )
  );

  loadShoppingListIngredientsAfterDelete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListIngredientActions.deleteShoppingListIngredientSuccess),
      map((action) =>
        ShoppingListIngredientActions.loadShoppingListIngredients({
          shoppingListID: action.shoppingListID,
        })
      )
    )
  );

  loadShoppingListAfterIngredientDelete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListIngredientActions.deleteShoppingListIngredientSuccess),
      map((action) => ShoppingListActions.loadShoppingLists())
    )
  );
}
