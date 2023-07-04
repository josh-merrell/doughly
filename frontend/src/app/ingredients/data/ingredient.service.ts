import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ingredient } from '../state/ingredient-state';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class IngredientService {
  private API_URL = `${environment.BACKEND}/ingredients`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<Ingredient[]> {
    return this.http.get<Ingredient[]>(this.API_URL);
  }

  getByID(ingredientID: number): Observable<Ingredient> {
    return this.http.get<Ingredient>(`${this.API_URL}/${ingredientID}`);
  }

  add(ingredient: Ingredient): Observable<Ingredient> {
    return this.http.post<Ingredient>(this.API_URL, ingredient);
  }
}
