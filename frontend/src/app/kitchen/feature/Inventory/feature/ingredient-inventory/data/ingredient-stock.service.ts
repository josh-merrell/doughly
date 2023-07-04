import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, combineLatest, map } from 'rxjs';
const dayjs = require('dayjs');

import { environment } from 'src/environments/environment';
import { Store, select } from '@ngrx/store';
import { selectIngredientStocks } from '../state/ingredient-stock-selectors';
import { selectIngredients } from 'src/app/ingredients/state/ingredient-selectors';
import {
  IngredientStock,
  IngredientStockRow,
} from '../state/ingredient-stock-state';
import { Ingredient } from 'src/app/ingredients/state/ingredient-state';

@Injectable({
  providedIn: 'root',
})
export class IngredientStockService {
  private API_URL = `${environment.BACKEND}/ingredientStocks`;

  constructor(private http: HttpClient, private store: Store) {}

  rows$: Observable<IngredientStockRow[]> = combineLatest([this.store.pipe(select(selectIngredientStocks)), this.store.pipe(select(selectIngredients))]).pipe(
    map(([ingredientStocks, ingredients]: [IngredientStock[], Ingredient[]]) => {
      return ingredientStocks.map((stock) => {
        const ingredient = ingredients.find(
          (i) => i.ingredientID === stock.ingredientID
        );
        if (!ingredient) {
          return {
            name: `IngredientID:${stock.ingredientID} missing, can't get details for IngredientStockID:${stock.ingredientStockID}`,
            brand: "Unknown",
            quantity: "Unknown",
            expiration: "Unknown"
          };
        }
        const quantity = `${(stock.grams / ingredient.gramRatio).toFixed(2)} ${
          ingredient.purchaseUnit
        }`;
        const expiration = dayjs(stock.purchasedDate)
          .add(ingredient.lifespanDays, 'day')
          .format('MM/DD/YYYY');
        return {
          name: ingredient.name,
          brand: ingredient.brand,
          quantity: quantity,
          expiration: expiration,
        };
      });
    }));

  getAll(): Observable<IngredientStock[]> {
    return this.http.get<IngredientStock[]>(this.API_URL);
  }

  getByID(ingredientStockID: number): Observable<IngredientStock> {
    return this.http.get<IngredientStock>(
      `${this.API_URL}/${ingredientStockID}`
    );
  }

  add(ingredientStock: IngredientStock): Observable<IngredientStock> {
    return this.http.post<IngredientStock>(this.API_URL, ingredientStock);
  }
}
