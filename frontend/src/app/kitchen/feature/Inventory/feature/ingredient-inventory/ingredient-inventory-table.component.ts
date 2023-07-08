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
import { DeleteIngredientStockModalComponent } from './ui/delete-ingredient-stock-modal/delete-ingredient-stock-modal.component';
import { FilterEnum, SortEnum, TableFullColumn, SortRotateStateEnum } from 'src/app/shared/state/shared-state';


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
  deleteModalComponent: Type<any> = DeleteIngredientStockModalComponent;
  addModalComponent: Type<any> = AddIngredientStockModalComponent;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private store: Store,
    private ingredientStockService: IngredientStockService
  ) {}

  title = 'Ingredient Inventory';
  heading_phrase = 'Multiple entries may exist for each Ingredient.';
  addButtonTitle = 'Add Inventory';
  IDKey = 'ingredientStockID';
  updateSuccessMessage = 'Updated Ingredient Stock with ID:';
  updateFailureMessage = 'Failed to update Ingredient Stock. Try again later.';
  deleteSuccessMessage = 'Deleted Ingredient Stock with ID:';
  deleteFailureMessage = 'Failed to delete Ingredient Stock. Try again later.';
  addSuccessMessage = 'Added Ingredient Stock with ID:';
  addFailureMessage = 'Failed to add Ingredient Stock. Try again later.';
  columns: TableFullColumn[] = [
    {
      name: 'Name',
      prop: 'name',
      sort: SortEnum.alphabetical,
      sortRotateState: SortRotateStateEnum.default,
      sortOrderState: null,
      filter: FilterEnum.search,
    },
    {
      name: 'Brand',
      prop: 'brand',
      sort: SortEnum.alphabetical,
      sortRotateState: SortRotateStateEnum.default,
      sortOrderState: null,
      filter: FilterEnum.search,
    },
    {
      name: 'Quantity',
      prop: 'quantity',
      filter: FilterEnum.none,
    },
    {
      name: 'Expiration',
      prop: 'expiration',
      sort: SortEnum.numberical,
      sortRotateState: SortRotateStateEnum.default,
      sortOrderState: null,
      filter: FilterEnum.dateRange,
    },
  ];

  rows$: Observable<IngredientStockRow[]> = this.ingredientStockService.rows$;

  ngOnInit() {}
}
