import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ExtraStuffService } from 'src/app/shared/utils/extraStuffService';
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
    public extraStuffService: ExtraStuffService
  ) {}

  features = [
    {
      title: '',
      freeTier: 'FREE',
      lifetime: 'LIFETIME',
      premiumTier: 'PREMIUM',
    },
    {
      title: 'Subscribed Recipes',
      freeTier: this.productService.licences.recipeSubscribeLimit.toString(),
      lifetime: 'no limit!',
      premiumTier: 'no limit!',
    },
    {
      title: 'Created Recipes',
      freeTier: this.productService.licences.recipeCreateLimit.toString(),
      lifetime: 'no limit!',
      premiumTier: 'no limit!',
    },
    {
      title: 'Monthly Tokens',
      freeTier: 'dash',
      lifetime: 'dash',
      premiumTier: '12',
    },
    {
      title: 'Daily Data Backups',
      freeTier: 'dash',
      lifetime: 'dash',
      premiumTier: 'check',
    },
  ];
}
