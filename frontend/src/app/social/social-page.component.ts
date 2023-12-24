import { Component, WritableSignal, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { FriendshipActions } from './state/friendship-actions';
import { FollowshipActions } from './state/followship-actions';
import { FriendsComponent } from './feature/friends/friends.component';
import { FollowersComponent } from './feature/followers/followers.component';
import { TimelineComponent } from './feature/timeline/timeline.component';
import { RecipeActions } from '../recipes/state/recipe/recipe-actions';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'dl-social-page',
  standalone: true,
  imports: [
    CommonModule,
    FriendsComponent,
    FollowersComponent,
    TimelineComponent,
    RouterModule,
  ],
  templateUrl: './social-page.component.html',
})
export class SocialPageComponent {
  public view: WritableSignal<string> = signal('friends');

  constructor(private router: Router, private store: Store) {
    effect(() => {
      const view = this.view();
      if (view === 'friends') {
        this.router.navigate(['/social/friends']);
      } else if (view === 'followers') {
        this.router.navigate(['/social/followers']);
      }
    });
  }

  ngOnInit() {}

  setView(view: string) {
    this.view.set(view);
  }
}
