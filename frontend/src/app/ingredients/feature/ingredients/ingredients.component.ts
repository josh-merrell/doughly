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
  styleUrls: ['./ingredients.component.css'],
})
export class IngredientsComponent {
  ingredients$!: Observable<Ingredient[]>;

  constructor(private store: Store<IngredientState>) {}

  ngOnInit() {
    this.store.dispatch(IngredientActions.loadIngredients());
    this.store.pipe(select(selectIngredients)).subscribe((state) => {
      console.log(`STATE: ${Object.keys(state)}, STATE ARRAY PROPERTY:`);
    });
    this.ingredients$ = this.store.pipe(select(selectIngredients));
  }
}
