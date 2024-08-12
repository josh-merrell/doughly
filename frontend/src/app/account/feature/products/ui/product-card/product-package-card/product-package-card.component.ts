import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'dl-product-package-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-package-card.component.html',
})
export class ProductPackageCardComponent {
  @Input() package: any;
  @Input() isSelected: boolean = false;

  constructor() {}

  ngOnInit() {
    console.log(`PRODUCT PACKAGE: `, this.package);
  }

  getTitleString(planId: string) {
    switch (planId) {
      case 'doughly_aicredits10_once_2.99':
        return '10 AI Tokens';
      case '$rc_lifetime':
        return 'Lifetime Recipes';
    }
    return planId; // Return original if no match
  }
}
