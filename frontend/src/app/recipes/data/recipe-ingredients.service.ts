import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { RecipeIngredient } from '../state/recipe-ingredient/recipe-ingredient-state';
import { environment } from 'src/environments/environment';
import { Store } from '@ngrx/store';
import { selectRecipeIngredients } from '../state/recipe-ingredient/recipe-ingredient-selectors';
import { Recipe, RecipeStatus } from '../state/recipe/recipe-state';
import { IDService } from 'src/app/shared/utils/ID';

@Injectable({
  providedIn: 'root',
})
export class RecipeIngredientService {
  private API_URL = `${environment.BACKEND}/ingredients/recipe`;
  private API_URL_RECIPE = `${environment.BACKEND}/recipes`;

  constructor(
    private http: HttpClient,
    private store: Store,
    private idService: IDService
  ) {}

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
            needsReview: recipeIngredient.needsReview,
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

  getByRecipeID(recipeID: number): Observable<RecipeIngredient[]> {
    return this.http.get<RecipeIngredient[]>(`${this.API_URL_RECIPE}/${recipeID}/ingredients`);
  }

  add(recipeIngredient: RecipeIngredient): Observable<RecipeIngredient> {
    const body = {
      IDtype: this.idService.getIDtype('recipeIngredient'),
      recipeID: recipeIngredient.recipeID,
      ingredientID: recipeIngredient.ingredientID,
      measurement: recipeIngredient.measurement,
      measurementUnit: recipeIngredient.measurementUnit,
      purchaseUnitRatio: recipeIngredient.purchaseUnitRatio,
    };
    return this.http.post<RecipeIngredient>(this.API_URL, body);
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

  getPurEstimate(ingredientName: string, measurementUnit: string, purchaseUnit: string): Observable<number> {
    console.log(`getPurEstimate called with ${ingredientName}, ${measurementUnit}, ${purchaseUnit}`);
    return this.http.post<number>(`${this.API_URL}/purEst`, {
      // include body with three parameters
      ingredientName: ingredientName,
      measurementUnit: measurementUnit,
      purchaseUnit: purchaseUnit
    })
  }
}
