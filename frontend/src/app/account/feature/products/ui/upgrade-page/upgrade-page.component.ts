import { Component, WritableSignal, effect, signal } from '@angular/core';
import { BenefitsOverviewComponent } from '../benefits-overview/benefits-overview.component';
import { BenefitsChartComponent } from '../benefits-chart/benefits-chart.component';
import { ProductCardComponent } from '../product-card/product-card.component';
import { ProductService } from 'src/app/shared/utils/productService';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StringsService } from 'src/app/shared/utils/strings';

@Component({
  selector: 'dl-upgrade-page',
  standalone: true,
  imports: [
    CommonModule,
    BenefitsOverviewComponent,
    BenefitsChartComponent,
    ProductCardComponent,
  ],
  templateUrl: './upgrade-page.component.html',
})
export class UpgradePageComponent {
  public view: WritableSignal<string> = signal('overview');
  public subscribeOfferings: WritableSignal<any[]> = signal([]);
  constructor(
    private router: Router,
    private productService: ProductService,
    public stringsService: StringsService
  ) {
    effect(
      () => {
        const offerings = this.productService.offerings();
        if (offerings.length) {
          this.subscribeOfferings.set(offerings);
        } else {
          this.subscribeOfferings.set([]);
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit() {}

  onConfirm() {
    if (this.view() === 'overview') {
      this.setView('chart');
    } else if (this.view() === 'chart') {
      this.setView('options');
    } else {
      this.makePurchase();
    }
  }

  onCancel() {
    this.router.navigate(['/recipes/discover']);
  }

  makePurchase() {
    console.log('Making purchase');
  }

  setView(view: string) {
    this.view.set(view);
  }
}
