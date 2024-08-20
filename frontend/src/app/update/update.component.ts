import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'dl-update',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './update.component.html',
})
export class UpdateComponent {
  constructor(private router: Router) {}

  onSubmit() {
    const platform = Capacitor.getPlatform();
    if (platform === 'android') {
      window.open(
        'https://play.google.com/store/apps/details?id=co.doughly.app',
        '_blank'
      );
    } else if (platform === 'ios') {
      window.open(
        'https://apps.apple.com/us/app/doughly/id1588157263',
        '_blank'
      );
    } else {
      window.open(
        'https://apps.apple.com/us/app/doughly/id1588157263',
        '_blank'
      );
    }
  }
}
