import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IngredientEditComponent } from './ingredient-edit.component';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [CommonModule, ReactiveFormsModule],
  declarations: [IngredientEditComponent],
  exports: [IngredientEditComponent],
})
export class IngredientEditModule {}
