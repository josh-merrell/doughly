import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Store } from '@ngrx/store';
import { selectSteps } from '../state/step/step-selectors';
import { Step } from '../state/step/step-state';
import { IDService } from 'src/app/shared/utils/ID';

@Injectable({
  providedIn: 'root',
})
export class StepService {
  private API_URL = `${environment.BACKEND}/steps`;

  constructor(
    private http: HttpClient,
    private store: Store,
    private idService: IDService
  ) {}

  rows$: Observable<Step[]> = this.store.select(selectSteps).pipe(
    map((steps: Step[]) => {
      return steps.map((step: Step) => {
        return {
          stepID: step.stepID,
          title: step.title,
          description: step.description,
        };
      });
    })
  );

  getAll(): Observable<Step[]> {
    return this.http.get<Step[]>(this.API_URL);
  }

  getByID(stepID: number): Observable<Step> {
    return this.http.get<Step>(`${this.API_URL}/${stepID}`);
  }

  add(step: Step): Observable<Step> {
    const body = {
      IDtype: this.idService.getIDtype('step'),
      title: step.title,
      description: step.description,
    };
    return this.http.post<Step>(this.API_URL, body);
  }

  update(step: Step): Observable<Step> {
    return this.http.patch<Step>(`${this.API_URL}/${step.stepID}`, step);
  }

  delete(stepID: number): Observable<Step> {
    return this.http.delete<Step>(`${this.API_URL}/${stepID}`);
  }
}
