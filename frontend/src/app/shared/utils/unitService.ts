import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UnitService {
  constructor(private http: HttpClient) {}

  singular(value: string) {
    if (value[value.length - 1] === 's') {
      if (
        value === 'boxes' ||
        value === 'bunches' ||
        value === 'pinches' ||
        value === 'dashes'
      ) {
        return value.slice(0, -2);
      } else {
        return value.slice(0, -1);
      }
    }
    return value;
  }

  getUnitRatio(
    material: string,
    unitA: string,
    unitB: string
  ): Observable<any> {
    return this.http.get(
      `${environment.BACKEND}/unitRatios/unitRatio?material=${material}&unitA=${unitA}&unitB=${unitB}`
    );
  }

  addUnitRatio(material: string, unitA: string, unitB: string, ratio: number): Observable<any> {
    console.log()
    return this.http.post(`${environment.BACKEND}/unitRatios/`, {
      material,
      unitA,
      unitB,
      ratio,
    });
  }
}
