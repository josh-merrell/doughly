import { Injectable } from '@angular/core';
import { Filter, Sort } from '../state/shared-state';
import { FilterOperatorEnum } from '../state/shared-state';

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  constructor() {}
  applyFilters(rows: any[], filters: Filter[]): any[] {
    return rows.filter((row) =>
      //switch case for different filter.filterType values, call corresponding function
      filters.every((filter) => {
        switch (filter.filterType) {
          case 'search':
            return this.passesSearchFilter(row, filter);
          case 'numRange':
            return this.passesNumRangeFilter(row, filter);
          case 'currencyRange':
            return this.passesCurrencyRangeFilter(row, filter);
          case 'dateRange':
            return this.passesDateRangeFilter(row, filter);
          case 'none':
            return true;
          default:
            return false;
        }
      })
    );
  }

  private passesSearchFilter(row: any, filter: Filter): boolean {
    let value = row[filter.subject];
    //convert value to compare and filter.operand1 to lowercase strings
    if (typeof value === 'string') {
      value = value.toLowerCase();
    }
    if (typeof filter.operand1 === 'string') {
      filter.operand1 = filter.operand1.toLowerCase();
    }
    //switch case for different filter.operator values
    switch (filter.operator) {
      case FilterOperatorEnum.is:
        return value === filter.operand1;
      case FilterOperatorEnum.isNot:
        return value !== filter.operand1;
      case FilterOperatorEnum.contains:
        return value.includes(filter.operand1);
      case FilterOperatorEnum.doesNotContain:
        return !value.includes(filter.operand1);
      case FilterOperatorEnum.hasAnyValue:
        return value !== null;
      default:
        return false;
    }
  }

  private passesNumRangeFilter(row: any, filter: Filter): boolean {
    let value = row[filter.subject];
    //switch case for different filter.operator values
    switch (filter.operator) {
      case FilterOperatorEnum.isAny:
        return value !== null;
      case FilterOperatorEnum.isEqualTo:
        return value === filter.operand1;
      case FilterOperatorEnum.isNotEqualTo:
        return value !== filter.operand1;
      case FilterOperatorEnum.isGreaterThan:
        return !filter.operand1 ? false : value > filter.operand1;
      case FilterOperatorEnum.isLessThan:
        return !filter.operand1 ? false : value < filter.operand1;
      case FilterOperatorEnum.isBetween:
        return !filter.operand1 || !filter.operand2
          ? false
          : value > filter.operand1 && value < filter.operand2;
      case FilterOperatorEnum.isNotBetween:
        return !filter.operand1 || !filter.operand2
          ? false
          : value < filter.operand1 || value > filter.operand2;
      default:
        return false;
    }
  }

  private passesCurrencyRangeFilter(row: any, filter: Filter): boolean {
    //not yet implemented
    return true;
  }

  private passesDateRangeFilter(row: any, filter: Filter): boolean {
    let value = row[filter.subject];
    //convert value and operand1 to Date objects without any time information
    if (value instanceof Date) {
      value = new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }
    if (filter.operand1 instanceof Date) {
      filter.operand1 = new Date(
        filter.operand1.getFullYear(),
        filter.operand1.getMonth(),
        filter.operand1.getDate()
      );
    }

    //switch case for different filter.operator values
    switch (filter.operator) {
      case FilterOperatorEnum.is:
        return (
          (value as Date).getTime() === (filter.operand1 as Date).getTime()
        );
      case FilterOperatorEnum.isNot:
        return (
          (value as Date).getTime() !== (filter.operand1 as Date).getTime()
        );
      case FilterOperatorEnum.isAfter:
        return (value as Date).getTime() > (filter.operand1 as Date).getTime();
      case FilterOperatorEnum.isBefore:
        return (value as Date).getTime() < (filter.operand1 as Date).getTime();
      case FilterOperatorEnum.isBetween:
        return (
          (value as Date).getTime() > (filter.operand1 as Date).getTime() &&
          (value as Date).getTime() < (filter.operand2 as Date).getTime()
        );
      case FilterOperatorEnum.isNotBetween:
        return (
          (value as Date).getTime() < (filter.operand1 as Date).getTime() ||
          (value as Date).getTime() > (filter.operand2 as Date).getTime()
        );
      case FilterOperatorEnum.hasAnyValue:
        return value !== null;
      default:
        return false;
    }
  }
}
