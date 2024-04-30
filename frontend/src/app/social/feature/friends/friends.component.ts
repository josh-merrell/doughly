import {
  Component,
  Signal,
  WritableSignal,
  computed,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Friendship } from '../../state/friendship-state';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { SocialService } from '../../data/social.service';
import { selectFriendships } from '../../state/friendship-selectors';
import {
  selectFriendRequests,
  selectFriends,
  selectProfile,
} from 'src/app/profile/state/profile-selectors';
import { FriendCardComponent } from './ui/friend-card/friend-card.component';
import { FriendModalComponent } from './ui/friend-modal/friend-modal.component';
import { Profile } from 'src/app/profile/state/profile-state';
import { ProfileActions } from 'src/app/profile/state/profile-actions';
import { FriendRequestsModalComponent } from './ui/friend-requests-modal/friend-requests-modal.component';
import { AddFriendModalComponent } from './ui/add-friend-modal/add-friend-modal.component';
import { AuthService } from 'src/app/shared/utils/authenticationService';
import { TestComponentModalComponent } from './ui/test-component-modal/test-component-modal.component';

@Component({
  selector: 'dl-friends',
  standalone: true,
  imports: [CommonModule, FriendCardComponent, TestComponentModalComponent],
  templateUrl: './friends.component.html',
})
export class FriendsComponent {
  public friendships: WritableSignal<Friendship[]> = signal([]);
  public friends: WritableSignal<Profile[]> = signal([]);
  public testModalOpen: WritableSignal<boolean> = signal(false);
  public filteredFriends = computed(() => {
    const searchFilter = this.searchFilter();
    let friends = this.friends();
    if (searchFilter) {
      return friends.filter((friend) => {
        return (
          friend.nameFirst.toLowerCase().includes(searchFilter.toLowerCase()) ||
          friend.nameLast.toLowerCase().includes(searchFilter.toLowerCase()) ||
          friend.username.toLowerCase().includes(searchFilter.toLowerCase())
        );
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
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('friends component init');
    this.store.select(selectProfile).subscribe((profile) => {
      console.log('profile', profile);
      if (profile.onboardingState === 1) {
        console.log('opening test modal');
        this.testModalOpen.set(true);
        const dialogRef = this.dialog.open(TestComponentModalComponent, {
          width: '40%',
          maxWidth: '500px',
        });
        dialogRef.afterClosed().subscribe(() => {
          this.testModalOpen.set(false);
        });
      }
    });
    this.store.select(selectFriendships).subscribe((friendships: any) => {
      this.friendships.set(friendships);
    });

    this.store.select(selectFriends).subscribe((friends: any) => {
      this.friends.set(
        [...friends].sort((a, b) => {
          const nameA = a.nameLast?.toLowerCase() || '';
          const nameB = b.nameLast?.toLowerCase() || '';

          if (nameA < nameB) return -1;
          if (nameA > nameB) return 1;
          return 0;
        })
      );
    });

    this.store.select(selectFriendRequests).subscribe((friendRequests) => {
      this.requests.set(friendRequests);
    });
  }

  onRequestsClick(): void {
    const dialogRef = this.dialog.open(FriendRequestsModalComponent, {
      width: '90%',
      maxWidth: '500px',
    });

    //upon closing, if a profile is sent back, use it to open FriendModalComponent.
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.profile) {
        this.dialog.open(FriendModalComponent, {
          data: result.profile,
          width: '90%',
        });
      }
    });
  }

  onAddFriend(): void {
    this.dialog.open(AddFriendModalComponent, {
      width: '90%',
      maxWidth: '500px',
    });
  }

  onFriendClick(friend: any): void {
    this.dialog.open(FriendModalComponent, {
      data: friend,
      width: '90%',
    });
  }

  updateSearchFilter(searchFilter: string): void {
    this.searchFilter.set(searchFilter);
  }
}
