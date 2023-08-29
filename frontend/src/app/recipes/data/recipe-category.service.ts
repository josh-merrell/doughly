import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { RecipeCategory } from '../state/recipe-category/recipe-category-state';
import { environment } from 'src/environments/environment';
import { Store } from '@ngrx/store';
import { selectRecipeCategories } from '../state/recipe-category/recipe-category-selectors';

@Injectable({
  providedIn: 'root',
})
export class RecipeCategoryService {
  private API_URL = `${environment.BACKEND}/recipes/categories`;

  constructor(private http: HttpClient, private store: Store) {}

  rows$: Observable<RecipeCategory[]> = this.store
    .select(selectRecipeCategories)
    .pipe(
      map((recipeCategories: RecipeCategory[]) => {
        return recipeCategories.map((recipeCategory: RecipeCategory) => {
          return {
            recipeCategoryID: recipeCategory.recipeCategoryID,
            name: recipeCategory.name,
            photoURL: recipeCategory.photoURL,
          };
        });
      })
    );

  getAll(): Observable<RecipeCategory[]> {
    return this.http.get<RecipeCategory[]>(this.API_URL);
  }

  getByID(recipeCategoryID: number): Observable<RecipeCategory> {
    return this.http.get<RecipeCategory>(`${this.API_URL}/${recipeCategoryID}`);
  }

  add(recipeCategory: RecipeCategory): Observable<RecipeCategory> {
    return this.http.post<RecipeCategory>(this.API_URL, recipeCategory);
  }

  delete(recipeCategoryID: number): Observable<RecipeCategory> {
    return this.http.delete<RecipeCategory>(
      `${this.API_URL}/${recipeCategoryID}`
    );
  }

  update(recipeCategory: RecipeCategory): Observable<RecipeCategory> {
    return this.http.patch<RecipeCategory>(
      `${this.API_URL}/${recipeCategory.recipeCategoryID}`,
      recipeCategory
    );
  }
}
