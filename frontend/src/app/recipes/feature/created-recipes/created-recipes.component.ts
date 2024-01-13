import { Component } from '@angular/core';
import { RecipeListComponent } from '../recipes-page/feature/list/recipe-list.component';


@Component({
  selector: 'dl-created-recipes',
  standalone: true,
  imports: [RecipeListComponent],
  templateUrl: './created-recipes.component.html',
})
export class CreatedRecipesComponent {}
