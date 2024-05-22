import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/shared/utils/authenticationService';
import { StylesService } from 'src/app/shared/utils/stylesService';

@Component({
  selector: 'dl-privacy-page',
  standalone: true,
  imports: [],
  templateUrl: './privacy-page.component.html',
})
export class PrivacyPageComponent {

  constructor(private router: Router,
    private authService: AuthService,
    private stylesService: StylesService
  ) {}

  onExitClick() {
    this.router.navigate(['/profile']);
  }

  getFillColor(index: number): string {
    const darkMode = this.authService.profile()?.darkMode;
    switch (index) {
      case 1:
        return darkMode
          ? this.stylesService.getHex('grey-2')
          : this.stylesService.getHex('grey-8');
      default:
        return darkMode
          ? this.stylesService.getHex('grey-2')
          : this.stylesService.getHex('grey-8');
    }
  }
}
