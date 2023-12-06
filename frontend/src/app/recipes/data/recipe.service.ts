import { Injectable, WritableSignal, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Observable,
  combineLatest,
  forkJoin,
  map,
  of,
  switchMap,
  take,
} from 'rxjs';
import { environment } from 'src/environments/environment';
import { Store, select } from '@ngrx/store';
import { selectRecipes } from '../state/recipe/recipe-selectors';
import {
  Recipe,
  ShoppingList,
  ShoppingListIngredient,
} from '../state/recipe/recipe-state';
import { selectRecipeCategories } from '../state/recipe-category/recipe-category-selectors';
import { RecipeCategory } from '../state/recipe-category/recipe-category-state';
import { selectRecipeIngredientsByRecipeID } from '../state/recipe-ingredient/recipe-ingredient-selectors';
import { selectRecipeToolsByRecipeID } from '../state/recipe-tool/recipe-tool-selectors';
import { selectIngredientByID } from 'src/app/kitchen/feature/ingredients/state/ingredient-selectors';
import { selectIngredientStocksByIngredientID } from 'src/app/kitchen/feature/Inventory/feature/ingredient-inventory/state/ingredient-stock-selectors';
import { IDService } from 'src/app/shared/utils/ID';
import { RecipeUse, RecipeSubscription } from '../state/recipe/recipe-state';

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private API_URL = `${environment.BACKEND}/recipes`;
  private API_LOGS_URL = `${environment.BACKEND}/logs`;

  myUses: WritableSignal<any[]> = signal([]);
  allUses: WritableSignal<any[]> = signal([]);

  constructor(
    private http: HttpClient,
    private store: Store,
    private idService: IDService
  ) {}

  rows$: Observable<Recipe[]> = combineLatest([
    this.store.pipe(select(selectRecipes)),
    this.store.pipe(select(selectRecipeCategories)),
  ]).pipe(
    map(([recipes, recipeCategories]: [Recipe[], RecipeCategory[]]) => {
      return recipes.map((recipe) => {
        const recipeCategory = recipeCategories.find(
          (rc) => rc.recipeCategoryID === recipe.recipeCategoryID
        );
        if (!recipeCategory) {
          return {
            recipeID: recipe.recipeID,
            userID: recipe.userID,
            title: recipe.title,
            recipeCategoryID: 0,
            type: recipe.type,
            servings: recipe.servings,
            lifespanDays: recipe.lifespanDays,
            status: recipe.status,
            timePrep: recipe.timePrep,
            timeBake: recipe.timeBake,
            recipeCategoryName: `Other`,
            photoURL: recipe.photoURL,
          };
        }
        return {
          recipeID: recipe.recipeID,
          userID: recipe.userID,
          title: recipe.title,
          recipeCategoryID: recipe.recipeCategoryID,
          type: recipe.type,
          servings: recipe.servings,
          lifespanDays: recipe.lifespanDays,
          status: recipe.status,
          timePrep: recipe.timePrep,
          timeBake: recipe.timeBake,
          recipeCategoryName: recipeCategory.name,
          photoURL: recipe.photoURL,
        };
      });
    })
  );

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.API_URL);
  }

  getByID(recipeID: number): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/${recipeID}`);
  }

  getSubscriptions(): Observable<RecipeSubscription[]> {
    const results = this.http.get<any[]>(`${this.API_URL}/subscriptions`);
    return results;
  }
  // deleteSubscription(subscriptionID: number): Observable<any> {
  //   return this.http.delete<any>(
  //     `${this.API_URL}/subscriptions/${subscriptionID}`
  //   );
  // }
  getSubscriptionsByRecipeID(recipeID: number): Observable<RecipeSubscription[]> {
    return this.http.get<any[]>(`${this.API_URL}/${recipeID}/subscriptions`);
  }

  add(recipe: Recipe): Observable<Recipe> {
    const body = {
      IDtype: this.idService.getIDtype('recipe'),
      title: recipe.title,
      recipeCategoryID: recipe.recipeCategoryID,
      type: recipe.type,
      servings: recipe.servings,
      lifespanDays: recipe.lifespanDays,
      status: recipe.status,
      timePrep: recipe.timePrep,
      timeBake: recipe.timeBake,
      photoURL: recipe.photoURL,
    };
    return this.http.post<Recipe>(this.API_URL, body);
  }

  delete(recipeID: number): Observable<Recipe> {
    return this.http.delete<Recipe>(`${this.API_URL}/${recipeID}`);
  }

  update(recipe: Recipe): Observable<Recipe> {
    return this.http.patch<Recipe>(
      `${this.API_URL}/${recipe.recipeID}`,
      recipe
    );
  }

  getShoppingList(
    recipeID: number,
    date = new Date(),
  ): Observable<ShoppingList> {
    return this.store.pipe(
      select(selectRecipeIngredientsByRecipeID(recipeID)),
      switchMap((recipeIngredients) => {
        if (recipeIngredients.length === 0) {
          return of([[]]);
        }
        const ingredientObservables = recipeIngredients.map(
          (recipeIngredient) => {
            return combineLatest([
              of(recipeIngredient),
              this.store.pipe(
                select(selectIngredientByID(recipeIngredient.ingredientID)),
                take(1)
              ),
              this.store.pipe(
                select(
                  selectIngredientStocksByIngredientID(
                    recipeIngredient.ingredientID
                  )
                ),
                take(1)
              ),
            ]);
          }
        );

        return forkJoin(ingredientObservables);
      }),
      map((ingredientsData) => {
        if (ingredientsData.length === 1 && ingredientsData[0].length === 0) {
          return { ingredients: [] }; // Return default ShoppingList when no ingredients are found
        }
        const shoppingList: ShoppingListIngredient[] = [];

        for (const [
          recipeIngredient,
          ingredient,
          ingredientStocks,
        ] of ingredientsData) {
          if (!ingredient || !recipeIngredient || !ingredientStocks.length) {
            return { ingredients: [] }; // Return default ShoppingList when no ingredients are found
          }
          let neededGrams =
            (recipeIngredient.measurement /
              recipeIngredient.purchaseUnitRatio) *
            ingredient.gramRatio;
          for (const stock of ingredientStocks) {
            const expirationDate = new Date(stock.purchasedDate);
            expirationDate.setDate(
              expirationDate.getDate() + ingredient.lifespanDays
            );
            if (expirationDate < date) {
              continue;
            }
            neededGrams -= stock.grams;
            if (neededGrams <= 0) {
              break;
            }
          }
          if (neededGrams > 0) {
            const quantity =
              Math.ceil((neededGrams / ingredient.gramRatio) * 100) / 100;
            // if 'date' is later than current day plus the lifespan of the ingredient, then purchaseAfter is 'date' minus lifespan days of ingredient, otherwise purchaseAfter is null
            let purchaseAfter =
              date >
              new Date(
                new Date().setDate(
                  new Date().getDate() + ingredient.lifespanDays
                )
              )
                ? new Date(
                    new Date(date).setDate(
                      date.getDate() - ingredient.lifespanDays
                    )
                  ).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                : null;

            shoppingList.push({
              type: 'ingredient',
              ingredientName: ingredient.name,
              quantity,
              unit: ingredient.purchaseUnit,
              purchaseAfter: purchaseAfter,
            });
          }
        }
        return { ingredients: shoppingList };
      })
    );
  }

  loadUses(recipeID: number, datestring: string): void {
    this.retrieveUsesFromDB(recipeID, datestring, 'true');
    this.retrieveUsesFromDB(recipeID, datestring, 'false');
  }

  retrieveUsesFromDB(recipeID: number, datestring: string, onlyMe: string) {
    if (!recipeID) return;
    let params = new HttpParams()
      .set('recipeID', recipeID)
      .set('createdAfter', datestring)
      .set('onlyMe', onlyMe);

    this.http
      .get<any>(`${this.API_LOGS_URL}/recipeFeedback`, { params })
      .subscribe((logs) => {
        if (onlyMe === 'true') this.myUses.set(logs);
        if (onlyMe === 'false') this.allUses.set(logs);
      });
  }

  getUses(onlyMe = 'false'): number {
    const usageLogs = onlyMe === 'true' ? this.myUses : this.allUses;
    return usageLogs ? usageLogs.length : 0;
  }
  useRecipe(
    recipeID: number,
    satisfaction: number,
    difficulty: number,
    note: string
  ): Observable<RecipeUse> {
    const body: any = {
      satisfaction: satisfaction,
      difficulty: difficulty,
    };
    if (note) body['note'] = note;

    return this.http.post<RecipeUse>(`${this.API_URL}/use/${recipeID}`, body);
  }

  constructRecipe(constructBody): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/constructed`, constructBody);
  }

  syncRecipe(recipeID: number, sourceRecipeID: number): Observable<any> {
    const body = {
      sourceRecipeID: sourceRecipeID,
      childRecipeID: recipeID,
    }
    return this.http.post<any>(`${this.API_URL}/sync`, body);
  }

  deleteSubscription(subscriptionID: number): Observable<any> {
    return this.http.delete<any>(
      `${this.API_URL}/subscriptions/${subscriptionID}`
    );
  }
}
