import { Component, WritableSignal, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
  RouterOutlet,
} from '@angular/router';
import { DiscoverRecipesComponent } from '../discover/discover-recipes.component';
import { RecipeListComponent } from './feature/list/recipe-list.component';
import { Subject, filter, takeUntil } from 'rxjs';

@Component({
  selector: 'dl-recipes-page-new',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    DiscoverRecipesComponent,
    RecipeListComponent,
  ],
  templateUrl: './recipes-page.component-new.html',
})
export class RecipesPageNewComponent {
  private destroy$ = new Subject<void>();
  public view: WritableSignal<string>;

  constructor(
    private router: Router,
    public dialog: MatDialog,
    private route: ActivatedRoute
  ) {
    this.view = signal('created'); // Default view
  }

  ngOnInit(): void {
    // Subscribe to route changes to handle navigation
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateViewBasedOnRoute();
      });

    // Also handle the initial route
    this.updateViewBasedOnRoute();
  }

  private updateViewBasedOnRoute() {
    const childRoutes = this.getChildRoutes(this.route.snapshot);
    if (childRoutes.length > 0) {
      const baseRoute = childRoutes[0];
      if (baseRoute === 'discover') {
        this.setView('discover');
      } else if (baseRoute === 'subscribed') {
        this.setView('subscribed');
      } else {
        this.setView('created');
        if (childRoutes.length > 1) {
          // Navigate to 'created' along with its child routes
          this.navigateToCreatedChildren(childRoutes.slice(1));
        } else {
          this.navigateToCreated();
        }
      }
    }
  }

  private getChildRoutes(routeSnapshot: ActivatedRouteSnapshot): string[] {
    let routes: string[] = [];
    let currentRoute: ActivatedRouteSnapshot | null = routeSnapshot.firstChild;
    while (currentRoute) {
      const pathSegment = currentRoute.url
        .map((segment) => segment.path)
        .join('/');
      if (pathSegment) {
        routes.push(pathSegment);
      }
      currentRoute = currentRoute.firstChild;
    }
    return routes;
  }

  navigateToCreated() {
    this.setView('created');

    this.router.navigate(['/recipes/created']);
  }
  
  navigateToCreatedChildren(childRoutePaths: string[]) {
    this.setView('created');

    // Navigate to the constructed route
    this.router.navigate(['/recipes/created', ...childRoutePaths], {
      relativeTo: this.route,
    });
  }

  navigateToDiscover() {
    this.setView('discover');
    this.router.navigate(['/recipes/discover']);
  }

  navigateToSubscribed() {
    this.setView('subscribed');
    this.router.navigate(['/recipes/subscribed']);
  }

  setView(view: string) {
    this.view.set(view);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
