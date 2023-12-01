import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Store } from '@ngrx/store';
import { selectRecipeSteps } from '../state/recipe-step/recipe-step-selectors';
import { RecipeStep } from '../state/recipe-step/recipe-step-state';
import { IDService } from 'src/app/shared/utils/ID';

@Injectable({
  providedIn: 'root',
})
export class RecipeStepService {
  private API_URL = `${environment.BACKEND}/steps/recipe`;
  private API_URL_RECIPE = `${environment.BACKEND}/recipes`;

  constructor(
    private http: HttpClient,
    private store: Store,
    private idService: IDService
  ) {}

  rows$: Observable<RecipeStep[]> = this.store.select(selectRecipeSteps).pipe(
    map((recipeSteps: RecipeStep[]) => {
      return recipeSteps.map((recipeStep: RecipeStep) => {
        return {
          recipeStepID: recipeStep.recipeStepID,
          recipeID: recipeStep.recipeID,
          stepID: recipeStep.stepID,
          sequence: recipeStep.sequence,
          photoURL: recipeStep.photoURL,
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

  getByRecipeID(recipeID: number): Observable<RecipeStep[]> {
    return this.http.get<RecipeStep[]>(`${this.API_URL_RECIPE}/${recipeID}/steps`);
  }

  add(recipeStep: RecipeStep): Observable<RecipeStep> {
    const body = {
      IDtype: this.idService.getIDtype('recipeStep'),
      recipeID: recipeStep.recipeID,
      stepID: recipeStep.stepID,
      sequence: recipeStep.sequence,
      photoURL: recipeStep.photoURL,
    };
    return this.http.post<RecipeStep>(this.API_URL, body);
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
