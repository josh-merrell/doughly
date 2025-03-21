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
import { ProductPackageCardComponent } from '../product-card/product-package-card/product-package-card.component';
import { selectProfile } from 'src/app/profile/state/profile-selectors';
import { Store } from '@ngrx/store';
@Component({
  selector: 'dl-upgrade-page',
  standalone: true,
  imports: [
    CommonModule,
    BenefitsOverviewComponent,
    BenefitsChartComponent,
    SubscriptionSkuCardComponent,
    MatProgressSpinnerModule,
    SubscriptionPackageCardComponent,
    ProductPackageCardComponent,
  ],
  templateUrl: './upgrade-page.component.html',
})
export class UpgradePageComponent {
  // private profile: WritableSignal<any> = signal({});
  public isLoading: WritableSignal<boolean> = signal(false);
  public view: WritableSignal<string> = signal('overview');
  public subscribePackages: WritableSignal<PurchasesPackage[]> = signal([]);
  public productPackages: WritableSignal<PurchasesPackage[]> = signal([]);
  public selectedIdentifier: WritableSignal<string> = signal('$rc_six_month');
  private tokenOffering: PurchasesOffering | undefined;
  public showTokenButton: WritableSignal<boolean> = signal(false);
  private lifetimeOffering: PurchasesOffering | undefined;
  constructor(
    public dialog: MatDialog,
    private router: Router,
    private productService: ProductService,
    public stringsService: StringsService,
    private authService: AuthService,
    private modalService: ModalService,
    private store: Store
  ) {
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
            // console.log(
            //   `REVENUECAT OFFERING PACKAGES: `,
            //   JSON.stringify(this.subscribePackages())
            // );
          }
          const lifetimeOfferingRevenueCat = offeringsRevenueCat.find(
            (offering) => offering.identifier === 'doughly-lifetime'
          );
          const tokenOffering = offeringsRevenueCat.find(
            (offering) => offering.identifier === 'doughly-aicredits-10'
          );
          if (lifetimeOfferingRevenueCat) {
            this.lifetimeOffering = lifetimeOfferingRevenueCat;
            this.productPackages.set(
              lifetimeOfferingRevenueCat.availablePackages
            );
          }
          if (tokenOffering) {
            this.tokenOffering = tokenOffering;
          }
        } else {
          this.subscribePackages.set([]);
        }
      },
      { allowSignalWrites: true }
    );

    effect(
      () => {
        const profile = this.authService.profile();
        if (profile) {
          if (
            profile.permAITokenCount <
            this.productService.licences.maxAICredits -
              this.productService.licences.extraAITokenPurchaseCount
          ) {
            this.showTokenButton.set(true);
          }
        }
      },
      { allowSignalWrites: true }
    );
  }

  // ngOnInit() {
  //   this.store.select(selectProfile).subscribe((profile) => {
  //     this.profile.set(profile);
  //     console.log('PROFILE: ', profile);
  //     console.log(
  //       'MAX AI CREDITS: ',
  //       this.productService.licences.maxAICredits
  //     );
  //     console.log(
  //       'EXTRA AI TOKEN PURCHASE COUNT: ',
  //       this.productService.licences.extraAITokenPurchaseCount
  //     );
  //     if (profile) {
  //       if (
  //         profile.permAITokenCount <
  //         this.productService.licences.maxAICredits -
  //           this.productService.licences.extraAITokenPurchaseCount
  //       ) {
  //         this.showTokenButton.set(true);
  //       }
  //     }
  //   });
  // }

  onConfirm() {
    if (this.view() === 'overview') {
      this.setView('chart');
    } else if (this.view() === 'chart') {
      this.setView('options');
    } else if (
      (this.view() === 'options' ||
        this.view() === 'optionsLifetime' ||
        this.view() === 'optionsTokens') &&
      this.selectedIdentifier()
    ) {
      this.makePurchase(this.selectedIdentifier());
    }
  }

  onConfirmLifetime() {
    if (this.view() === 'overview') {
      this.setView('chart');
    } else if (this.view() === 'chart') {
      this.selectedIdentifier.set('$rc_lifetime');
      this.setView('optionsLifetime');
    } else if (this.view() === 'options' && this.selectedIdentifier()) {
      this.makePurchase(this.selectedIdentifier());
    } else if (this.view() === 'optionsLifetime' && this.selectedIdentifier()) {
      this.makePurchase(this.selectedIdentifier());
    }
  }

  onCancel() {
    this.router.navigate(['/recipes/created']);
  }

  async makePurchase(selectedID: string) {
    // RevenueCat
    const revenueCatSubPackage = this.subscribePackages().find(
      (revenueCatPackage) => revenueCatPackage.identifier === selectedID
    );
    const revenueCatProductPackage = this.productPackages().find(
      (revenueCatPackage) => revenueCatPackage.identifier === selectedID
    );
    if (revenueCatSubPackage) {
      this.isLoading.set(true);
      // RevenueCat
      const result = await this.productService.purchaseRevenueCatSubPackage(
        revenueCatSubPackage
      );
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
      this.router.navigate(['/recipes/created']);
    } else if (revenueCatProductPackage) {
      this.isLoading.set(true);
      // RevenueCat
      const result = await this.productService.purchaseRevenueCatProdPackage(
        revenueCatProductPackage
      );
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
      this.router.navigate(['/recipes/created']);
    }
  }

  skuClick(sku) {
    if (sku.skuId !== this.selectedIdentifier()) {
      this.selectedIdentifier.set(sku.skuId);
    }
  }

  onRestorePurchases() {
    this.productService.restorePurchases();
  }

  onPrivacyClick() {
    this.router.navigate(['/privacy']);
  }

  onTermsClick() {
    this.router.navigate(['/terms']);
  }

  onTokenClick() {
    if (this.tokenOffering) {
      this.productPackages.set(this.tokenOffering.availablePackages);
      this.setView('optionsTokens');
      this.selectedIdentifier.set('doughly_aicredits10_once_2.99');
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
