import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { ShoppingListService } from '../../data/shopping-list.service';
import { SharedShoppingListActions } from './shared-shopping-list-actions';
import { catchError, map, mergeMap, of } from 'rxjs';
import { SharedShoppingList } from './shared-shopping-list-state';

@Injectable()
export class SharedShoppingListEffects {
  constructor(
    private actions$: Actions,
    private shoppingListService: ShoppingListService
  ) {}

  loadSharedShoppingLists$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SharedShoppingListActions.loadSharedShoppingLists),
      mergeMap(() =>
        this.shoppingListService.getSharedShoppingLists().pipe(
          map((sharedShoppingLists: SharedShoppingList[]) =>
            SharedShoppingListActions.loadSharedShoppingListsSuccess({
              sharedShoppingLists,
            })
          ),
          catchError((error) =>
            of(
              SharedShoppingListActions.loadSharedShoppingListsFailure({
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
