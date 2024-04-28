import {
  Component,
  Input,
  WritableSignal,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Profile } from 'src/app/profile/state/profile-state';
import { Store } from '@ngrx/store';
import { Friendship } from 'src/app/social/state/friendship-state';
import {
  selectFriendshipByFriendID,
  selectUpdating,
  selectError as selectErrorFriendship,
} from 'src/app/social/state/friendship-selectors';
import { FriendshipActions } from 'src/app/social/state/friendship-actions';
import { filter, take } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import {
  selectProfile,
  selectFriendByUserID,
} from 'src/app/profile/state/profile-selectors';
import { PushTokenService } from 'src/app/shared/utils/pushTokenService';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'dl-request-card',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './request-card.component.html',
})
export class RequestCardComponent {
  public isUpdating: WritableSignal<boolean> = signal(false);
  @Input() friendRequest!: Profile;
  public initials: string = '';
  public friendship: WritableSignal<Friendship | null> = signal(null);
  private friendProfile: WritableSignal<Profile | null> = signal(null);
  public myProfile: WritableSignal<Profile | null> = signal(null);

  constructor(
    private store: Store,
    public dialog: MatDialog,
    private pushTokenService: PushTokenService
  ) {
    effect(
      () => {
        const friendship = this.friendship();
        if (friendship) {
          this.store
            .select(selectFriendByUserID(friendship.friend))
            .subscribe((friend) => {
              this.friendProfile.set(friend);
            });
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit(): void {
    this.initials = (this.friendRequest.nameFirst && this.friendRequest.nameLast) ? this.friendRequest.nameFirst[0] + this.friendRequest.nameLast[0] : 'NA'

    //use selectFriendshipByUserID
    this.store
      .select(selectFriendshipByFriendID(this.friendRequest.userID))
      .subscribe((friendship) => {
        this.friendship.set(friendship);
      });
    this.store.select(selectProfile).subscribe((profile) => {
      this.myProfile.set(profile);
    });
  }

  onAcceptRequest() {
    this.isUpdating.set(true);
    this.store.dispatch(
      FriendshipActions.editFriendship({
        friendshipID: this.friendship()!.friendshipID,
        newStatus: 'confirmed',
      })
    );
    this.store
      .select(selectUpdating)
      .pipe(filter((updating) => !updating))
      .subscribe(() =>
        this.store
          .select(selectErrorFriendship)
          .pipe(take(1))
          .subscribe((error) => {
            if (error) {
              console.error(
                `Error deleting friendship: ${error.message}, CODE: ${error.statusCode}`
              );
              this.dialog.open(ErrorModalComponent, {
                maxWidth: '380px',
                data: {
                  errorMessage: error.message,
                  statusCode: error.statusCode,
                },
              });
            }
            this.sendPushNotification('notifyConfirmFriendship');
            this.isUpdating.set(false);
          })
      );
  }

  sendPushNotification(type: string) {
    switch (type) {
      case 'notifyConfirmFriendship':
        console.log('Sending push notification to new friend');
        this.pushTokenService
          .sendPushNotificationToUserNoCheck(
            this.friendship()!.friend,
            'notifyConfirmFriendship',
            {
              friendName: `${this.myProfile()!.nameFirst} ${
                this.myProfile()!.nameLast
              }`,
              friendUserID: this.myProfile()!.userID,
            }
          )
          .subscribe();
        return null;
      default:
        return null;
    }
  }

  onDeclineRequest() {
    this.store.dispatch(
      FriendshipActions.deleteFriendship({
        friendshipID: this.friendship()!.friendshipID,
      })
    );
  }
}
