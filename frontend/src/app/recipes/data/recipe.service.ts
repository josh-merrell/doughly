import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  combineLatest,
  defaultIfEmpty,
  map,
  of,
  switchMap,
  take,
  tap,
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

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private API_URL = `${environment.BACKEND}/recipes`;

  constructor(private http: HttpClient, private store: Store) {}

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
            title: recipe.title,
            recipeCategoryID: 0,
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
          title: recipe.title,
          recipeCategoryID: recipe.recipeCategoryID,
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

  add(recipe: Recipe): Observable<Recipe> {
    return this.http.post<Recipe>(this.API_URL, recipe);
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

  getShoppingList(recipeID: number): Observable<ShoppingList> {
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
                select(selectIngredientByID(recipeIngredient.ingredientID))
              ),
              this.store.pipe(
                select(
                  selectIngredientStocksByIngredientID(
                    recipeIngredient.ingredientID
                  )
                )
              ),
            ]);
          }
        );

        return combineLatest(ingredientObservables);
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
          let neededGrams =
            (recipeIngredient.measurement /
            recipeIngredient.purchaseUnitRatio) *
            ingredient.gramRatio;
          for (const stock of ingredientStocks) {
            neededGrams -= stock.grams;
            if (neededGrams <= 0) {
              break;
            }
          }
          if (neededGrams > 0) {
            const quantity =
              Math.ceil((neededGrams / ingredient.gramRatio) * 100) / 100;
            shoppingList.push({
              type: 'ingredient',
              ingredientName: ingredient.name,
              quantity,
              unit: ingredient.purchaseUnit,
            });
          }
        }
        return { ingredients: shoppingList };
      })
    );
  }
}
