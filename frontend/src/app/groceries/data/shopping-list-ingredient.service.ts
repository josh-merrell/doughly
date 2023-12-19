import { Injectable, WritableSignal, signal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Store } from '@ngrx/store';
import { HttpClient } from '@angular/common/http';
import { IDService } from 'src/app/shared/utils/ID';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ShoppingListIngredientService {
  private API_URL = `${environment.BACKEND}/shopping/listIngredients`;

  constructor(private http: HttpClient, private idService: IDService) {}

  getShoppingListIngredientByID(
    shoppingListIngredientID: number
  ): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/${shoppingListIngredientID}`);
  }

  getIngredientsByShoppingListID(shoppingListID: number): Observable<any[]> {
    if (!shoppingListID) return new Observable<any[]>(() => {});
    return this.http.get<any[]>(`${this.API_URL}/byList/${shoppingListID}`);
  }

  createShoppingListIngredient(
    shoppingListID: number,
    ingredientID: number,
    needMeasurement: number,
    needUnit: string,
    source: string
  ): Observable<any> {
    const body = {
      IDtype: this.idService.getIDtype('shoppingListIngredient'),
      ingredientID,
      needMeasurement,
      needUnit,
      source,
    };
    return this.http.post<any>(`${this.API_URL}/${shoppingListID}`, body);
  }

  updateShoppingListIngredient(
    shoppingListIngredientID: number,
    purchasedMeasurement: number,
    purchasedUnit: string,
    store: string
  ): Observable<any> {
    const body = {
      purchasedMeasurement,
      purchasedUnit,
      store,
    };
    return this.http.put<any>(
      `${this.API_URL}/${shoppingListIngredientID}`,
      body
    );
  }

  deleteShoppingListIngredient(
    shoppingListIngredientID: number
  ): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/${shoppingListIngredientID}`);
  }
}
