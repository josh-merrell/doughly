import { Component, WritableSignal, signal } from '@angular/core';
import { StringsService } from 'src/app/shared/utils/strings';
import { BenefitsChartComponent } from '../benefits-chart/benefits-chart.component';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationModalComponent } from 'src/app/shared/ui/confirmation-modal/confirmation-modal.component';
import { SelectRecipesToKeepModalComponent } from '../select-recipes-to-keep-modal/select-recipes-to-keep-modal.component';
@Component({
  selector: 'dl-your-premium',
  standalone: true,
  imports: [
    SelectRecipesToKeepModalComponent,
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
    const ref = this.dialog.open(SelectRecipesToKeepModalComponent, {
      width: '90%',
    });
    ref.afterClosed().subscribe((result) => {
      if (result === 'mapped') {
        this.dialog.open(ConfirmationModalComponent, {
          maxWidth: '380px',
          data: {
            confirmationMessage: 'Recipe selections saved',
          },
        });
      }
    });
  }

  setView(view: string) {
    this.view.set(view);
  }
}
