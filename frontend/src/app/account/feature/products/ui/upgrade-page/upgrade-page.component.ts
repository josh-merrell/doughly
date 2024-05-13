import { Component, WritableSignal, effect, signal } from '@angular/core';
import { BenefitsOverviewComponent } from '../benefits-overview/benefits-overview.component';
import { BenefitsChartComponent } from '../benefits-chart/benefits-chart.component';
import { SubscriptionSkuCardComponent } from '../product-card/subscription-sku-card.component';
import { ProductService } from 'src/app/shared/utils/productService';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StringsService } from 'src/app/shared/utils/strings';
import { GlassfyOffering, GlassfySku } from 'capacitor-plugin-glassfy';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { ConfirmationModalComponent } from 'src/app/shared/ui/confirmation-modal/confirmation-modal.component';
import { AuthService } from 'src/app/shared/utils/authenticationService';
@Component({
  selector: 'dl-upgrade-page',
  standalone: true,
  imports: [
    CommonModule,
    BenefitsOverviewComponent,
    BenefitsChartComponent,
    SubscriptionSkuCardComponent,
    MatProgressSpinnerModule,
  ],
  templateUrl: './upgrade-page.component.html',
})
export class UpgradePageComponent {
  public isLoading: WritableSignal<boolean> = signal(false);
  public view: WritableSignal<string> = signal('overview');
  public subscribeSKUs: WritableSignal<GlassfySku[]> = signal([]);
  public selectedBasePlanId: WritableSignal<string> =
    signal('per-6-month-17-94');
  constructor(
    public dialog: MatDialog,
    private router: Router,
    private productService: ProductService,
    public stringsService: StringsService,
    private authService: AuthService
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
    } else if (this.view() === 'options' && this.selectedBasePlanId()) {
      this.makePurchase(this.selectedBasePlanId());
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
      this.isLoading.set(true);
      const result = await this.productService.purchase(sku);
      this.isLoading.set(false);
      if (result.result === 'no permissions') {
        this.dialog.open(ErrorModalComponent, {
          data: {
            errorMessage: `Error purchasing "${sku.skuId}"${result.error}`,
            statusCode: '500',
          },
        });
      } else if (result.result === 'cancelled') {
        this.dialog.open(ErrorModalComponent, {
          data: {
            errorMessage: `Purchase cancelled. Please try again.`,
            statusCode: '500',
          },
        });
      } else if (result.result === 'alreadyOwned') {
        this.dialog.open(ErrorModalComponent, {
          data: {
            errorMessage: `You already have this. Please sign out and log back in to refresh.`,
            statusCode: '500',
          },
        });
      } else if (result.result === 'error') {
        this.dialog.open(ErrorModalComponent, {
          data: {
            errorMessage: `Error purchasing "${sku.skuId}"${result.error}`,
            statusCode: '500',
          },
        });
      } else {
        setTimeout(() => {
          this.authService.refreshProfile();
        }, 1500);
        this.dialog.open(ConfirmationModalComponent, {
          maxWidth: '380px',
          data: {
            confirmationMessage: 'Purchase successful!',
          },
        });
      }
      this.router.navigate(['/recipes/discover']);
    }
  }

  // async restore() {
  //   await this.productService.restore();
  // }

  skuClick(sku) {
    if (sku.product.basePlanId !== this.selectedBasePlanId()) {
      this.selectedBasePlanId.set(sku.product.basePlanId);
    }
  }

  setView(view: string) {
    this.view.set(view);
  }
}
