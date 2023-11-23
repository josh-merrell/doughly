import { Component, Input, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Profile } from 'src/app/profile/state/profile-state';
import { Store } from '@ngrx/store';
import { Friendship } from 'src/app/social/state/friendship-state';
import { selectFriendshipByFriendID } from 'src/app/social/state/friendship-selectors';
import { FriendshipActions } from 'src/app/social/state/friendship-actions';

@Component({
  selector: 'dl-request-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './request-card.component.html',
})
export class RequestCardComponent {
  @Input() friendRequest!: Profile;
  public initials: string = '';
  public friendship: WritableSignal<Friendship | null> = signal(null);

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.initials =
      this.friendRequest.nameFirst[0] + this.friendRequest.nameLast[0];

    //use selectFriendshipByUserID
    this.store
      .select(selectFriendshipByFriendID(this.friendRequest.userID))
      .subscribe((friendship) => {
        this.friendship.set(friendship);
      });
  }

  onAcceptRequest() {
    this.store.dispatch(
      FriendshipActions.editFriendship({
        friendshipID: this.friendship()!.friendshipID,
        newStatus: 'confirmed',
      })
    );

  }

  onDeclineRequest() {
    this.store.dispatch(
      FriendshipActions.deleteFriendship({
        friendshipID: this.friendship()!.friendshipID,
      })
    )
  }
}
