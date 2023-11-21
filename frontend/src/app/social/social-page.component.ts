import { Component, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { FriendshipActions } from './state/friendship-actions';
import { FollowshipActions } from './state/followship-actions';

@Component({
  selector: 'dl-social-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './social-page.component.html',
})
export class SocialPageComponent {
  public view: WritableSignal<string> = signal('friends');

  constructor(private store: Store) {}

  ngOnInit() {
    this.store.dispatch(FriendshipActions.loadFriendships());
    this.store.dispatch(FollowshipActions.loadFollowships());
    this.store.dispatch(FollowshipActions.loadFollowers());
  }

  setView(view: string) {
    this.view.set(view);
  }

}
