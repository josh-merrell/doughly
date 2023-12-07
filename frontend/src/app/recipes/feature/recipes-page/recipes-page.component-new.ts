import {
  Component,
  WritableSignal,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { RouterOutlet } from '@angular/router';
import { DiscoverRecipesComponent } from './feature/discover/discover-recipes.component';
import { RecipeListComponent } from './feature/list/recipe-list.component';
import { RecipeActions } from '../../state/recipe/recipe-actions';
import { RecipeCategoryActions } from '../../state/recipe-category/recipe-category-actions';
import { RecipeIngredientActions } from '../../state/recipe-ingredient/recipe-ingredient-actions';
import { RecipeToolActions } from '../../state/recipe-tool/recipe-tool-actions';
import { RecipeStepActions } from '../../state/recipe-step/recipe-step-actions';
import { Store } from '@ngrx/store';

@Component({
  selector: 'dl-recipes-page-new',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    DiscoverRecipesComponent,
    RecipeListComponent,
  ],
  templateUrl: './recipes-page.component-new.html',
})
export class RecipesPageNewComponent {
  public view: WritableSignal<string> = signal('created');

  constructor(public dialog: MatDialog, private store: Store) {}

  ngOnInit() {
  }

  setView(view: string) {
    this.view.set(view);
  }
}