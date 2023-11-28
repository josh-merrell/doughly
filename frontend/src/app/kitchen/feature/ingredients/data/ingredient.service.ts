import { Injectable, WritableSignal, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, withLatestFrom } from 'rxjs';
import { Ingredient } from '../state/ingredient-state';
import { environment } from 'src/environments/environment';
import { Store } from '@ngrx/store';
import { selectIngredients } from '../state/ingredient-selectors';
import { IDService } from 'src/app/shared/utils/ID';
import { selectIngredientStocks } from '../../Inventory/feature/ingredient-inventory/state/ingredient-stock-selectors';
import { IngredientStock } from '../../Inventory/feature/ingredient-inventory/state/ingredient-stock-state';

@Injectable({
  providedIn: 'root',
})
export class IngredientService {
  private API_URL = `${environment.BACKEND}/ingredients`;
  public enhancedRows$ = new BehaviorSubject<Ingredient[]>([]);

  //** NEW, USING SIGNALS
  private ingredientStocks: WritableSignal<IngredientStock[]> = signal([]);
  public enhancedIngredients = computed(() => {
    const stocks = this.ingredientStocks();
    
  });

  constructor(
    private http: HttpClient,
    private store: Store,
    private idService: IDService
  ) {}

  rows$: Observable<Ingredient[]> = this.store.select(selectIngredients).pipe(
    map((ingredients: Ingredient[]) => {
      return ingredients.map((ingredient: Ingredient) => {
        return {
          ingredientID: ingredient.ingredientID,
          name: ingredient.name,
          brand: ingredient.brand,
          gramRatio: ingredient.gramRatio,
          purchaseUnit: ingredient.purchaseUnit,
          lifespanDays: ingredient.lifespanDays,
        };
      });
    })
  );

  addStockTotals(ingredients: Ingredient[]): void {
    this.store.select(selectIngredientStocks).subscribe((ingredientStocks) => {
      const updatedIngredients = ingredients.map((ingredient) => {
        const matchingStocks = ingredientStocks.filter(
          (stock: any) => stock.ingredientID === ingredient.ingredientID
        );
        const totalGrams = matchingStocks.reduce(
          (sum: number, stock: any) => sum + stock.grams,
          0
        );
        const totalStock = totalGrams / ingredient.gramRatio;

        return {
          ...ingredient,
          totalStock: totalStock,
        };
      });
      this.enhancedRows$.next(updatedIngredients);
    });
  }

  getAll(): Observable<Ingredient[]> {
    return this.http.get<Ingredient[]>(this.API_URL);
  }

  getByID(ingredientID: number): Observable<Ingredient> {
    return this.http.get<Ingredient>(`${this.API_URL}/${ingredientID}`);
  }

  add(ingredient: Ingredient): Observable<Ingredient> {
    const IDtype = this.idService.getIDtype('ingredient');
    const body = {
      IDtype,
      name: ingredient.name,
      brand: ingredient.brand,
      gramRatio: ingredient.gramRatio,
      purchaseUnit: ingredient.purchaseUnit,
      lifespanDays: ingredient.lifespanDays,
    };
    return this.http.post<Ingredient>(this.API_URL, body);
  }

  delete(ingredientID: number): Observable<Ingredient> {
    return this.http.delete<Ingredient>(`${this.API_URL}/${ingredientID}`);
  }

  update(ingredient: Ingredient): Observable<Ingredient> {
    return this.http.patch<Ingredient>(
      `${this.API_URL}/${ingredient.ingredientID}`,
      ingredient
    );
  }

  getTotalInStock(): Observable<number> {
    return this.store.select(selectIngredientStocks).pipe(
      withLatestFrom(this.rows$),
      map(([ingredientStocks, ingredients]) => {
        const inStock = ingredients.filter((ingredient) =>
          ingredientStocks.some(
            (stock: any) => stock.ingredientID === ingredient.ingredientID
          )
        ).length;

        return inStock;
      })
    );
  }
}
