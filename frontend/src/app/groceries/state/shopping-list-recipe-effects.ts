import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { ShoppingListRecipeService } from '../data/shopping-list-recipe.service';
import { ShoppingListRecipeActions } from './shopping-list-recipe-actions';
import { ShoppingListRecipe } from './shopping-list-recipe-state';
import { of } from 'rxjs';

@Injectable()
export class ShoppingListRecipeEffects {
  constructor(
    private actions$: Actions,
    private shoppingListRecipeService: ShoppingListRecipeService
  ) {}

  loadShoppingListRecipes$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListRecipeActions.loadShoppingListRecipes),
      mergeMap((action) =>
        this.shoppingListRecipeService
          .getRecipesByShoppingListID(action.shoppingListID)
          .pipe(
            map((shoppingListRecipes: ShoppingListRecipe[]) =>
              ShoppingListRecipeActions.loadShoppingListRecipesSuccess({
                shoppingListRecipes,
              })
            ),
            catchError((error) =>
              of(
                ShoppingListRecipeActions.loadShoppingListRecipesFailure({
                  error,
                })
              )
            )
          )
      )
    )
  );

  createShoppingListRecipe$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListRecipeActions.addShoppingListRecipe),
      mergeMap((action) =>
        this.shoppingListRecipeService
          .createShoppingListRecipe(
            action.shoppingListID,
            action.recipeID,
            action.plannedDate
          )
          .pipe(
            map((shoppingListRecipe: ShoppingListRecipe) =>
              ShoppingListRecipeActions.addShoppingListRecipeSuccess({
                shoppingListRecipe,
              })
            ),
            catchError((error) =>
              of(
                ShoppingListRecipeActions.addShoppingListRecipeFailure({
                  error,
                })
              )
            )
          )
      )
    )
  );

  deleteShoppingListRecipe$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShoppingListRecipeActions.deleteShoppingListRecipe),
      mergeMap((action) =>
        this.shoppingListRecipeService
          .deleteShoppingListRecipe(action.shoppingListRecipeID)
          .pipe(
            map(() =>
              ShoppingListRecipeActions.deleteShoppingListRecipeSuccess({
                shoppingListRecipeID: action.shoppingListRecipeID,
              })
            ),
            catchError((error) =>
              of(
                ShoppingListRecipeActions.deleteShoppingListRecipeFailure({
                  error,
                })
              )
            )
          )
      )
    )
  );
}
