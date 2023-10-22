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
      case 'log':
        return 23;
      default:
        return 0;
    }
  }
}
