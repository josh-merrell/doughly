import { Injectable, WritableSignal, signal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Store } from '@ngrx/store';
import { HttpClient } from '@angular/common/http';
import { IDService } from 'src/app/shared/utils/ID';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ShoppingListRecipeService {
  private API_URL = `${environment.BACKEND}/shopping/listRecipes`;

  constructor(
    private http: HttpClient,
    private idService: IDService
  ) {}

  getAllShoppingListRecipes(): Observable<any[]> {
    return this.http.get<any[]>(this.API_URL);
  }

  getShoppingListRecipeByID(shoppingListRecipeID: number): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/${shoppingListRecipeID}`);
  }

  getRecipesByShoppingListID(shoppingListID: number): Observable<any[]> {
    if (!shoppingListID) return new Observable<any[]>(() => {});
    return this.http.get<any[]>(`${this.API_URL}/byList/${shoppingListID}`);
  }

  createShoppingListRecipe(shoppingListID: number, recipeID: number, plannedDate: string): Observable<any> {
    console.log('createShoppingListRecipe: ', shoppingListID, recipeID, plannedDate);
    const body = {
      IDtype: this.idService.getIDtype('shoppingListRecipe'),
      recipeID,
      plannedDate,
    };
    return this.http.post<any>(`${this.API_URL}/${shoppingListID}`, body);
  }

  deleteShoppingListRecipe(shoppingListRecipeID: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/${shoppingListRecipeID}`);
  }
}
