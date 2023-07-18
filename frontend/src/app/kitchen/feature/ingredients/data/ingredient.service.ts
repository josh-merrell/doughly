import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Ingredient } from '../state/ingredient-state';
import { environment } from 'src/environments/environment';
import { Store } from '@ngrx/store';
import { selectIngredients } from '../state/ingredient-selectors';

@Injectable({
  providedIn: 'root',
})
export class IngredientService {
  private API_URL = `${environment.BACKEND}/ingredients`;

  constructor(private http: HttpClient, private store: Store) {}

  rows$: Observable<Ingredient[]> = this.store.select(selectIngredients).pipe(
    map((ingredients: Ingredient[]) => {
      return ingredients.map((ingredient: Ingredient) => {
        return {
          ingredientID: ingredient.ingredientID,
          name: ingredient.name,
          brand: ingredient.brand,
          gramRatio: ingredient.gramRatio,
          purchaseUnit: ingredient.purchaseUnit,
          lifespanDays: ingredient.lifespanDays,
        };
      });
    })
  )

  getAll(): Observable<Ingredient[]> {
    return this.http.get<Ingredient[]>(this.API_URL);
  }

  getByID(ingredientID: number): Observable<Ingredient> {
    return this.http.get<Ingredient>(`${this.API_URL}/${ingredientID}`);
  }

  add(ingredient: Ingredient): Observable<Ingredient> {
    return this.http.post<Ingredient>(this.API_URL, ingredient);
  }

  delete(ingredientID: number): Observable<Ingredient> {
    return this.http.delete<Ingredient>(`${this.API_URL}/${ingredientID}`);
  }

  update(ingredient: Ingredient): Observable<Ingredient> {
    return this.http.patch<Ingredient>(
      `${this.API_URL}/${ingredient.ingredientID}`,
      ingredient
    );
  }
}
