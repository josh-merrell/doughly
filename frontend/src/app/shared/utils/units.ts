import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UnitService {
  constructor() {}

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
}
