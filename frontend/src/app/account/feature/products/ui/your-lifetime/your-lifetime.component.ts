import {
  Component,
  effect,
  Renderer2,
  signal,
  WritableSignal,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { ConfirmationModalComponent } from 'src/app/shared/ui/confirmation-modal/confirmation-modal.component';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { AuthService } from 'src/app/shared/utils/authenticationService';
import { ModalService } from 'src/app/shared/utils/modalService';
import { ProductService } from 'src/app/shared/utils/productService';
import { StringsService } from 'src/app/shared/utils/strings';
import { BenefitsChartComponent } from '../benefits-chart/benefits-chart.component';
import { SubscriptionPackageCardComponent } from '../product-card/subscription-package-card/subscription-package-card.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductPackageCardComponent } from '../product-card/product-package-card/product-package-card.component';
import { StylesService } from 'src/app/shared/utils/stylesService';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'dl-your-lifetime',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    BenefitsChartComponent,
    SubscriptionPackageCardComponent,
    ProductPackageCardComponent,
  ],
  templateUrl: './your-lifetime.component.html',
})
export class YourLifetimeComponent {
  public allowExtraTokenPurchase: WritableSignal<boolean> = signal(false);
  public isLoading: WritableSignal<boolean> = signal(false);
  private profile: WritableSignal<any> = signal({});
  public view: WritableSignal<string> = signal('benefits');
  public subscribePackages: WritableSignal<PurchasesPackage[]> = signal([]);
  public productPackages: WritableSignal<PurchasesPackage[]> = signal([]);
  public selectedIdentifier: WritableSignal<string> = signal('$rc_six_month');

  constructor(
    public dialog: MatDialog,
    private router: Router,
    private productService: ProductService,
    public stringsService: StringsService,
    private authService: AuthService,
    private modalService: ModalService,
    private renderer: Renderer2,
    private stylesService: StylesService
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
            (offering) => offering.identifier === 'doughly-aicredits-10'
          );
          if (lifetimeOfferingRevenueCat) {
            this.productPackages.set(
              lifetimeOfferingRevenueCat.availablePackages
            );
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
        this.profile.set(profile);
        // console.log(`NEW PROFILE: `, profile);
        if (profile) {
          if (
            profile.permAITokenCount <
            this.productService.licences.maxAICredits -
              this.productService.licences.extraAITokenPurchaseCount
          ) {
            this.allowExtraTokenPurchase.set(true);
          }
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit() {
    if (Capacitor.isNativePlatform()) {
      this.stylesService.updateStyles('#A54C18', 'dark');
      this.renderer.addClass(document.body, 'product-page');
    }
  }

  onConfirm() {
    if (this.view() === 'benefits') {
      this.setView('options');
    } else if (
      this.view() === 'options' ||
      this.view() === 'optionsAddTokens'
    ) {
      this.makePurchase(this.selectedIdentifier());
    }
  }

  onConfirmAddTokens() {
    if (this.view() === 'benefits') {
      this.selectedIdentifier.set('doughly_aicredits10_once_2.99');
      this.setView('optionsAddTokens');
    }
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
      this.router.navigate(['/recipes/discover']);
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
      this.router.navigate(['/recipes/discover']);
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

  onCancel() {
    this.router.navigate(['/recipes/discover']);
  }
}
