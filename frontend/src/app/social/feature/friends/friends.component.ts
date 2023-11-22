import { Component, Signal, WritableSignal, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Friendship } from '../../state/friendship-state';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { SocialService } from '../../data/social.service';
import { selectFriendships } from '../../state/friendship-selectors';
import { FriendCardComponent } from './ui/friend-card/friend-card.component';
import { FriendModalComponent } from './ui/friend-modal/friend-modal.component';

@Component({
  selector: 'dl-friends',
  standalone: true,
  imports: [CommonModule, FriendCardComponent],
  templateUrl: './friends.component.html',
})
export class FriendsComponent {
  public friendships: WritableSignal<Friendship[]> = signal([]);
  public friends: Signal<Friendship[]>;
  public requests: Signal<Friendship[]>;
  public searchFilter: WritableSignal<string> = signal('');

  constructor(
    private store: Store,
    public dialog: MatDialog,
    private socialService: SocialService,
  ) {
    this.friends = computed(() => {
        return this.friendships().filter((friendship) => {
          return friendship.status === 'confirmed';
        })
      }
    );

    this.requests = computed(() =>
      this.friendships().filter(
        (friendship) => {
          return friendship.status === 'receivedRequest'
        }
      )
    );
  }

  ngOnInit(): void {
    this.store.select(selectFriendships).subscribe((friendships) => {
      this.friendships.set(friendships);
    });
  }

  onRequestsClick(): void {
    console.log('onRequestsClick');
  }

  onAddFriend(): void {
    console.log('onAddFriend');
  }

  onFriendClick(friend: any): void {
    this.dialog.open(FriendModalComponent, {
      data: friend,
      width: '75%',
    });
  }
}
