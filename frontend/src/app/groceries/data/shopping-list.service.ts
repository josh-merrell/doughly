import { Injectable, WritableSignal, signal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Store, select } from '@ngrx/store';
import { HttpClient } from '@angular/common/http';
import { IDService } from 'src/app/shared/utils/ID';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ShoppingListService {
  private API_URL = `${environment.BACKEND}/shopping/lists`;

  constructor(
    private http: HttpClient,
    private store: Store,
    private idService: IDService
  ) {}

  getAllShoppingLists(): Observable<any[]> {
    return this.http.get<any[]>(this.API_URL);
  }

  getSharedShoppingLists(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/shared`);
  }

  shareList(shoppingListID: number, invitedUserID: number): Observable<any> {
    return this.http.patch<any>(`${this.API_URL}/${shoppingListID}/share`, {
      invitedUserID
    });
  }

  getShoppingListByID(shoppingListID: number): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/${shoppingListID}`);
  }

  createShoppingList(shoppingList: any): Observable<any> {
    const body = {
      IDtype: this.idService.getIDtype('shoppingList'),
    };
    return this.http.post<any>(this.API_URL, body);
  }

  updateShoppingList(shoppingList: any): Observable<any> {
    return this.http.patch<any>(
      `${this.API_URL}/${shoppingList.shoppingListID}`,
      shoppingList
    );
  }

  deleteShoppingList(shoppingListID: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/${shoppingListID}`);
  }

  receiveItems(
    shoppingListID: number,
    items: any[],
    store: string,
    purchasedBy: string | null
  ): Observable<any> {
    return this.http.patch<any>(
      `${this.API_URL}/${shoppingListID}/receiveItems`,
      {
        items,
        store,
        purchasedBy,
      }
    );
  }
}
