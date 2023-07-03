import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IngredientStock } from '../state/ingredient-stock-state';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class IngredientStockService {
  private API_URL = `${environment.BACKEND}/ingredientStocks`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<IngredientStock[]> {
    return this.http.get<IngredientStock[]>(this.API_URL);
  }

  getByID(ingredientStockID: number): Observable<IngredientStock> {
    return this.http.get<IngredientStock>(`${this.API_URL}/${ingredientStockID}`);
  }

  add(ingredientStock: IngredientStock): Observable<IngredientStock> {
    return this.http.post<IngredientStock>(this.API_URL, ingredientStock);
  }
}
