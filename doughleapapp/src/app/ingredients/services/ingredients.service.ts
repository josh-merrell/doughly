import { Inject, Injectable } from '@angular/core';
import { Ingredient, IngredientResponse } from '../ingredients';
import { environment } from '../../../environments/environment'
import { AppConfig } from 'src/app/AppConfig/appconfig.interface';
import { APP_SERVICE_CONFIG } from 'src/app/AppConfig/appconfig.service';
import { HttpClient, HttpHeaders, HttpRequest } from '@angular/common/http';
import { photos } from './photos';
import { shareReplay } from 'rxjs';


@Injectable({
  providedIn: 'root', //SINGLE instance available to all consumers. Also, Angular figures out dependencies for us
})
export class IngredientsService {
  constructor(@Inject(APP_SERVICE_CONFIG) private config: AppConfig, private http: HttpClient) {
    console.log('IngredientsService instantiated');
    console.log('API Endpoint: ' + config.apiEndpoint);
  }

  ingredientList: Ingredient[] = [
    {
      name: 'Flour',
      ingredientID: 1,
      lifespanDays: 200,
    },
    {
      name: 'Sugar',
      ingredientID: 3,
      lifespanDays: 120,
    },
    {
      name: 'Milk',
      ingredientID: 1,
      lifespanDays: 6,
    },
  ];

  getIngredients$ = this.http.get<Ingredient[]>(`/api/ingredients`).pipe(shareReplay(1));

  getIngredients() {
    return this.http.get<Ingredient[]>(`/api/ingredients`); // rewritten to 'http://localhost:3000/ingredients' by proxy.conf.json
  }

  addIngredient(newIngredient: Ingredient) {
    return this.http.post<IngredientResponse>(`/api/ingredients`, newIngredient);
  }

  deleteIngredient(ID: number) {
    console.log(`DELETING: ${ID}`);
    return this.http.delete(`/api/ingredients/${ID}`);
  }

  getPhotos() {
    const request = new HttpRequest<photos>('GET', 'https://jsonplaceholder.typicode.com/photos', {
      reportProgress: true,
    });
    return this.http.request(request);
  }
}
