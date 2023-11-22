import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { FriendshipActions } from '../social/state/friendship-actions';
import { FollowshipActions } from '../social/state/followship-actions';
import { TimelineComponent } from '../social/feature/timeline/timeline.component';
import { FollowersComponent } from '../social/feature/followers/followers.component';
import { FriendsComponent } from '../social/feature/friends/friends.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FriendsComponent,
    FollowersComponent,
    TimelineComponent,
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  constructor(private store: Store) {}

  ngOnInit() {
    this.store.dispatch(FriendshipActions.loadFriendships());
    this.store.dispatch(FollowshipActions.loadFollowships());
    this.store.dispatch(FollowshipActions.loadFollowers());
  }
}
