import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { ShoppingListService } from '../data/shopping-list.service';
import { ShoppingListActions } from './shopping-list-actions';
import { ShoppingList } from './shopping-list-state';
import { of } from 'rxjs';

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
            of(ShoppingListActions.loadShoppingListsFailure({ error }))
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
            of(ShoppingListActions.addShoppingListFailure({ error }))
          )
        )
      )
    )
  );

  editShoppingList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListActions.editShoppingList),
      mergeMap((action) =>
        this.shoppingListService.updateShoppingList(action.shoppingList).pipe(
          map((shoppingList: ShoppingList) =>
            ShoppingListActions.editShoppingListSuccess({ shoppingList })
          ),
          catchError((error) =>
            of(ShoppingListActions.editShoppingListFailure({ error }))
          )
        )
      )
    )
  );

  loadShoppingListAfterUpdate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListActions.addShoppingListSuccess),
      map((action) => {
        return ShoppingListActions.loadShoppingLists();
      })
    )
  );

  deleteShoppingList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListActions.deleteShoppingList),
      mergeMap((action) =>
        this.shoppingListService
          .deleteShoppingList(action.shoppingListID)
          .pipe(
            map(() =>
              ShoppingListActions.deleteShoppingListSuccess({
                shoppingListID: action.shoppingListID,
              })
            ),
            catchError((error) =>
              of(ShoppingListActions.deleteShoppingListFailure({ error }))
            )
          )
      )
    )
  );
}