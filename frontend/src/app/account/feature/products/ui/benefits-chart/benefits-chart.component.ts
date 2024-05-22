import { CommonModule } from '@angular/common';
import { Component, Input, WritableSignal, signal } from '@angular/core';
import { AuthService } from 'src/app/shared/utils/authenticationService';
import { ProductService } from 'src/app/shared/utils/productService';
import { StringsService } from 'src/app/shared/utils/strings';

@Component({
  selector: 'dl-benefits-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './benefits-chart.component.html',
})
export class BenefitsChartComponent {
  @Input() view!: string;

  constructor(
    public stringsService: StringsService,
    public productService: ProductService,
    private authService: AuthService
  ) {}

  features = [
    {
      title: '',
      freeTier: 'FREE',
      premiumTier: 'PREMIUM',
    },
    {
      title: 'Subscribed Recipes',
      freeTier: this.productService.licences.recipeSubscribeLimit.toString(),
      premiumTier: 'no limit!',
    },
    {
      title: 'Created Recipes',
      freeTier: this.productService.licences.recipeCreateLimit.toString(),
      premiumTier: 'no limit!',
    },
    {
      title: 'Monthly AI Credits',
      freeTier: 'dash',
      premiumTier: '12',
    },
    {
      title: 'Daily Data Backups',
      freeTier: 'dash',
      premiumTier: 'check',
    },
  ];

  getFillColor(index: number): string {
    const darkMode = this.authService.profile()?.darkMode;
    switch (index) {
      case 1:
        return darkMode ? '#CBD2D9' : '#3E4C59';
      case 2:
        return darkMode ? '#F5F7FA' : '#1F2933';
      default:
        return darkMode ? '#CBD2D9' : '#3E4C59';
    }
  }
}
