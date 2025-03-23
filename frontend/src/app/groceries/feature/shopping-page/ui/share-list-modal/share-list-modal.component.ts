import {
  Component,
  Inject,
  Input,
  WritableSignal,
  signal,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { ProfileCardComponent } from 'src/app/social/feature/friends/ui/profile-card/profile-card.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { ExtraStuffService } from 'src/app/shared/utils/extraStuffService';
import { ShoppingListActions } from 'src/app/groceries/state/shopping-list-actions';
import {
  selectLoading,
  selectError,
} from 'src/app/groceries/state/shopping-list-selectors';
import { filter, take } from 'rxjs';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { ModalService } from 'src/app/shared/utils/modalService';
import { ConfirmationModalComponent } from 'src/app/shared/ui/confirmation-modal/confirmation-modal.component';
import { selectProfile } from 'src/app/profile/state/profile-selectors';
import { PushTokenService } from 'src/app/shared/utils/pushTokenService';

@Component({
  selector: 'dl-share-list-modal',
  standalone: true,
  imports: [CommonModule, ProfileCardComponent, MatProgressSpinnerModule],
  templateUrl: './share-list-modal.component.html',
})
export class ShareListModalComponent {
  public friendsNotShared: WritableSignal<any[]> = signal([]);
  public selectedCard: WritableSignal<number> = signal(999);
  public buttonTexts: WritableSignal<any[]> = signal([]);
  public isLoading: WritableSignal<boolean> = signal(false);
  private profile: WritableSignal<any> = signal(null);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private dialogRef: MatDialogRef<ShareListModalComponent>,
    public extraStuffService: ExtraStuffService,
    private modalService: ModalService,
    private pushTokenService: PushTokenService
  ) {}

  ngOnInit(): void {
    this.data.friendsNotShared = this.data.friendsNotShared.filter(
      (friend) => friend.username !== null
    );
    this.store.select(selectProfile).subscribe((profile) => {
      this.profile.set(profile);
    });
    this.data.friendsNotShared.sort((a, b) => {
      if (a.nameFirst < b.nameFirst) {
        return -1;
      }
      if (a.nameFirst > b.nameFirst) {
        return 1;
      }
      return 0;
    });
    this.friendsNotShared.set(this.data.friendsNotShared);
  }

  onExitClick() {
    this.dialogRef.close();
  }

  onCardClick(index: number): void {
    this.selectedCard.set(index);
  }

  onShareClick(): void {
    if (this.selectedCard() === 999) {
      return;
    }
    // use selectedCard to find friend profile
    const friend = this.friendsNotShared().filter(
      (_, index) => index === this.selectedCard()
    )[0];
    this.isLoading.set(true);
    this.store.dispatch(
      ShoppingListActions.shareList({
        shoppingListID: this.data.shoppingListID,
        invitedUserID: friend.userID,
      })
    );
    this.store
      .select(selectLoading)
      .pipe(filter((loading) => !loading),take(1))
      .subscribe(() => {
        this.store
          .select(selectError)
          .pipe(take(1))
          .subscribe((error) => {
            this.isLoading.set(false);
            if (error) {
              this.modalService.open(
                ErrorModalComponent,
                {
                  maxWidth: '380px',
                  data: {
                    errorMessage: error.message,
                    statusCode: error.statusCode,
                  },
                },
                2,
                true,
                'ErrorModalComponent'
              );
            } else {
              this.sendPushNotification(friend.userID);
              this.modalService.open(
                ConfirmationModalComponent,
                {
                  maxWidth: '380px',
                  data: {
                    confirmationMessage: `List shared with ${friend.username}`,
                  },
                },
                2,
                false,
                'ConfirmationModalComponent'
              );
              this.dialogRef.close();
            }
          });
      });
  }

  sendPushNotification(friendUserID) {
    if (!friendUserID) {
      return;
    }
    this.pushTokenService
      .sendPushNotificationToUserNoCheck(
        friendUserID,
        'notifyFriendListShare',
        {
          friendUsername: this.profile().username,
        }
      )
      .subscribe(
        () => {},
        (error) => {
          console.error(
            'Error sending push notification after sharing list: ',
            error
          );
        }
      );
  }

  onFriendshipLoaded(index: number, friendship: any): void {
    return;
  }

  onFollowshipLoaded(index: number, followship: any): void {
    return;
  }
}
