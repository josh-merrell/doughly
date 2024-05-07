import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { StringsService } from 'src/app/shared/utils/strings';

@Component({
  selector: 'dl-benefits-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './benefits-overview.component.html',
})
export class BenefitsOverviewComponent {
  public points = this.stringsService.productStrings.subscribeOverviewPoints;

  constructor(public stringsService: StringsService) {}
}
