import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { ShoppingListIngredientService } from '../data/shopping-list-ingredient.service';
import { ShoppingListIngredientActions } from './shopping-list-ingredient-actions';
import { ShoppingListIngredient } from './shopping-list-ingredient-state';
import { of } from 'rxjs';

@Injectable()
export class ShoppingListIngredientEffects {
  constructor(
    private actions$: Actions,
    private shoppingListIngredientService: ShoppingListIngredientService
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
                ShoppingListIngredientActions.loadShoppingListIngredientsFailure({
                  error,
                })
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
                  error,
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
              ShoppingListIngredientActions.batchAddShoppingListIngredientsSuccess({
                shoppingListIngredients,
              })
            ),
            catchError((error) =>
              of(
                ShoppingListIngredientActions.batchAddShoppingListIngredientsFailure({
                  error,
                })
              )
            )
          )
      )
    )
  );

  loadShoppingListIngredientsAfterBatchCreate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListIngredientActions.batchAddShoppingListIngredientsSuccess),
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
              ShoppingListIngredientActions.updateShoppingListIngredientSuccess({
                shoppingListIngredientID: action.shoppingListIngredientID, shoppingListID: action.shoppingListID,
              })
            ),
            catchError((error) =>
              of(
                ShoppingListIngredientActions.updateShoppingListIngredientFailure({
                  error,
                })
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

  deleteShoppingListIngredient$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListIngredientActions.deleteShoppingListIngredient),
      mergeMap((action) =>
        this.shoppingListIngredientService
          .deleteShoppingListIngredient(action.shoppingListIngredientID)
          .pipe(
            map(() =>
              ShoppingListIngredientActions.deleteShoppingListIngredientSuccess({
                shoppingListIngredientID: action.shoppingListIngredientID, shoppingListID: action.shoppingListID,
              })
            ),
            catchError((error) =>
              of(
                ShoppingListIngredientActions.deleteShoppingListIngredientFailure({
                  error,
                })
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

}