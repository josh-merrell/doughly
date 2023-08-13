import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { RecipeTool } from '../state/recipe-tool/recipe-tool-state';
import { environment } from 'src/environments/environment';
import { Store } from '@ngrx/store';
import { selectRecipeTools } from '../state/recipe-tool/recipe-tool-selectors';

@Injectable({
  providedIn: 'root',
})
export class RecipeToolService {
  private API_URL = `${environment.BACKEND}/tools/recipe`;

  constructor(private http: HttpClient, private store: Store) {}

  rows$: Observable<RecipeTool[]> = this.store
    .select(selectRecipeTools)
    .pipe(
      map((recipeTools: RecipeTool[]) => {
        return recipeTools.map((recipeTool: RecipeTool) => {
          return {
            recipeToolID: recipeTool.recipeToolID,
            recipeID: recipeTool.recipeID,
            toolID: recipeTool.toolID,
            quantity: recipeTool.quantity,
          };
        });
      }
    )
  );

  getAll(): Observable<RecipeTool[]> {
    return this.http.get<RecipeTool[]>(this.API_URL);
  }

  getByID(recipeToolID: number): Observable<RecipeTool> {
    return this.http.get<RecipeTool>(`${this.API_URL}/${recipeToolID}`);
  }

  add(recipeTool: RecipeTool): Observable<RecipeTool> {
    return this.http.post<RecipeTool>(this.API_URL, recipeTool);
  }

  delete(recipeToolID: number): Observable<RecipeTool> {
    return this.http.delete<RecipeTool>(
      `${this.API_URL}/${recipeToolID}`
    );
  }

  update(recipeTool: RecipeTool): Observable<RecipeTool> {
    return this.http.patch<RecipeTool>(
      `${this.API_URL}/${recipeTool.recipeToolID}`,
      recipeTool
    );
  }
}
