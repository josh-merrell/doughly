import { Component } from '@angular/core';
import { Ingredient } from '../ingredients';
import { IngredientsService } from '../services/ingredients.service';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'dl-ingredients-add',
  templateUrl: './ingredients-add.component.html',
})
export class IngredientsAddComponent {
  ingredient: Ingredient = {
    name: '',
    lifespanDays: 0,
    brand: '',
    purchaseUnit: '',
    gramRatio: 0,
  };

  constructor(private ingredientsService: IngredientsService) { };

  addIngredient(ingredientForm: NgForm) {
    console.log(`SUBMITTING INGREDIENT: `);
    this.ingredientsService.addIngredient(this.ingredient).subscribe((ingredient) => {
      if (ingredient) {
        console.log(`SUCCESSFULLY ADDED INGREDIENT: ${ingredient.ingredientID}`);
        ingredientForm.reset();
      }
    });
  }
}