import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IngredientsAddComponent } from './ingredients-add/ingredients-add.component';
import { IngredientDetailsComponent } from './ingredient-details/ingredient-details.component';
import { IngredientsComponent } from './ingredients.component';
import { IngredientEditComponent } from './ingredient-edit/ingredient-edit.component';

const routes: Routes = [
  {
    path: 'ingredients',
    component: IngredientsComponent,
    children: [
      { path: 'add', component: IngredientsAddComponent },
      { path: 'edit', component: IngredientEditComponent },
    ],
  },
  { path: 'ingredients/:id', component: IngredientDetailsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class IngredientsRoutingModule {}
