import {
  Component,
  OnInit,
  WritableSignal,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolsComponent } from './feature/tools/tools.component';
import { IngredientsComponent } from './feature/ingredients/ingredients.component';
import {
  Router,
  RouterModule,
  ActivatedRoute,
  NavigationEnd,
} from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';

@Component({
  selector: 'dl-kitchen-page',
  standalone: true,
  imports: [RouterModule, CommonModule, ToolsComponent, IngredientsComponent],
  templateUrl: './kitchen-page.component.html',
})
export class KitchenPageComponent implements OnInit {
  private destroy$ = new Subject<void>();
  view: WritableSignal<string>;

  constructor(private router: Router, private route: ActivatedRoute) {
    this.view = signal('ingredients'); // Default value
    effect(() => {
      const view = this.view();
      if (view === 'tools') {
        this.router.navigate(['kitchen/tools']);
      } else if (view === 'ingredients') {
        this.router.navigate(['kitchen/ingredients']);
      }
    });
  }

  updateView(view: string) {
    this.view.set(view);
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
    const childSegment = childRoute ? childRoute.url[0]?.path : 'ingredients';
    this.view.set(childSegment);
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
