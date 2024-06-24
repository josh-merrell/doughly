import { CommonModule } from '@angular/common';
import { Component, WritableSignal, signal } from '@angular/core';

@Component({
  selector: 'dl-shared-shopping-lists-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shared-shopping-lists-page.component.html',
})
export class SharedShoppingListsPageComponent {
  public isLoading: WritableSignal<boolean> = signal(false);
  public displaySharedShoppingLists: WritableSignal<any[]> = signal([]);
}
