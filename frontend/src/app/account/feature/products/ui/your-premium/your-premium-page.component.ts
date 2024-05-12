import { Component, WritableSignal, effect, signal } from '@angular/core';
import { StringsService } from 'src/app/shared/utils/strings';
import { BenefitsChartComponent } from '../benefits-chart/benefits-chart.component';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationModalComponent } from 'src/app/shared/ui/confirmation-modal/confirmation-modal.component';
import { SelectFreeTierRecipesModalComponent } from '../select-free-tier-recipes-modal/select-free-tier-recipes-modal.component';
import { SelectFreeTierSubscriptionsModalComponent } from '../select-free-tier-subscriptions-modal/select-free-tier-subscriptions-modal.component';
import { GlassfySku } from 'capacitor-plugin-glassfy';
import { ProductService } from 'src/app/shared/utils/productService';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { ProductSkuCardComponent } from '../product-card/product-sku-card.component';
@Component({
  selector: 'dl-your-premium',
  standalone: true,
  imports: [
    SelectFreeTierRecipesModalComponent,
    CommonModule,
    MatProgressSpinnerModule,
    BenefitsChartComponent,
    ProductSkuCardComponent,
  ],
  templateUrl: './your-premium-page.component.html',
})
export class YourPremiumComponent {
  public view: WritableSignal<string> = signal('benefits');
  public isLoading: WritableSignal<boolean> = signal(false);
  public productSKUs: WritableSignal<GlassfySku[]> = signal([]);
  public selectedIdentifier: WritableSignal<string> = signal(
    'doughly_aicredits10_once_2.99'
  );
  constructor(
    public stringsService: StringsService,
    private router: Router,
    private dialog: MatDialog,
    private productService: ProductService
  ) {
    effect(
      () => {
        const offerings = this.productService.offerings();
        if (offerings.length) {
          // only get offering with 'offeringId' of "doughly-aicredits-10"
          const creditsOffering = offerings.find(
            (offering) => offering.offeringId === 'doughly-aicredits-10'
          );
          if (creditsOffering) {
            this.productSKUs.set(creditsOffering.skus);
            console.log(`CREDITS SKUS: `, this.productSKUs());
          }
        } else {
          this.productSKUs.set([]);
        }
      },
      { allowSignalWrites: true }
    );
  }

  onConfirm() {
    if (this.view() === 'benefits') {
      this.setView('chooseMapping');
    } else if (this.view() === 'chooseMapping') {
      this.router.navigate(['/recipes/discover']);
    } else if (this.view() === 'options') {
      this.makePurchase(this.selectedIdentifier());
    }
  }

  async makePurchase(skuId: string) {
    // get sku with matching 'skuId'
    const sku = this.productSKUs().find((sku) => sku.skuId === skuId);
    if (sku) {
      this.isLoading.set(true);
      const result = await this.productService.purchase(sku);
      this.isLoading.set(false);
      if (result.result === 'no permissions') {
        this.dialog.open(ErrorModalComponent, {
          data: {
            errorMessage: `Error purchasing "${skuId}"${result.error}`,
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
      } else if (result.result === 'error') {
        this.dialog.open(ErrorModalComponent, {
          data: {
            errorMessage: `Error purchasing "${skuId}"${result.error}`,
            statusCode: '500',
          },
        });
      } else {
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

  skuClick(sku) {
    if (sku.skuId !== this.selectedIdentifier()) {
      this.selectedIdentifier.set(sku.skuId);
    }
  }

  onSelectRecipes() {
    this.dialog.open(SelectFreeTierRecipesModalComponent, {
      width: '90%',
    });
  }

  onSelectSubscriptions() {
    this.dialog.open(SelectFreeTierSubscriptionsModalComponent, {
      width: '90%',
    });
  }

  onAddTokens() {
    this.setView('options');
  }

  setView(view: string) {
    this.view.set(view);
  }
}
