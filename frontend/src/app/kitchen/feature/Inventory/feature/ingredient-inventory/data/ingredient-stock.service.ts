import { Injectable, WritableSignal, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, combineLatest, forkJoin, map, of, switchMap } from 'rxjs';
const dayjs = require('dayjs');

import { environment } from 'src/environments/environment';
import { Store, select } from '@ngrx/store';
import { selectIngredientStocks } from '../state/ingredient-stock-selectors';
import { selectIngredients } from 'src/app/kitchen/feature/ingredients/state/ingredient-selectors';
import {
  IngredientStock,
  IngredientStockRow,
} from '../state/ingredient-stock-state';
import { Ingredient } from 'src/app/kitchen/feature/ingredients/state/ingredient-state';
import { IDService } from 'src/app/shared/utils/ID';
import { selectProfile } from 'src/app/profile/state/profile-selectors';

@Injectable({
  providedIn: 'root',
})
export class IngredientStockService {
  private API_URL = `${environment.BACKEND}/ingredientStocks`;
  private profile: WritableSignal<any> = signal({});
  private ingredients: WritableSignal<any> = signal({});

  constructor(
    private http: HttpClient,
    private store: Store,
    private idService: IDService
  ) {
    this.store.select(selectProfile).subscribe((profile) => {
      this.profile.set(profile);
    });
    this.store.select(selectIngredients).subscribe((ingredients) => {
      this.ingredients.set(ingredients);
    });
  }

  rows$: Observable<IngredientStockRow[]> = combineLatest([
    this.store.pipe(select(selectIngredientStocks)),
    this.store.pipe(select(selectIngredients)),
  ]).pipe(
    map(
      ([ingredientStocks, ingredients]: [IngredientStock[], Ingredient[]]) => {
        return ingredientStocks.map((stock) => {
          const ingredient = ingredients.find(
            (i) => i.ingredientID === stock.ingredientID
          );
          if (!ingredient) {
            return {
              ingredientStockID: 0,
              name: `IngredientID:${stock.ingredientID} missing, can't get details for IngredientStockID:${stock.ingredientStockID}`,
              brand: 'Unknown',
              quantity: 'Unknown',
              expiration: 'Unknown',
            };
          }
          const quantity = `${(stock.grams / ingredient.gramRatio).toFixed(
            2
          )} ${ingredient.purchaseUnit}`;
          const expiration = dayjs(stock.purchasedDate)
            .add(ingredient.lifespanDays, 'day')
            // .format('MM/DD/YYYY');
            .toDate();
          return {
            ingredientStockID: stock.ingredientStockID,
            name: ingredient.name,
            brand: ingredient.brand,
            quantity: quantity,
            expiration: expiration,
          };
        });
      }
    )
  );

  deleteExpiredAndGetAll(): Observable<IngredientStock[]> {
    // first get 'autoDeleteExpiredStock' from profile
    const autoDeleteExpiredStock = this.profile().autoDeleteExpiredStock;

    if (autoDeleteExpiredStock) {
      // If true, delete all expired ingredientStocks and then fetch all stocks
      return this.deleteExpiredStocks().pipe(
        switchMap(() => this.http.get<IngredientStock[]>(this.API_URL))
      );
    } else {
      // If auto-deletion is not enabled, directly return all ingredientStocks
      return this.http.get<IngredientStock[]>(this.API_URL);
    }
  }

  getAll(): Observable<IngredientStock[]> {
    return this.http.get<IngredientStock[]>(this.API_URL);
  }

  deleteExpiredStocks(): Observable<void> {
    return this.getAll().pipe(
      switchMap((ingredientStocks) => {
        // Explicitly type the accumulator as an array of Observable<IngredientStock>
        const deleteRequests: Observable<IngredientStock>[] =
          ingredientStocks.reduce(
            (acc: Observable<IngredientStock>[], stock) => {
              const ingredient = this.ingredients().find(
                (i) => i.ingredientID === stock.ingredientID
              );
              if (!ingredient) return acc;
              const expiration = dayjs(stock.purchasedDate)
                .add(ingredient.lifespanDays, 'day')
                .toDate();
              if (dayjs().isAfter(expiration)) {
                acc.push(this.delete(stock.ingredientStockID));
              }
              return acc;
            },
            []
          );

        if (deleteRequests.length === 0) {
          return of(undefined);
        }

        // Use forkJoin to wait for all delete requests to complete
        return forkJoin(deleteRequests).pipe(
          map(() => undefined),
          catchError(() => of(undefined))
        );
      })
    );
  }

  getByID(ingredientStockID: number): Observable<IngredientStock> {
    return this.http.get<IngredientStock>(
      `${this.API_URL}/${ingredientStockID}`
    );
  }

  add(ingredientStock: IngredientStock): Observable<IngredientStock> {
    // copy ingredientStock object into new 'body' object, then add IDtype to it
    const IDtype = this.idService.getIDtype('ingredientStock');
    ingredientStock = {
      IDtype,
      ...ingredientStock,
    };
    return this.http.post<IngredientStock>(this.API_URL, ingredientStock);
  }

  bulkAdd(ingredientStocks: IngredientStock[]): Observable<IngredientStock[]> {
    const requests = ingredientStocks.map((ingredientStock) =>
      this.add(ingredientStock)
    );

    return forkJoin(requests).pipe(
      map((results) => {
        const failures = results.filter((result) => !result.ingredientStockID);
        if (failures.length > 0) {
          throw new Error('Some ingredient stocks failed to add');
        }
        return results;
      })
    );
  }

  update(ingredientStock: IngredientStock): Observable<IngredientStock> {
    return this.http.patch<IngredientStock>(
      `${this.API_URL}/${ingredientStock.ingredientStockID}`,
      ingredientStock
    );
  }

  delete(ingredientStockID: number): Observable<IngredientStock> {
    return this.http.delete<IngredientStock>(
      `${this.API_URL}/${ingredientStockID}`
    );
  }
}
