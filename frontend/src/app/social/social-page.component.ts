import {
  Component,
  OnInit,
  OnDestroy,
  WritableSignal,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FriendsComponent } from './feature/friends/friends.component';
import { FollowersComponent } from './feature/followers/followers.component';
import {
  Router,
  RouterModule,
  ActivatedRoute,
  NavigationEnd,
} from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';

@Component({
  selector: 'dl-social-page',
  standalone: true,
  imports: [CommonModule, FriendsComponent, FollowersComponent, RouterModule],
  templateUrl: './social-page.component.html',
})
export class SocialPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  public view: WritableSignal<string>;

  constructor(private router: Router, private route: ActivatedRoute) {
    this.view = signal('friends'); // Default view

    effect(() => {
      const view = this.view();
      if (view === 'friends') {
        this.router.navigate(['/social/friends']);
      } else if (view === 'followers') {
        this.router.navigate(['/social/followers']);
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
    const childSegment = childRoute ? childRoute.url[0]?.path : 'friends';
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
