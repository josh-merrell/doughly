import { Component } from '@angular/core';
import { RecipeListComponent } from '../recipes-page/feature/list/recipe-list.component';

@Component({
  selector: 'dl-subscribed-recipes',
  standalone: true,
  imports: [RecipeListComponent],
  templateUrl: './subscribed-recipes.component.html',
})
export class SubscribedRecipesComponent {}
