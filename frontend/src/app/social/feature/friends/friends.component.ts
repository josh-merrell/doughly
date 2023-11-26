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
import { AddFriendModalComponent } from './ui/add-friend-modal/add-friend-modal.component';

@Component({
  selector: 'dl-friends',
  standalone: true,
  imports: [CommonModule, FriendCardComponent],
  templateUrl: './friends.component.html',
})
export class FriendsComponent {
  public friendships: WritableSignal<Friendship[]> = signal([]);
  public friends: WritableSignal<Profile[]> = signal([]);
  public filteredFriends = computed(() => {
    const searchFilter = this.searchFilter();
    const friends = this.friends();
    if (searchFilter) {
      return friends.filter((friend) => {
        return (friend.nameFirst.toLowerCase().includes(searchFilter.toLowerCase()) || friend.nameLast.toLowerCase().includes(searchFilter.toLowerCase()) || friend.username.toLowerCase().includes(searchFilter.toLowerCase()));
      });
    } else {
      return friends;
    }
  });
  public requests: WritableSignal<Profile[]> = signal([]);
  public searchFilter: WritableSignal<string> = signal('');

  constructor(
    private store: Store,
    public dialog: MatDialog,
    private socialService: SocialService
  ) {}

  ngOnInit(): void {
    this.store.dispatch(ProfileActions.loadProfile());
    this.store.dispatch(ProfileActions.loadFriends());
    this.store.dispatch(ProfileActions.loadFollowers());
    this.store.dispatch(ProfileActions.loadFriendRequests());
    this.store.dispatch(ProfileActions.loadFriendRequestsSent());

    this.store.select(selectFriendships).subscribe((friendships: any) => {
      this.friendships.set(friendships);
    });

    this.store.select(selectFriends).subscribe((friends: any) => {
      this.friends.set(friends);
    });

    this.store.select(selectFriendRequests).subscribe((friendRequests) => {
      this.requests.set(friendRequests);
    });
  }

  onRequestsClick(): void {
    const dialogRef = this.dialog.open(FriendRequestsModalComponent, {
      width: '75%',
      maxWidth: '500px',
    });

    //upon closing, if a profile is sent back, use it to open FriendModalComponent.
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.profile) {
        this.dialog.open(FriendModalComponent, {
          data: result.profile,
          width: '80%',
          maxWidth: '540px',
        });
      }
    });
  }

  onAddFriend(): void {
    this.dialog.open(AddFriendModalComponent, {
      width: '75%',
      maxWidth: '500px',
    });
  }

  onFriendClick(friend: any): void {
    this.dialog.open(FriendModalComponent, {
      data: friend,
      width: '80%',
      maxWidth: '540px',
    });
  }

  updateSearchFilter(searchFilter: string): void {
    this.searchFilter.set(searchFilter);
  }
}
