export interface SharedShoppingList {
  sharedShoppingListID: number;
}

export interface SharedShoppingListState {
  sharedShoppingLists: SharedShoppingList[];
  adding: boolean;
  deleting: boolean;
  updating: boolean;
  loading: boolean;
  error: any;
}
