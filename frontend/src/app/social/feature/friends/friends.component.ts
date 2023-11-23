import { Component, Signal, WritableSignal, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Friendship } from '../../state/friendship-state';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { SocialService } from '../../data/social.service';
import { selectFriendships } from '../../state/friendship-selectors';
import { selectFriendRequests, selectFriends } from 'src/app/profile/state/profile-selectors';
import { FriendCardComponent } from './ui/friend-card/friend-card.component';
import { FriendModalComponent } from './ui/friend-modal/friend-modal.component';
import { Profile } from 'src/app/profile/state/profile-state';
import { ProfileActions } from 'src/app/profile/state/profile-actions';
import { FriendRequestsModalComponent } from './ui/friend-requests-modal/friend-requests-modal.component';

@Component({
  selector: 'dl-friends',
  standalone: true,
  imports: [CommonModule, FriendCardComponent],
  templateUrl: './friends.component.html',
})
export class FriendsComponent {
  public friendships: WritableSignal<Friendship[]> = signal([]);
  public friends: WritableSignal<Profile[]> = signal([]);
  public requests: WritableSignal<Profile[]> = signal([]);
  public searchFilter: WritableSignal<string> = signal('');

  constructor(
    private store: Store,
    public dialog: MatDialog,
    private socialService: SocialService,
  ) {}

  ngOnInit(): void {
    this.store.dispatch(ProfileActions.loadProfile());
    this.store.dispatch(ProfileActions.loadFriends());
    this.store.dispatch(ProfileActions.loadFollowers());
    this.store.dispatch(ProfileActions.loadFriendRequests());
    this.store.dispatch(ProfileActions.loadFriendRequestsSent());

    this.store.select(selectFriendships).subscribe((friendships) => {
      this.friendships.set(friendships);
    });

    this.store.select(selectFriends).subscribe((friends) => {
      this.friends.set(friends);
    });

    this.store.select(selectFriendRequests).subscribe((friendRequests) => {
      this.requests.set(friendRequests);
    });

  }

  onRequestsClick(): void {
    console.log('onRequestsClick');
    this.dialog.open(FriendRequestsModalComponent, {
      width: '75%',
      maxWidth: '500px',
    });
  }

  onAddFriend(): void {
    console.log('onAddFriend');
  }

  onFriendClick(friend: any): void {
    this.dialog.open(FriendModalComponent, {
      data: friend,
      width: '80%',
      maxWidth: '540px',
    });
  }
}
