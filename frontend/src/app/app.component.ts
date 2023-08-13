import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppHeaderComponent } from './header/feature/app-header.component';
import { Router } from '@angular/router';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { Store } from '@ngrx/store';
import { IngredientActions } from './kitchen/feature/ingredients/state/ingredient-actions';
import { IngredientStockActions } from './kitchen/feature/Inventory/feature/ingredient-inventory/state/ingredient-stock-actions';
import { EmployeeActions } from './employees/state/employee-actions';
import { ToolActions } from './kitchen/feature/tools/state/tool-actions';
import { RecipeActions } from './recipes/state/recipe/recipe-actions';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterModule,
    AppHeaderComponent,
    StoreDevtoolsModule,
  ],
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'frontend';

  constructor(private router: Router, private store: Store) {}

  ngOnInit() {
    //hydrate ingredients, ingredient stocks, employees, recipes
    this.store.dispatch(IngredientActions.loadIngredients());
    this.store.dispatch(IngredientStockActions.loadIngredientStocks());
    this.store.dispatch(EmployeeActions.loadEmployees());
    this.store.dispatch(ToolActions.loadTools());
    this.store.dispatch(RecipeActions.loadRecipes());
  }
}
