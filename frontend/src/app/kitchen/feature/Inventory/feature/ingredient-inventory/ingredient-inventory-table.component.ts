import { Component, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/shared/utils/authenticationService';
import { TableFullComponent } from 'src/app/shared/ui/dl-table-full/dl-table-full.component';
import {
  IngredientStock,
  IngredientStockRow,
} from './state/ingredient-stock-state';
import { Observable } from 'rxjs';
import { Ingredient } from 'src/app/kitchen/feature/ingredients/state/ingredient-state';
import { Store, select } from '@ngrx/store';
import { selectIngredients } from 'src/app/kitchen/feature/ingredients/state/ingredient-selectors';
import { selectIngredientStocks } from './state/ingredient-stock-selectors';
import { IngredientStockService } from './data/ingredient-stock.service';
import { EditIngredientStockModalComponent } from './ui/edit-ingredient-stock-modal/edit-ingredient-stock-modal.component';
import { AddIngredientStockModalComponent } from './ui/add-ingredient-stock-modal/add-ingredient-stock-modal.component';
import { DeleteIngredientStockModalComponent } from './ui/delete-ingredient-stock-modal/delete-ingredient-stock-modal.component';
import {
  FilterTypeEnum,
  SortEnum,
  TableFullColumn,
  SortRotateStateEnum,
} from 'src/app/shared/state/shared-state';

@Component({
  selector: 'dl-ingredient-inventory-table',
  standalone: true,
  imports: [
    CommonModule,
    TableFullComponent,
    AddIngredientStockModalComponent,
    EditIngredientStockModalComponent,
  ],
  templateUrl: './ingredient-inventory-table.component.html',
})
export class IngredientInventoryTableComponent {
  addModalComponent: Type<any> = AddIngredientStockModalComponent;
  editModalComponent: Type<any> = EditIngredientStockModalComponent;
  deleteModalComponent: Type<any> = DeleteIngredientStockModalComponent;

  constructor(private ingredientStockService: IngredientStockService) {}

  title = 'Ingredient Inventory';
  headingPhrase = 'Multiple entries may exist for each Ingredient.';
  addButtonTitle = 'Add Inventory';
  IDKey = 'ingredientStockID';
  addSuccessMessage = 'Added Ingredient Stock with ID:';
  addFailureMessage = 'Failed to add Ingredient Stock. Try again later.';
  editSuccessMessage = 'Updated Ingredient Stock with ID:';
  editFailureMessage = 'Failed to update Ingredient Stock. Try again later.';
  deleteSuccessMessage = 'Deleted Ingredient Stock with ID:';
  deleteFailureMessage = 'Failed to delete Ingredient Stock. Try again later.';
  searchPlaceholder = 'Search by Ingredient...';
  searchSubject = 'name';
  columns: TableFullColumn[] = [
    {
      name: 'Ingredient',
      prop: 'name',
      cssClass: 'w-dl-5',
      sort: SortEnum.alphabetical,
      sortRotateState: SortRotateStateEnum.default,
      sortOrderState: null,
      filterType: FilterTypeEnum.search,
    },
    {
      name: 'Brand',
      prop: 'brand',
      cssClass: 'w-dl-5',
      sort: SortEnum.alphabetical,
      sortRotateState: SortRotateStateEnum.default,
      sortOrderState: null,
      filterType: FilterTypeEnum.search,
    },
    {
      name: 'Quantity',
      prop: 'quantity',
      cssClass: 'w-dl-6',
      filterType: FilterTypeEnum.none,
    },
    {
      name: 'Expiration',
      prop: 'expiration',
      cssClass: 'w-dl-5',
      sort: SortEnum.numerical,
      sortRotateState: SortRotateStateEnum.default,
      sortOrderState: null,
      filterType: FilterTypeEnum.dateRange,
    },
  ];

  rows$: Observable<IngredientStockRow[]> = this.ingredientStockService.rows$;

  ngOnInit() {}
}
