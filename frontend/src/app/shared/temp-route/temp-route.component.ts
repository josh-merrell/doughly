import { Component } from '@angular/core';
import { RedirectPathService } from 'src/app/shared/utils/redirect-path.service';
import { Router, RouterLinkWithHref } from '@angular/router';
import { AuthService } from '../utils/authenticationService';

@Component({
  selector: 'dl-temp-route',
  standalone: true,
  imports: [],
  templateUrl: './temp-route.component.html',
})
export class TempRouteComponent {
  constructor(
    private redirectPathService: RedirectPathService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const path = this.redirectPathService.getPath();
    const profile = this.authService.profile();
    switch (profile?.onboardingState) {
      case 1:
        this.router.navigate(['/social/friends']);
        break;
      default: // onboardingState 0 (done)
        if (path) {
          this.router.navigate([path], { onSameUrlNavigation: 'reload' });
        } else {
          this.router.navigate(['/']);
        }
    }
  }
}
