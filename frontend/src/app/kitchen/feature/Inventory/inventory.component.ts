import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppState } from  '../../../shared/state/app-state';
import { Store } from '@ngrx/store';
import { selectInventoryView } from '../../state/kitchen-selectors';


@Component({
  selector: 'dl-inventory',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './inventory.component.html',
})
export class InventoryComponent {
  inventoryView$ = this.store.select(selectInventoryView);
  constructor(private store: Store<AppState>) {}
}
