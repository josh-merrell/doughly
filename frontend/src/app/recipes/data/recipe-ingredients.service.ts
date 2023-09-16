import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { RecipeIngredient } from '../state/recipe-ingredient/recipe-ingredient-state';
import { environment } from 'src/environments/environment';
import { Store } from '@ngrx/store';
import { selectRecipeIngredients } from '../state/recipe-ingredient/recipe-ingredient-selectors';
import { Recipe, RecipeStatus } from '../state/recipe/recipe-state';

@Injectable({
  providedIn: 'root',
})
export class RecipeIngredientService {
  private API_URL = `${environment.BACKEND}/ingredients/recipe`;

  constructor(private http: HttpClient, private store: Store) {}

  rows$: Observable<RecipeIngredient[]> = this.store
    .select(selectRecipeIngredients)
    .pipe(
      map((recipeIngredients: RecipeIngredient[]) => {
        return recipeIngredients.map((recipeIngredient: RecipeIngredient) => {
          return {
            recipeIngredientID: recipeIngredient.recipeIngredientID,
            recipeID: recipeIngredient.recipeID,
            ingredientID: recipeIngredient.ingredientID,
            measurement: recipeIngredient.measurement,
            measurementUnit: recipeIngredient.measurementUnit,
            purchaseUnitRatio: recipeIngredient.purchaseUnitRatio,
          };
        });
      })
    );

  getAll(): Observable<RecipeIngredient[]> {
    return this.http.get<RecipeIngredient[]>(this.API_URL);
  }

  getByID(recipeIngredientID: number): Observable<RecipeIngredient> {
    return this.http.get<RecipeIngredient>(
      `${this.API_URL}/${recipeIngredientID}`
    );
  }

  add(recipeIngredient: RecipeIngredient): Observable<RecipeIngredient> {
    return this.http.post<RecipeIngredient>(this.API_URL, recipeIngredient);
  }

  delete(recipeIngredientID: number): Observable<RecipeIngredient> {
    return this.http.delete<RecipeIngredient>(
      `${this.API_URL}/${recipeIngredientID}`
    );
  }

  update(recipeIngredient: RecipeIngredient): Observable<RecipeIngredient> {
    return this.http.patch<RecipeIngredient>(
      `${this.API_URL}/${recipeIngredient.recipeIngredientID}`,
      recipeIngredient
    );
  }
}
