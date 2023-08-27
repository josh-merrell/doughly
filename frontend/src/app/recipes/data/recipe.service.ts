import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, combineLatest, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Store, select } from '@ngrx/store';
import { selectRecipes } from '../state/recipe/recipe-selectors';
import { Recipe, RecipeStatus } from '../state/recipe/recipe-state';
import { selectRecipeCategories } from '../state/recipe-category/recipe-category-selectors';
import { RecipeCategory } from '../state/recipe-category/recipe-category-state';
import { RecipeEffects } from '../state/recipe/recipe-effects';

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
            recipeCategoryName: `RecipeCategoryID:${recipe.recipeCategoryID} missing, can't get details for RecipeID:${recipe.recipeID}`,
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
}