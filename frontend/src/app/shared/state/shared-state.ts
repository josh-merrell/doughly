export interface SharedState {
  currentUrl: string;
}
export interface Sort {
  prop: string;
  sortOrderIndex: number;
  direction: string;
}

export enum SortEnum {
  alphabetical = 'alphabetical',
  numerical = 'numberical',
}


export enum SortRotateStateEnum {
  default = 'default',
  down = 'down',
  up = 'up',
}
export interface TableFullColumn {
  name: string;
  width: string;
  prop: string;
  sort?: SortEnum;
  sortRotateState?: SortRotateStateEnum;
  sortOrderState?: number | null;
  filterType: FilterTypeEnum;
}

export enum FilterTypeEnum {
  search = 'search',
  numRange = 'numRange',
  currencyRange = 'currencyRange',
  dateRange = 'dateRange',
  none = 'none',
}

export enum FilterOperatorEnum {
  contains = 'contains',
  doesNotContain = 'does not contain',
  is = 'is',
  isNot = 'is not',
  hasAnyValue = 'has any value',
  isAny = 'is any',
  isAnyOf = 'is any of',
  isEqualTo = 'is equal to',
  isNotEqualTo = 'is not equal to',
  isGreaterThan = 'is greater than',
  isLessThan = 'is less than',
  isBetween = 'is between',
  isNotBetween = 'is not between',
  isAfter = 'is after',
  isBefore = 'is before',
}
export interface CurrencyAmount {
  amount: number;
  currency: string;
}

export interface FilterOption {
  name: string;
  prop: string;
  type: FilterTypeEnum;
}
export interface Filter {
  id?: number;
  subject: string;
  operator: FilterOperatorEnum;
  filterType: FilterTypeEnum;
  operand1: null | string | string[] | number[] | number | Date | CurrencyAmount;
  operand2?: number | CurrencyAmount | Date;
}