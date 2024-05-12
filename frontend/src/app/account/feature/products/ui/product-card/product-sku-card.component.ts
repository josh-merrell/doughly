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
      case 'doughly_aicredits10_once_2.99':
        return '10 AI Tokens';
    }
    return planId; // Return original if no match
  }
}
