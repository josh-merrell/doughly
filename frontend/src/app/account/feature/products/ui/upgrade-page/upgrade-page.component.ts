import { Component, WritableSignal, effect, signal } from '@angular/core';
import { BenefitsOverviewComponent } from '../benefits-overview/benefits-overview.component';
import { BenefitsChartComponent } from '../benefits-chart/benefits-chart.component';
import { SubscriptionSkuCardComponent } from '../product-card/subscription-sku-card.component';
import { ProductService } from 'src/app/shared/utils/productService';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StringsService } from 'src/app/shared/utils/strings';
import { GlassfyOffering, GlassfySku } from 'capacitor-plugin-glassfy';
import { PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { ConfirmationModalComponent } from 'src/app/shared/ui/confirmation-modal/confirmation-modal.component';
import { AuthService } from 'src/app/shared/utils/authenticationService';
import { ModalService } from 'src/app/shared/utils/modalService';
import { PurchasesOffering } from '@revenuecat/purchases-capacitor';
import { SubscriptionPackageCardComponent } from '../product-card/subscription-package-card/subscription-package-card.component';
@Component({
  selector: 'dl-upgrade-page',
  standalone: true,
  imports: [
    CommonModule,
    BenefitsOverviewComponent,
    BenefitsChartComponent,
    SubscriptionSkuCardComponent,
    MatProgressSpinnerModule,
    SubscriptionPackageCardComponent
  ],
  templateUrl: './upgrade-page.component.html',
})
export class UpgradePageComponent {
  public isLoading: WritableSignal<boolean> = signal(false);
  public view: WritableSignal<string> = signal('overview');
  public subscribeSKUs: WritableSignal<GlassfySku[]> = signal([]);
  public subscribePackages: WritableSignal<PurchasesPackage[]> = signal([]);
  public selectedIdentifier: WritableSignal<string> = signal(
    'doughly_premium_6months_17.94'
  );
  constructor(
    public dialog: MatDialog,
    private router: Router,
    private productService: ProductService,
    public stringsService: StringsService,
    private authService: AuthService,
    private modalService: ModalService
  ) {
    // Glassfy
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
            console.log(`SUBSCRIBE SKUS: `, JSON.stringify(this.subscribeSKUs()));
          }
        } else {
          this.subscribeSKUs.set([]);
        }
      },
      { allowSignalWrites: true }
    );

    // RevenueCat
    effect(
      () => {
        const offeringsRevenueCat = this.productService.offeringsRevenueCat();
        if (offeringsRevenueCat.length) {
          const premiumOfferingRevenueCat = offeringsRevenueCat.find(
            (offering) => offering.identifier === 'doughly-premium'
          );
          if (premiumOfferingRevenueCat) {
            this.subscribePackages.set(
              premiumOfferingRevenueCat.availablePackages
            );
            console.log(
              `REVENUECAT OFFERING PACKAGES: `,
              JSON.stringify(this.subscribePackages())
            );
          }
        } else {
          this.subscribePackages.set([]);
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
    } else if (this.view() === 'options' && this.selectedIdentifier()) {
      this.makePurchase(this.selectedIdentifier());
    }
  }

  onCancel() {
    this.router.navigate(['/recipes/discover']);
  }

  async makePurchase(selectedID: string) {
    // get sku with matching 'skuId'
    // Glassfy
    // const id = this.subscribeSKUs().find((sku) => sku.skuId === selectedID);
    // RevenueCat
    const revenueCatPackage = this.subscribePackages().find(
      (revenueCatPackage) => revenueCatPackage.identifier === selectedID
    );
    if (revenueCatPackage) {
      this.isLoading.set(true);
      // Glassfy
      // const result = await this.productService.purchase(id);
      // RevenueCat
      const result = await this.productService.purchaseRevenueCatSubPackage(revenueCatPackage);
      this.isLoading.set(false);
      if (result.result === 'no permissions') {
        this.modalService.open(
          ErrorModalComponent,
          {
            data: {
              errorMessage: `Error purchasing "${selectedID}"${result.error}`,
              statusCode: '500',
            },
          },
          1,
          true
        );
      } else if (result.result === 'cancelled') {
        this.modalService.open(
          ErrorModalComponent,
          {
            data: {
              errorMessage: `Purchase cancelled. Please try again.`,
              statusCode: '500',
            },
          },
          1,
          true
        );
      } else if (result.result === 'alreadyOwned') {
        this.modalService.open(
          ErrorModalComponent,
          {
            data: {
              errorMessage: `You already have this. Please sign out and log back in to refresh.`,
              statusCode: '500',
            },
          },
          1,
          true
        );
      } else if (result.result === 'error') {
        this.modalService.open(
          ErrorModalComponent,
          {
            data: {
              errorMessage: `Error purchasing "${selectedID}"${result.error}`,
              statusCode: '500',
            },
          },
          1,
          true
        );
      } else {
        setTimeout(() => {
          this.authService.refreshProfile();
        }, 1500);
        this.modalService.open(
          ConfirmationModalComponent,
          {
            maxWidth: '380px',
            data: {
              confirmationMessage: 'Purchase successful!',
            },
          },
          1,
          true
        );
      }
      this.router.navigate(['/recipes/discover']);
    }
  }

  skuClick(sku) {
    if (sku.skuId !== this.selectedIdentifier()) {
      this.selectedIdentifier.set(sku.skuId);
    }
  }

  packageClick(revenueCatPackage) {
    if (revenueCatPackage.identifier !== this.selectedIdentifier()) {
      this.selectedIdentifier.set(revenueCatPackage.identifier);
    }
  }

  setView(view: string) {
    this.view.set(view);
  }
}
