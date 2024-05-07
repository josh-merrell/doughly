import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { StringsService } from 'src/app/shared/utils/strings';

@Component({
  selector: 'dl-benefits-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './benefits-chart.component.html',
})
export class BenefitsChartComponent {

  constructor(public stringsService: StringsService) {}

  features = [
    {
      title: '',
      freeTier: 'FREE',
      premiumTier: 'PREMIUM',
    },
    {
      title: 'Subscribed Recipes',
      freeTier: '5',
      premiumTier: 'no limit!',
    },
    {
      title: 'Created Recipes',
      freeTier: '5',
      premiumTier: 'no limit!'
    },
    {
      title: 'Monthly AI Credits',
      freeTier: 'dash',
      premiumTier: '12'
    },
    {
      title: 'Daily Data Backups',
      freeTier: 'dash',
      premiumTier: 'check'
    }
  ];
}
