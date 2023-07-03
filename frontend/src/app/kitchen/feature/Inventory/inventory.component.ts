import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppState } from  '../../../shared/state/app-state';
import { Store } from '@ngrx/store';
import { selectInventoryView } from '../../state/kitchen-selectors';
import { MaterialInventoryTableComponent } from './feature/material-inventory/material-inventory-table.component';
import { IngredientInventoryTableComponent } from './feature/ingredient-inventory/ingredient-inventory-table.component';



@Component({
  selector: 'dl-inventory',
  standalone: true,
  imports: [
    CommonModule,
    IngredientInventoryTableComponent,
    MaterialInventoryTableComponent,
  ],
  templateUrl: './inventory.component.html',
})
export class InventoryComponent {
  inventoryView$ = this.store.select(selectInventoryView);
  constructor(private store: Store<AppState>) {}
}
