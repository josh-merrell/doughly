import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Ingredient, IngredientState } from '../../state/ingredient-state';
import { IngredientActions } from '../../state/ingredient-actions';
import { IngredientReducer } from '../../state/ingredient-reducers';
import { selectIngredients } from '../../state/ingredient-selectors';
import { Observable } from 'rxjs';
import { Store, select } from '@ngrx/store';

@Component({
  selector: 'dl-ingredients',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ingredients.component.html',
})
export class IngredientsComponent {
  ingredients$!: Observable<Ingredient[]>;

  constructor(private store: Store<IngredientState>) {}

  ngOnInit() {
    this.ingredients$ = this.store.pipe(select(selectIngredients));
  }
}
