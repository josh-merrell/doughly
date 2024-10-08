import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { ShoppingListService } from '../data/shopping-list.service';
import { ShoppingListActions } from './shopping-list-actions';
import { ShoppingList } from './shopping-list-state';
import { of } from 'rxjs';
import { ShoppingListIngredientActions } from './shopping-list-ingredient-actions';
import { ShoppingListRecipeActions } from './shopping-list-recipe-actions';
import { SharedShoppingListActions } from './sharedShoppingLists/shared-shopping-list-actions';

@Injectable()
export class ShoppingListEffects {
  constructor(
    private actions$: Actions,
    private shoppingListService: ShoppingListService
  ) {}

  loadShoppingLists$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListActions.loadShoppingLists),
      mergeMap(() =>
        this.shoppingListService.getAllShoppingLists().pipe(
          map((shoppingLists: ShoppingList[]) =>
            ShoppingListActions.loadShoppingListsSuccess({ shoppingLists })
          ),
          catchError((error) =>
            of(
              ShoppingListActions.loadShoppingListsFailure({
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

  createShoppingList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListActions.addShoppingList),
      mergeMap((action) =>
        this.shoppingListService.createShoppingList({}).pipe(
          map((shoppingList: ShoppingList) =>
            ShoppingListActions.addShoppingListSuccess({ shoppingList })
          ),
          catchError((error) =>
            of(
              ShoppingListActions.addShoppingListFailure({
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

  loadShoppingListAfterCreate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListActions.addShoppingListSuccess),
      map((action) => {
        return ShoppingListActions.loadShoppingLists();
      })
    )
  );

  editShoppingList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListActions.editShoppingList),
      tap((action) => console.log('UPDATING SHOPPING LIST:', action)),
      mergeMap((action) =>
        this.shoppingListService.updateShoppingList(action).pipe(
          map((shoppingList: ShoppingList) =>
            ShoppingListActions.editShoppingListSuccess({ shoppingList })
          ),
          catchError((error) =>
            of(
              ShoppingListActions.editShoppingListFailure({
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

  loadShoppingListAfterUpdate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListActions.editShoppingListSuccess),
      map((action) => {
        return ShoppingListActions.loadShoppingLists();
      })
    )
  );

  deleteShoppingList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListActions.deleteShoppingList),
      mergeMap((action) =>
        this.shoppingListService.deleteShoppingList(action.shoppingListID).pipe(
          map(() =>
            ShoppingListActions.deleteShoppingListSuccess({
              shoppingListID: action.shoppingListID,
            })
          ),
          catchError((error) =>
            of(
              ShoppingListActions.deleteShoppingListFailure({
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

  loadShoppingListIngredientsAfterClear$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListActions.deleteShoppingListSuccess),
      map((action) => {
        return ShoppingListIngredientActions.loadShoppingListIngredients({
          shoppingListID: action.shoppingListID,
        });
      })
    )
  );

  loadShoppingListRecipesAfterClear$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListActions.deleteShoppingListSuccess),
      map((action) => {
        return ShoppingListRecipeActions.loadShoppingListRecipes({
          shoppingListID: action.shoppingListID,
        });
      })
    )
  );

  receiveItems$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListActions.receiveItems),
      mergeMap((action) =>
        this.shoppingListService
          .receiveItems(
            action.shoppingListID,
            action.items,
            action.store,
            action.purchasedBy ? action.purchasedBy : null,
            action.userID ? action.userID : null
          )
          .pipe(
            map(() =>
              ShoppingListActions.receiveItemsSuccess({
                shoppingListID: action.shoppingListID,
              })
            ),
            catchError((error) =>
              of(
                ShoppingListActions.receiveItemsFailure({
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

  loadShoppingListsAfterPurchasing$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListActions.receiveItemsSuccess),
      map((action) => ShoppingListActions.loadShoppingLists())
    )
  );

  shareList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListActions.shareList),
      mergeMap((action) =>
        this.shoppingListService
          .shareList(action.shoppingListID, action.invitedUserID)
          .pipe(
            map((result) =>
              ShoppingListActions.shareListSuccess({
                shoppingListID: result.shoppingListID,
              })
            ),
            catchError((error) =>
              of(
                ShoppingListActions.shareListFailure({
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

  loadShoppingListsAfterSharing$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListActions.shareListSuccess),
      map((action) => ShoppingListActions.loadShoppingLists())
    )
  );

  loadSharedListsAfterSharing$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListActions.shareListSuccess),
      map((action) => SharedShoppingListActions.loadSharedShoppingLists())
    )
  );

  unshareList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListActions.unshareList),
      mergeMap((action) =>
        this.shoppingListService
          .unshareList(action.shoppingListID, action.invitedUserID)
          .pipe(
            map((result) =>
              ShoppingListActions.unshareListSuccess({
                shoppingListID: result.shoppingListID,
              })
            ),
            catchError((error) =>
              of(
                ShoppingListActions.unshareListFailure({
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

  loadShoppingListsAfterUnsharing$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListActions.unshareListSuccess),
      map((action) => ShoppingListActions.loadShoppingLists())
    )
  );

  loadSharedListsAfterUnsharing$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListActions.unshareListSuccess),
      map((action) => SharedShoppingListActions.loadSharedShoppingLists())
    )
  );
}
