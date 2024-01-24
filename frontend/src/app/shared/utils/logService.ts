import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LogService {
  private readonly API_URL = `${environment.BACKEND}/logs`;

  constructor(private http: HttpClient) {}

  getRecipeLogs(userID: string, eventType: string, createdAfter, createdBefore) {
    const params = { userID, eventType, createdAfter, createdBefore};
    return this.http.get<any>(`${this.API_URL}/recipe`, { params });
  }

  getRecipeFeedbackLogs(userID: string, recipeID, createdAfter, createdBefore) {
    const params = { userID, recipeID, createdAfter, createdBefore};
    return this.http.get<any>(`${this.API_URL}/recipeFeedback`, { params });
  }

  getShoppingLogs(userID: string, eventType: string, createdAfter, createdBefore) {
    const params = { userID, eventType, createdAfter, createdBefore};
    return this.http.get<any>(`${this.API_URL}/shopping`, { params });
  }

  getKitchenLogs(userID: string, eventType: string, createdAfter, createdBefore) {
    const params = { userID, eventType, createdAfter, createdBefore};
    return this.http.get<any>(`${this.API_URL}/kitchen`, { params });
  }
}
