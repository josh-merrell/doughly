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
  numberical = 'numberical',
}

export enum FilterEnum {
  search = 'search',
  numRange = 'numRange',
  dateRange = 'dateRange',
  none = 'none',
}

export enum SortRotateStateEnum {
  default = 'default',
  down = 'down',
  up = 'up',
}
export interface TableFullColumn {
  name: string;
  prop: string;
  sort?: SortEnum;
  sortRotateState?: SortRotateStateEnum;
  sortOrderState?: number | null;
  filter: FilterEnum;
}