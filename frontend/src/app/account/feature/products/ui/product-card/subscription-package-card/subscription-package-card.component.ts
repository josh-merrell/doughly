import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'dl-subscription-package-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription-package-card.component.html',
})
export class SubscriptionPackageCardComponent {
  @Input() package: any;
  @Input() isSelected: boolean = false;

  constructor() {}

  ngOnInit() {
    // console.log(`PACKAGE: `, this.package);
  }

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

  getTitleString(identifier: string) {
    //android_doughly_premium_monthly_2.99:per-6-month-17-94
    switch (identifier) {
      case '$rc_monthly':
        return 'Month to month';
      case '$rc_six_month':
        return '6 month bundle';
    }
    return identifier; // Return original if no match
  }
}
