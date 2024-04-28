import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class IDService {
  // **** DO NOT USE ANY VALUE BELOW 10 OR ABOVE 89 ****
  getIDtype(entityType: string): number {
    switch (entityType) {
      case 'recipe':
        return 11;
      case 'ingredient':
        return 12;
      case 'ingredientStock':
        return 13;
      case 'tool':
        return 14;
      case 'toolStock':
        return 15;
      case 'recipeIngredient':
        return 16;
      case 'recipeTool':
        return 17;
      case 'step':
        return 18;
      case 'recipeStep':
        return 19;
      case 'recipeCategory':
        return 20;
      case 'recipeComponent':
        return 21;
      case 'person':
        return 22;
      case 'friendship':
        return 23;
      case 'followship':
        return 24;
      case 'recipeSubscription':
        return 25;
      case 'shoppingList':
        return 26;
      case 'shoppingListIngredient':
        return 27;
      case 'shoppingListRecipe':
        return 28;
      case 'kitchenLog':
        return 70;
      case 'recipeLog':
        return 71;
      case 'userLog':
        return 72;
      case 'recipeFeedback':
        return 73;
      case 'shoppingLog':
        return 74;
      case 'message':
        return 75;
      default:
        return 0;
    }
  }
}
