import { Component, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/shared/utils/authenticationService';
import { TableFullComponent } from 'src/app/shared/ui/dl-table-full/dl-table-full.component';
import { IngredientsComponent } from 'src/app/ingredients/feature/ingredients/ingredients.component';
import { IngredientStock, IngredientStockRow } from './state/ingredient-stock-state';
import { Observable } from 'rxjs';
import { Ingredient } from 'src/app/ingredients/state/ingredient-state';
import { Store, select } from '@ngrx/store';
import { selectIngredients } from 'src/app/ingredients/state/ingredient-selectors';
import { selectIngredientStocks } from './state/ingredient-stock-selectors';
import { IngredientStockService } from './data/ingredient-stock.service';
import { EditIngredientStockModalComponent } from './ui/edit-ingredient-stock-modal/edit-ingredient-stock-modal.component';
import { AddIngredientStockModalComponent } from './ui/add-ingredient-stock-modal/add-ingredient-stock-modal.component';

@Component({
  selector: 'dl-ingredient-inventory-table',
  standalone: true,
  imports: [
    CommonModule,
    TableFullComponent,
    IngredientsComponent,
    EditIngredientStockModalComponent,
    AddIngredientStockModalComponent,
  ],
  templateUrl: './ingredient-inventory-table.component.html',
})
export class IngredientInventoryTableComponent {
  editModalComponent: Type<any> = EditIngredientStockModalComponent;
  addModalComponent: Type<any> = AddIngredientStockModalComponent;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private store: Store,
    private ingredientStockService: IngredientStockService
  ) {}

  title = 'Ingredient Inventory';
  heading_phrase = 'Multiple entries may exist for each Ingredient.';
  button_title = 'Add Inventory';
  IDKey = 'ingredientStockID';
  updateSuccessMessage = 'Updated Ingredient Stock with ID:';
  updateFailureMessage = 'Failed to update Ingredient Stock with ID:';
  addSuccessMessage = 'Added Ingredient Stock with ID:';
  addFailureMessage = 'Failed to add Ingredient Stock. Try again later.';
  columns = [
    { name: 'Name', prop: 'name' },
    { name: 'Brand', prop: 'brand' },
    { name: 'Quantity', prop: 'quantity' },
    { name: 'Expiration', prop: 'expiration' },
  ];

  rows$: Observable<IngredientStockRow[]> = this.ingredientStockService.rows$;

  ngOnInit() {}
}
