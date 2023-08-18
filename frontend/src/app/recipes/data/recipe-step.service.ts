import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Store } from '@ngrx/store';
import { selectRecipeSteps } from '../state/recipe-step/recipe-step-selectors';
import { RecipeStep } from '../state/recipe-step/recipe-step-state';

@Injectable({
  providedIn: 'root',
})
export class RecipeStepService {
  private API_URL = `${environment.BACKEND}/steps/recipe`;

  constructor(private http: HttpClient, private store: Store) {}

  rows$: Observable<RecipeStep[]> = this.store.select(selectRecipeSteps).pipe(
    map((recipeSteps: RecipeStep[]) => {
      return recipeSteps.map((recipeStep: RecipeStep) => {
        return {
          recipeStepID: recipeStep.recipeStepID,
          recipeID: recipeStep.recipeID,
          stepID: recipeStep.stepID,
          sequence: recipeStep.sequence,
        };
      });
    })
  );

  getAll(): Observable<RecipeStep[]> {
    return this.http.get<RecipeStep[]>(this.API_URL);
  }

  getByID(recipeStepID: number): Observable<RecipeStep> {
    return this.http.get<RecipeStep>(`${this.API_URL}/${recipeStepID}`);
  }

  add(recipeStep: RecipeStep): Observable<RecipeStep> {
    return this.http.post<RecipeStep>(this.API_URL, recipeStep);
  }

  update(recipeStep: RecipeStep): Observable<RecipeStep> {
    return this.http.patch<RecipeStep>(
      `${this.API_URL}/${recipeStep.recipeStepID}`,
      recipeStep
    );
  }

  delete(recipeStepID: number): Observable<RecipeStep> {
    return this.http.delete<RecipeStep>(`${this.API_URL}/${recipeStepID}`);
  }
}
