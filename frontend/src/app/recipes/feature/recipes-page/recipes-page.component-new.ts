import { Component, WritableSignal, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterOutlet,
} from '@angular/router';
import { DiscoverRecipesComponent } from './feature/discover/discover-recipes.component';
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

    effect(() => {
      const view = this.view();
      if (view === 'created') {
        this.router.navigate(['/recipes/created']);
      } else if (view === 'discover') {
        this.router.navigate(['/recipes/discover']);
      } else if (view === 'subscribed') {
        this.router.navigate(['/recipes/subscribed']);
      }
    });
  }

  ngOnInit(): void {
    this.checkAndUpdateView();
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.checkAndUpdateView();
      });
  }

  private checkAndUpdateView() {
    const childRoute = this.route.snapshot.firstChild;
    const childSegment = childRoute ? childRoute.url[0]?.path : 'created';
    this.view.set(childSegment);
  }

  setView(view: string) {
    this.view.set(view);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
