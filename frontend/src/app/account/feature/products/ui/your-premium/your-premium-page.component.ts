import { Component, WritableSignal, signal } from '@angular/core';
import { StringsService } from 'src/app/shared/utils/strings';
import { BenefitsChartComponent } from '../benefits-chart/benefits-chart.component';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationModalComponent } from 'src/app/shared/ui/confirmation-modal/confirmation-modal.component';
import { SelectFreeTierRecipesModalComponent } from '../select-free-tier-recipes-modal/select-free-tier-recipes-modal.component';
import { SelectFreeTierSubscriptionsModalComponent } from '../select-free-tier-subscriptions-modal/select-free-tier-subscriptions-modal.component';
@Component({
  selector: 'dl-your-premium',
  standalone: true,
  imports: [
    SelectFreeTierRecipesModalComponent,
    CommonModule,
    MatProgressSpinnerModule,
    BenefitsChartComponent,
  ],
  templateUrl: './your-premium-page.component.html',
})
export class YourPremiumComponent {
  public view: WritableSignal<string> = signal('benefits');
  public isLoading: WritableSignal<boolean> = signal(false);
  constructor(
    public stringsService: StringsService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  onConfirm() {
    if (this.view() === 'benefits') {
      this.setView('chooseMapping');
    } else if (this.view() === 'chooseMapping') {
      this.router.navigate(['/recipes/discover']);
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

  setView(view: string) {
    this.view.set(view);
  }
}
