import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SingularizeAndCapitalize } from './utils/singular-and-capitalize'

@Component({
  selector: 'dl-inventory-header',
  standalone: true,
  imports: [CommonModule, SingularizeAndCapitalize],
  templateUrl: './inventory-header.component.html',
})
export class InventoryHeaderComponent {
  @Input() inventoryView!: string;
}
