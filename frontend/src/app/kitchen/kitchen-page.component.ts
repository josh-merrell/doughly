import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolsComponent } from './feature/tools/tools.component';
import { selectView, selectInventoryView } from './state/kitchen-selectors';
import { Observable } from 'rxjs';
import { AppState } from  '../shared/state/app-state';
import { Store } from '@ngrx/store';
import { setView, setInventoryView } from './state/kitchen-actions';
import { IngredientsComponent } from './feature/ingredients/ingredients.component';


@Component({
  selector: 'dl-kitchen-page',
  standalone: true,
  imports: [CommonModule, ToolsComponent, IngredientsComponent],
  templateUrl: './kitchen-page.component.html',
})
export class KitchenPageComponent {
  view$: Observable<string> = this.store.select(selectView);
  inventoryView$: Observable<string> = this.store.select(selectInventoryView);

  constructor(private store: Store<AppState>) {}

  updateView(view: string) {
    this.store.dispatch(setView({ view }))
  }

  updateInventoryView(inventoryView: string) {
    this.store.dispatch(setInventoryView({ inventoryView }))
  }
}
