import { Component, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import {
  selectLoading,
  selectSearchResults,
} from 'src/app/profile/state/profile-selectors';
import { ProfileActions } from 'src/app/profile/state/profile-actions';
import { ProfileCardComponent } from '../profile-card/profile-card.component';
import { FriendshipActions } from 'src/app/social/state/friendship-actions';
import { FollowshipActions } from 'src/app/social/state/followship-actions';

@Component({
  selector: 'dl-add-friend-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, ProfileCardComponent],
  templateUrl: './add-friend-modal.component.html',
})
export class AddFriendModalComponent {
  public searchFilter: WritableSignal<string> = signal('');
  public searchedQuery: WritableSignal<string> = signal('');
  public selectedCard: WritableSignal<number> = signal(0);
  public searchResults: WritableSignal<any[]> = signal([]);
  public friendshipStatuses: WritableSignal<any[]> = signal([]);
  public followshipStatuses: WritableSignal<any[]> = signal([]);
  public buttonTexts: WritableSignal<any[]> = signal([]);
  public isLoading: WritableSignal<boolean> = signal(false);

  constructor(private store: Store) {
    this.store.select(selectSearchResults).subscribe((searchResults) => {
      this.searchResults.set(searchResults);
      const friendshipStatuses = searchResults.map(() => ({
        status: '',
        friendshipID: 0,
      }));
      this.friendshipStatuses.set(friendshipStatuses);
      const followshipStatuses = searchResults.map(() => ({
        exists: false,
        followshipID: 0,
      }));
      this.followshipStatuses.set(followshipStatuses);

      //initialize buttonTexts with array of empty objects. Each object should have 'friendButton' with empty string value and 'followButton' with empty string
      const buttonTexts = searchResults.map(() => ({
        friendButton: '',
        followButton: '',
      }));
      this.buttonTexts.set(buttonTexts);
    });
  }

  ngOnInit(): void {
    this.store.select(selectLoading).subscribe((loading) => {
      this.isLoading.set(loading);
    });
  }

  onFriendshipLoaded(index: number, friendshipStatus: any): void {
    const friendshipStatuses = [...this.friendshipStatuses()];
    friendshipStatuses[index].status = friendshipStatus.status;
    friendshipStatuses[index].friendshipID = friendshipStatus.friendshipID;
    this.friendshipStatuses.set(friendshipStatuses);

    const updatedButtonTexts = [...this.buttonTexts()]; // Create a shallow copy
    updatedButtonTexts[index] = { ...updatedButtonTexts[index] }; // Ensure a unique object
    if (friendshipStatus.status === 'confirmed') {
      updatedButtonTexts[index].friendButton = 'Unfriend';
    } else if (friendshipStatus.status === 'receivedRequest') {
      updatedButtonTexts[index].friendButton = 'Accept Request';
    } else if (friendshipStatus.status === 'requesting') {
      updatedButtonTexts[index].friendButton = 'Cancel Request';
    } else {
      updatedButtonTexts[index].friendButton = 'Add Friend';
    }
    this.buttonTexts.set(updatedButtonTexts);
  }

  onFollowshipLoaded(index: number, followshipLoaded: any): void {
    const followshipStatuses = [...this.followshipStatuses()];
    followshipStatuses[index].exists = followshipLoaded.exists;
    followshipStatuses[index].followshipID = followshipLoaded.followshipID;
    this.followshipStatuses.set(followshipStatuses);

    const updatedButtonTexts = [...this.buttonTexts()];
    if (followshipLoaded.exists) {
      updatedButtonTexts[index].followButton = 'Unfollow';
    } else {
      updatedButtonTexts[index].followButton = 'Follow';
    }
    this.buttonTexts.set(updatedButtonTexts);
  }

  onSearch(): void {
    this.store.dispatch(
      ProfileActions.searchProfiles({ searchQuery: this.searchFilter() })
    );
    this.searchedQuery.set(this.searchFilter());
  }

  onFriendButtonClick(): void {
    switch (this.friendshipStatuses()[this.selectedCard()].status) {
      case 'confirmed':
        this.store.dispatch(
          FriendshipActions.deleteFriendship({
            friendshipID:
              this.friendshipStatuses()[this.selectedCard()].friendshipID,
          })
        );
        break;
      case 'receivedRequest':
        this.store.dispatch(
          FriendshipActions.editFriendship({
            friendshipID:
              this.friendshipStatuses()[this.selectedCard()].friendshipID,
            newStatus: 'confirmed',
          })
        );
        break;
      case 'requesting':
        this.store.dispatch(
          FriendshipActions.deleteFriendship({
            friendshipID:
              this.friendshipStatuses()[this.selectedCard()].friendshipID,
          })
        );
        break;
      default:
        this.store.dispatch(
          FriendshipActions.addFriendship({
            friend: this.searchResults()[this.selectedCard()].userID
          })
        );
    }
  }

  onCardClick(index: number): void {
    this.selectedCard.set(index);
  }

  onFollowButtonClick(): void {
    switch (this.followshipStatuses()[this.selectedCard()].exists) {
      case true:
        this.store.dispatch(
          FollowshipActions.deleteFollowship({
            followshipID:
              this.followshipStatuses()[this.selectedCard()].followshipID,
          })
        )
        break;
      default:
        this.store.dispatch(
          FollowshipActions.addFollowship({
            following: this.searchResults()[this.selectedCard()].userID
          })
        )
    }
  }
}
