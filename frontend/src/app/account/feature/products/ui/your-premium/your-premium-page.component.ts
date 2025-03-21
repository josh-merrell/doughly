import { Component, Renderer2, WritableSignal, effect, signal } from '@angular/core';
import { StringsService } from 'src/app/shared/utils/strings';
import { BenefitsChartComponent } from '../benefits-chart/benefits-chart.component';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationModalComponent } from 'src/app/shared/ui/confirmation-modal/confirmation-modal.component';
import { SelectFreeTierRecipesModalComponent } from '../select-free-tier-recipes-modal/select-free-tier-recipes-modal.component';
import { PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { SelectFreeTierSubscriptionsModalComponent } from '../select-free-tier-subscriptions-modal/select-free-tier-subscriptions-modal.component';
import { GlassfySku } from 'capacitor-plugin-glassfy';
import { ProductService } from 'src/app/shared/utils/productService';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { ProductSkuCardComponent } from '../product-card/product-sku-card.component';
import { Store } from '@ngrx/store';
import { ProfileActions } from 'src/app/profile/state/profile-actions';
import { AuthService } from 'src/app/shared/utils/authenticationService';
import { selectProfile } from 'src/app/profile/state/profile-selectors';
import { ModalService } from 'src/app/shared/utils/modalService';
import { ProductPackageCardComponent } from '../product-card/product-package-card/product-package-card.component';
import { Capacitor } from '@capacitor/core';
import { StylesService } from 'src/app/shared/utils/stylesService';
@Component({
  selector: 'dl-your-premium',
  standalone: true,
  imports: [
    SelectFreeTierRecipesModalComponent,
    CommonModule,
    MatProgressSpinnerModule,
    BenefitsChartComponent,
    ProductSkuCardComponent,
    ProductPackageCardComponent,
  ],
  templateUrl: './your-premium-page.component.html',
})
export class YourPremiumComponent {
  public allowExtraTokenPurchase: WritableSignal<boolean> = signal(false);
  private profile: WritableSignal<any> = signal({});
  public view: WritableSignal<string> = signal('benefits');
  public isLoading: WritableSignal<boolean> = signal(false);
  // public productSKUs: WritableSignal<GlassfySku[]> = signal([]);
  public productPackages: WritableSignal<PurchasesPackage[]> = signal([]);
  public selectedIdentifier: WritableSignal<string> = signal(
    'doughly_aicredits10_once_2.99'
  );
  constructor(
    public stringsService: StringsService,
    private router: Router,
    private dialog: MatDialog,
    private productService: ProductService,
    private authService: AuthService,
    private store: Store,
    private modalService: ModalService,
    private renderer: Renderer2,
    private stylesService: StylesService
  ) {
    // Glassfy
    // effect(
    //   () => {
    //     const offerings = this.productService.offerings();
    //     if (offerings.length) {
    //       // only get offering with 'offeringId' of "doughly-aicredits-10"
    //       const creditsOffering = offerings.find(
    //         (offering) => offering.offeringId === 'doughly-aicredits-10'
    //       );
    //       if (creditsOffering) {
    //         this.productSKUs.set(creditsOffering.skus);
    //         console.log(`CREDITS SKUS: `, this.productSKUs());
    //       }
    //     } else {
    //       this.productSKUs.set([]);
    //     }
    //   },
    //   { allowSignalWrites: true }
    // );

    // RevenueCat
    effect(
      () => {
        const offeringsRevenueCat = this.productService.offeringsRevenueCat();
        if (offeringsRevenueCat.length) {
          const premiumOfferingRevenueCat = offeringsRevenueCat.find(
            (offering) => offering.identifier === 'doughly-aicredits-10'
          );
          if (premiumOfferingRevenueCat) {
            this.productPackages.set(
              premiumOfferingRevenueCat.availablePackages
            );
            // console.log(
            //   `REVENUECAT OFFERING PACKAGES: `,
            //   this.productPackages()
            // );
          }
        } else {
          this.productPackages.set([]);
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
      this.setView('chooseMapping');
    } else if (this.view() === 'chooseMapping') {
      this.router.navigate(['/recipes/created']);
    } else if (this.view() === 'options') {
      this.makePurchase(this.selectedIdentifier());
    }
  }

  async makePurchase(selectedID: string) {
    // RevenueCat
    const revenueCatPackage = this.productPackages().find(
      (revenueCatPackage) => revenueCatPackage.identifier === selectedID
    );
    if (revenueCatPackage) {
      this.isLoading.set(true);
      // RevenueCat
      const result = await this.productService.purchaseRevenueCatProdPackage(
        revenueCatPackage
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

  packageClick(revenueCatPackage) {
    if (revenueCatPackage.identifier !== this.selectedIdentifier()) {
      this.selectedIdentifier.set(revenueCatPackage.identifier);
    }
  }

  onSelectRecipes() {
    this.modalService.open(
      SelectFreeTierRecipesModalComponent,
      {
        width: '90%',
      },
      1,
      true
    );
  }

  onSelectSubscriptions() {
    this.modalService.open(
      SelectFreeTierSubscriptionsModalComponent,
      {
        width: '90%',
      },
      1,
      true
    );
  }

  onAddTokens() {
    this.setView('options');
  }

  setView(view: string) {
    this.view.set(view);
  }
}
