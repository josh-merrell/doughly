import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'dl-subscription-sku-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription-sku-card.component.html',
})
export class SubscriptionSkuCardComponent {
  @Input() sku: any;
  @Input() isSelected: boolean = false;

  constructor() {}

  getPeriodString(period: string) {
    const matches = period.match(/P(\d+)M/);
    if (matches) {
      const months = parseInt(matches[1], 10);
      return `${months} mo`;
    }
    return period; // Return original if no match
  }

  getMonthlyPrice(price: number, period: string) {
    const matches = period.match(/P(\d+)M/);
    if (matches) {
      const months = parseInt(matches[1], 10);
      return (price / months).toFixed(2);
    }
    return price.toFixed(2);
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
