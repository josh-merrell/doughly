import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'dl-privacy-page',
  standalone: true,
  imports: [],
  templateUrl: './privacy-page.component.html',
})
export class PrivacyPageComponent {

  constructor(private router: Router) {}

  onExitClick() {
    this.router.navigate(['/profile']);
  }
}
