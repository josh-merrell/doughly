import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ExtraStuffService } from '../shared/utils/extraStuffService';

@Component({
  selector: 'dl-terms',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terms.component.html',
})
export class TermsComponent {
  constructor(
    private router: Router,
    public extraStuffService: ExtraStuffService
  ) {}

  onExitClick() {
    this.router.navigate(['/profile']);
  }

}
