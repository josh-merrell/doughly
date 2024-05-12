import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'dl-product-sku-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-sku-card.component.html',
})
export class ProductSkuCardComponent {
  @Input() sku: any;
  @Input() isSelected: boolean = false;

  constructor() {}

  ngOnInit() {
    console.log(`PRODUCT SKU: `, this.sku);
  }

  getTitleString(planId: string) {
    switch (planId) {
      case 'per-month-3-99':
        return 'Month to month';
      case 'per-6-month-17-94':
        return '6 month bundle';
    }
    return planId; // Return original if no match
  }
}
