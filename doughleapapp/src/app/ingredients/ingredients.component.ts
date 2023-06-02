import { Component } from '@angular/core';
import { Ingredient } from './ingredients';

@Component({
  selector: 'dl-ingredients',
  templateUrl: './ingredients.component.html',
})
export class IngredientsComponent {
  title = 'Ingredients';
  typesVisable = false;

  ingredients: Ingredient[] = [
    {
      name: 'Flour',
      quantity: 1,
      expire: new Date('2023-08-10'),
    },
    {
      name: 'Sugar',
      quantity: 3,
      expire: new Date('2023-07-13'),
    },
    {
      name: 'Milk',
      quantity: 1,
      expire: new Date('2023-06-13'),
    }
  ];

  ingredientsLength = this.ingredients.length;

  hideTypes() {
    this.typesVisable = !this.typesVisable;
  }
}
