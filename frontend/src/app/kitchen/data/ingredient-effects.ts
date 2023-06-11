import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { IngredientService } from './ingredient-service';
import * as IngredientActions from '../state/kitchen-actions';

@Injectable()
export class IngredientEffects {
  loadIngredients$ = createEffect(() => {
    this.actions$.pipe(
      ofType(IngredientActions.loadIngredientStocks),
      mergeMap(() => this.ingredientService.getAllIngredientStocks()
        .pipe(
          map(ingredients => IngredientActions.loadIngredientStocksSuccess({ ingredients })),
          catchError(() => EMPTY)
        ))
    )
  })

  constructor(private actions$: Actions, private ingredientService: IngredientService) {}
}
