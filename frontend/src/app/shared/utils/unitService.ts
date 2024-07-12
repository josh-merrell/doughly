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
    if (!value || value === '') return value;
    if (value[value.length - 1] === 's') {
      if (value === 'leaves' || value === 'loaves') {
        return value.slice(0, -3) + 'f';
      } else if (value === 'weightOunces') {
        return 'oz';
      } else if (value === 'fluidOunces') {
        return 'fl oz';
      } else if (
        value === 'boxes' ||
        value === 'bunches' ||
        value === 'pinches' ||
        value === 'dashes'
      ) {
        return value.slice(0, -2);
      } else {
        return value.slice(0, -1);
      }
    } else if (value === 'weightOunce') {
      return 'oz';
    } else if (value === 'fluidOunce') {
      return 'fl oz';
    }
    return value;
  }

  plural(value: string) {
    if (!value || value === '') return value;
    if (value[value.length - 1] !== 's') {
      if (value === 'leaf' || value === 'loaf') {
        return value.slice(0, -1) + 'ves';
      } else if (value === 'weightOunce') {
        return 'oz';
      } else if (value === 'fluidOunce') {
        return 'fl oz';
      } else if (
        value === 'box' ||
        value === 'bunch' ||
        value === 'pinch' ||
        value === 'dash'
      ) {
        return value + 'es';
      } else {
        return value + 's';
      }
    } else if (value === 'weightOunce') {
      return 'oz';
    } else if (value === 'fluidOunce') {
      return 'fl oz';
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

  addUnitRatio(
    material: string,
    unitA: string,
    unitB: string,
    ratio: number
  ): Observable<any> {
    console.log();
    return this.http.post(`${environment.BACKEND}/unitRatios/`, {
      material,
      unitA,
      unitB,
      ratio,
    });
  }
}
