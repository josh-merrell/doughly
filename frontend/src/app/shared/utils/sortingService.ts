import { Injectable } from '@angular/core';
import { Sort } from '../state/shared-state';

@Injectable({
  providedIn: 'root',
})
export class SortingService {
  constructor() {}
  applySorts(rows: any[], sorts: Sort[]): any[] {
    if (sorts.length === 0) {
      return rows;
    }

    // Clone the rows array to prevent mutation of the original
    let sortedRows = [...rows];

    // Sort sorts array by sortOrderIndex for applying them in correct order
    sorts.sort((a, b) => a.sortOrderIndex - b.sortOrderIndex);

    sortedRows.sort((a, b) => {
      for (let sort of sorts) {
        let value1 = a[sort.prop];
        let value2 = b[sort.prop];

        if (typeof value1 === 'string') {
          value1 = value1.toLowerCase();
          value2 = value2.toLowerCase();
        }

        if (value1 instanceof Date) {
          value1 = value1.getTime();
          value2 = value2.getTime();
        }

        if (value1 !== value2) {
          let comparison = 0;
          if (value1 < value2) {
            comparison = -1;
          } else if (value1 > value2) {
            comparison = 1;
          }
          // reverse comparison if direction is desc
          return sort.direction === 'desc' ? -comparison : comparison;
        }
      }
      // if got through the loop without returning (all sort props are equal)
      return 0;
    });
    return sortedRows;
  }
}