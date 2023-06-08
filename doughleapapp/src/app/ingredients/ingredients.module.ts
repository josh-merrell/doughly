import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IngredientsRoutingModule } from './ingredients-routing.module';
import { IngredientsAddComponent } from './ingredients-add/ingredients-add.component';
import { IngredientsComponent } from './ingredients.component';
import { IngredientsListComponent } from './ingredients-list/ingredients-list.component';
import { IngredientDetailsComponent } from './ingredient-details/ingredient-details.component';
import { FormsModule } from '@angular/forms';
import { IngredientEditModule } from './ingredient-edit/ingredient-edit.module';

@NgModule({
  declarations: [IngredientsComponent, IngredientsListComponent, IngredientDetailsComponent, IngredientsAddComponent],
  imports: [CommonModule, IngredientEditModule, IngredientsRoutingModule, FormsModule],
})
export class IngredientsModule {}
