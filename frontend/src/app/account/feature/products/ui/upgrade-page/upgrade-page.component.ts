import { Component, WritableSignal, effect, signal } from '@angular/core';
import { BenefitsOverviewComponent } from '../benefits-overview/benefits-overview.component';
import { BenefitsChartComponent } from '../benefits-chart/benefits-chart.component';
import { SubscriptionSkuCardComponent } from '../product-card/subscription-sku-card.component';
import { ProductService } from 'src/app/shared/utils/productService';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StringsService } from 'src/app/shared/utils/strings';
import { GlassfyOffering, GlassfySku } from 'capacitor-plugin-glassfy';

@Component({
  selector: 'dl-upgrade-page',
  standalone: true,
  imports: [
    CommonModule,
    BenefitsOverviewComponent,
    BenefitsChartComponent,
    SubscriptionSkuCardComponent,
  ],
  templateUrl: './upgrade-page.component.html',
})
export class UpgradePageComponent {
  public view: WritableSignal<string> = signal('overview');
  public subscribeSKUs: WritableSignal<GlassfySku[]> = signal([]);
  public selectedSKU: WritableSignal<string> = signal('per-6-month-17-94');
  constructor(
    private router: Router,
    private productService: ProductService,
    public stringsService: StringsService
  ) {
    effect(
      () => {
        const offerings = this.productService.offerings();
        if (offerings.length) {
          // only get offering with 'offeringId' of "doughly-premium"
          const premiumOffering = offerings.find(
            (offering) => offering.offeringId === 'doughly-premium'
          );
          if (premiumOffering) {
            this.subscribeSKUs.set(premiumOffering.skus);
            console.log(`SUBSCRIBE SKUS: `, this.subscribeSKUs());
          }
        } else {
          this.subscribeSKUs.set([]);
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
    } else if (this.view() === 'options' && this.selectedSKU()) {
      this.makePurchase(this.selectedSKU());
    }
  }

  onCancel() {
    this.router.navigate(['/recipes/discover']);
  }

  async makePurchase(basePlanId: string) {
    // get sku with matching 'basePlanId'
    const sku = this.subscribeSKUs().find(
      (sku) => sku.product.basePlanId === basePlanId
    );
    if (sku) {
      await this.productService.purchase(sku);
    }
  }

  async restore() {
    await this.productService.restore();
  }

  skuClick(sku) {
    if (sku.product.basePlanId === this.selectedSKU()) {
      this.selectedSKU.set('');
    } else {
      this.selectedSKU.set(sku.product.basePlanId);
    }
  }

  setView(view: string) {
    this.view.set(view);
  }
}
