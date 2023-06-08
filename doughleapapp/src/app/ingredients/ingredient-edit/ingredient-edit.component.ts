import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'dl-ingredient-edit',
  templateUrl: './ingredient-edit.component.html',
})
export class IngredientEditComponent {
  editIngredientForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.editIngredientForm = this.fb.group({
      name: new FormControl(''),
      lifespanDays: new FormControl(''),
      purchaseUnit: new FormControl(''),
      gramRatio: new FormControl(''),
      brand: new FormControl(''),
    });
  }
}

/**
export class EditIngredient {
  name: string;
  lifespanDays: number;
  purchaseUnit: string;
  gramRatio: number;
  brand: string;
}
**/
