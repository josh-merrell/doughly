import { Component, WritableSignal, signal } from '@angular/core';
import { StringsService } from 'src/app/shared/utils/strings';
import { BenefitsChartComponent } from '../benefits-chart/benefits-chart.component';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'dl-your-premium',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, BenefitsChartComponent],
  templateUrl: './your-premium-page.component.html',
})
export class YourPremiumComponent {
  public isLoading: WritableSignal<boolean> = signal(false);
  constructor(public stringsService: StringsService) {}

  onConfirm() {
    console.log('Canceling subscription');
  }
}
