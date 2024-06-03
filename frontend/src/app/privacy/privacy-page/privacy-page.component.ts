import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ExtraStuffService } from 'src/app/shared/utils/extraStuffService';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'dl-privacy-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './privacy-page.component.html',
})
export class PrivacyPageComponent {
  constructor(
    private router: Router,
    public extraStuffService: ExtraStuffService
  ) {}

  onExitClick() {
    this.router.navigate(['/profile']);
  }

}
