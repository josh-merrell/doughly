import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { RecipeTool } from '../state/recipe-tool/recipe-tool-state';
import { environment } from 'src/environments/environment';
import { Store } from '@ngrx/store';
import { selectRecipeTools } from '../state/recipe-tool/recipe-tool-selectors';
import { IDService } from 'src/app/shared/utils/ID';

@Injectable({
  providedIn: 'root',
})
export class RecipeToolService {
  private API_URL = `${environment.BACKEND}/tools/recipe`;
  private API_URL_RECIPE = `${environment.BACKEND}/recipes`;

  constructor(
    private http: HttpClient,
    private store: Store,
    private idService: IDService
  ) {}

  rows$: Observable<RecipeTool[]> = this.store.select(selectRecipeTools).pipe(
    map((recipeTools: RecipeTool[]) => {
      return recipeTools.map((recipeTool: RecipeTool) => {
        return {
          recipeToolID: recipeTool.recipeToolID,
          recipeID: recipeTool.recipeID,
          toolID: recipeTool.toolID,
          quantity: recipeTool.quantity,
        };
      });
    })
  );

  getAll(): Observable<RecipeTool[]> {
    return this.http.get<RecipeTool[]>(this.API_URL);
  }

  getByID(recipeToolID: number): Observable<RecipeTool> {
    return this.http.get<RecipeTool>(`${this.API_URL}/${recipeToolID}`);
  }

  getByRecipeID(recipeID: number): Observable<RecipeTool[]> {
    return this.http.get<RecipeTool[]>(
      `${this.API_URL_RECIPE}/${recipeID}/tools`
    );
  }

  add(recipeTool: RecipeTool): Observable<RecipeTool> {
    const body = {
      IDtype: this.idService.getIDtype('recipeTool'),
      recipeID: recipeTool.recipeID,
      toolID: recipeTool.toolID,
      quantity: recipeTool.quantity,
    };
    return this.http.post<RecipeTool>(this.API_URL, body);
  }

  delete(recipeToolID: number): Observable<RecipeTool> {
    return this.http.delete<RecipeTool>(`${this.API_URL}/${recipeToolID}`);
  }

  update(recipeTool: RecipeTool): Observable<RecipeTool> {
    return this.http.patch<RecipeTool>(
      `${this.API_URL}/${recipeTool.recipeToolID}`,
      recipeTool
    );
  }
}
