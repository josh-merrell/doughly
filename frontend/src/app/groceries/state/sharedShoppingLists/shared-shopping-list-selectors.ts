export const selectSharedShoppingLists = (state: any) =>
  state.sharedShoppingList.sharedShoppingLists;
export const selectDeleting = (state: any) => state.sharedShoppingList.deleting;
export const selectError = (state: any) => state.sharedShoppingList.error;
export const selectUpdating = (state: any) => state.sharedShoppingList.updating;
export const selectLoading = (state: any) => state.sharedShoppingList.loading;
