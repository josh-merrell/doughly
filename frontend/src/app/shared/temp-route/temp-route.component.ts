import { Component } from '@angular/core';
import { RedirectPathService } from 'src/app/shared/utils/redirect-path.service';
import { Router, RouterLinkWithHref } from '@angular/router';

@Component({
  selector: 'dl-temp-route',
  standalone: true,
  imports: [],
  templateUrl: './temp-route.component.html',
})
export class TempRouteComponent {
  constructor(
    private redirectPathService: RedirectPathService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const path = this.redirectPathService.getPath();
    if (path) {
      this.router.navigate([path], { onSameUrlNavigation: 'reload' });
    } else {
      this.router.navigate(['/']);
    }
  }
}
