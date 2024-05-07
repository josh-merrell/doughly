import { Component, WritableSignal, effect, signal } from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterModule,
} from '@angular/router';
import { filter } from 'rxjs';
import { UpgradePageComponent } from '../ui/upgrade-page/upgrade-page.component';

@Component({
  selector: 'dl-products-page',
  standalone: true,
  imports: [UpgradePageComponent, RouterModule],
  templateUrl: './products-page.component.html',
})
export class ProductsPageComponent {
  public view: WritableSignal<string> = signal('upgrade');

  constructor(private router: Router, private route: ActivatedRoute) {
    effect(() => {
      const view = this.view();
      if (view === 'upgrade') {
        this.router.navigate(['/products/upgrade']);
      } else if (view === 'your-premium') {
        this.router.navigate(['/products/your-premium']);
      }
    });
  }

  ngOnInit(): void {
    this.checkAndUpdateView();
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkAndUpdateView();
      });
  }

  private checkAndUpdateView() {
    const childRoute = this.route.snapshot.firstChild;
    const childSegment = childRoute ? childRoute.url[0]?.path : 'upgrade';
    this.view.set(childSegment);
  }

  setView(view: string) {
    this.view.set(view);
  }

  onCancel() {
    this.router.navigate(['/recipes/discover']);
  }
}
