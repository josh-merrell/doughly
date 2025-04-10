import { Component, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Store } from '@ngrx/store';
import { Observable, filter, take } from 'rxjs';
import {
  selectError as selectErrorProfile,
  selectLoading as selectLoadingProfile,
  selectProfile,
  selectSearchResults as selectSearchResultsProfile,
} from 'src/app/profile/state/profile-selectors';
import { ProfileActions } from 'src/app/profile/state/profile-actions';
import { ProfileCardComponent } from '../profile-card/profile-card.component';
import { FriendshipActions } from 'src/app/social/state/friendship-actions';
import { FollowshipActions } from 'src/app/social/state/followship-actions';
import { environment } from 'src/environments/environment';
import {
  selectDeleting as selectDeletingFriendship,
  selectUpdating as selectUpdatingFriendship,
  selectError as selectErrorFriendship,
  selectAdding as selectAddingFriendship,
} from 'src/app/social/state/friendship-selectors';
import {
  selectLoading as selectLoadingFollowship,
  selectAdding as selectAddingFollowship,
  selectDeleting as selectDeletingFollowship,
  selectError as selectErrorFollowship,
} from 'src/app/social/state/followship-selectors';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { PushTokenService } from 'src/app/shared/utils/pushTokenService';
import { ModalService } from 'src/app/shared/utils/modalService';
import { ExtraStuffService } from 'src/app/shared/utils/extraStuffService';
import { Clipboard } from '@capacitor/clipboard';
import { ConfirmationModalComponent } from 'src/app/shared/ui/confirmation-modal/confirmation-modal.component';
import { Capacitor } from '@capacitor/core';

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
  private profile: WritableSignal<any> = signal({});

  constructor(
    private store: Store,
    public dialog: MatDialog,
    private pushTokenService: PushTokenService,
    private modalService: ModalService,
    private dialogRef: MatDialogRef<AddFriendModalComponent>,
    public extraStuffService: ExtraStuffService
  ) {
    this.store.select(selectSearchResultsProfile).subscribe((searchResults) => {
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
    this.store.select(selectProfile).subscribe((profile) => {
      this.profile.set(profile);
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
    this.searchedQuery.set(this.searchFilter());
    this.isLoading.set(true);
    this.store.dispatch(
      ProfileActions.searchProfiles({ searchQuery: this.searchFilter() })
    );
    this.store
      .select(selectErrorProfile)
      .pipe(
        filter((loading) => !loading),
        take(1)
      )
      .subscribe(() => {
        this.store
          .select(selectErrorProfile)
          .pipe(take(1))
          .subscribe((error) => {
            if (error) {
              console.error(
                `Error searching profiles: ${error.message}, CODE: ${error.statusCode}`
              );
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
            }
            this.isLoading.set(false);
          });
      });
  }

  async onInvite() {
    console.log('Share clicked');
    await Clipboard.write({
      // this will send the social crawler to get the link preview details for app invite. Users will be redirected to the app/play store.
      string: `${environment.BACKEND}/link-previews/invite`,
    });
    let confirmationMessage = 'Link copied to clipboard! Share via Whatsapp';
    if (Capacitor.isNativePlatform()) {
      const platform = Capacitor.getPlatform();
      if (platform === 'android') {
        confirmationMessage += ' or SMS.';
      } else if (platform === 'ios') {
        confirmationMessage += ' or iMessage.';
      }
    }

    this.modalService.open(
      ConfirmationModalComponent,
      {
        data: {
          confirmationMessage,
        },
      },
      1,
      true,
      'ConfirmationModalComponent'
    );
  }

  onFriendButtonClick(): void {
    switch (this.friendshipStatuses()[this.selectedCard()].status) {
      case 'confirmed':
        this.isLoading.set(true);
        this.store.dispatch(
          FriendshipActions.deleteFriendship({
            friendshipID:
              this.friendshipStatuses()[this.selectedCard()].friendshipID,
          })
        );
        this.store
          .select(selectDeletingFriendship)
          .pipe(
            filter((deleting) => !deleting),
            take(1)
          )
          .subscribe(() => {
            this.store
              .select(selectErrorFriendship)
              .pipe(take(1))
              .subscribe((error) => {
                if (error) {
                  console.error(
                    `Error deleting friendship: ${error.message}, CODE: ${error.statusCode}`
                  );
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
                }
                this.isLoading.set(false);
              });
          });
        break;
      case 'receivedRequest':
        this.isLoading.set(true);
        this.store.dispatch(
          FriendshipActions.editFriendship({
            friendshipID:
              this.friendshipStatuses()[this.selectedCard()].friendshipID,
            newStatus: 'confirmed',
          })
        );
        this.store
          .select(selectUpdatingFriendship)
          .pipe(
            filter((updating) => !updating),
            take(1)
          )
          .subscribe(() => {
            this.store
              .select(selectErrorFriendship)
              .pipe(take(1))
              .subscribe((error) => {
                if (error) {
                  console.error(
                    `Error accepting friendship: ${error.message}, CODE: ${error.statusCode}`
                  );
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
                }
                // notify user of confirmed friendship
                this.sendPushNotification('notifyConfirmFriendship');
                this.isLoading.set(false);
              });
          });
        break;
      case 'requesting':
        this.isLoading.set(true);
        this.store.dispatch(
          FriendshipActions.deleteFriendship({
            friendshipID:
              this.friendshipStatuses()[this.selectedCard()].friendshipID,
          })
        );
        this.store
          .select(selectDeletingFriendship)
          .pipe(
            filter((deleting) => !deleting),
            take(1)
          )
          .subscribe(() => {
            this.store
              .select(selectErrorFriendship)
              .pipe(take(1))
              .subscribe((error) => {
                if (error) {
                  console.error(
                    `Error canceling friendship request: ${error.message}, CODE: ${error.statusCode}`
                  );
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
                }
                this.isLoading.set(false);
              });
          });
        break;
      default:
        this.isLoading.set(true);
        this.store.dispatch(
          FriendshipActions.addFriendship({
            friend: this.searchResults()[this.selectedCard()].userID,
          })
        );
        this.store
          .select(selectAddingFriendship)
          .pipe(
            filter((adding) => !adding),
            take(1)
          )
          .subscribe(() => {
            this.store
              .select(selectErrorFriendship)
              .pipe(take(1))
              .subscribe((error) => {
                if (error) {
                  console.error(
                    `Error adding friendship: ${error.message}, CODE: ${error.statusCode}`
                  );
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
                }
                // notify user of friend request
                this.sendPushNotification('notifyRequestFriendship');
                this.isLoading.set(false);
              });
          });
    }
  }

  onCardClick(index: number): void {
    this.selectedCard.set(index);
  }

  onFollowButtonClick(): void {
    switch (this.followshipStatuses()[this.selectedCard()].exists) {
      case true:
        this.isLoading.set(true);
        this.store.dispatch(
          FollowshipActions.deleteFollowship({
            followshipID:
              this.followshipStatuses()[this.selectedCard()].followshipID,
          })
        );
        this.store
          .select(selectDeletingFollowship)
          .pipe(
            filter((deleting) => !deleting),
            take(1)
          )
          .subscribe(() => {
            this.store
              .select(selectErrorFollowship)
              .pipe(take(1))
              .subscribe((error) => {
                if (error) {
                  console.error(
                    `Error deleting followship: ${error.message}, CODE: ${error.statusCode}`
                  );
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
                }
                this.isLoading.set(false);
              });
          });
        break;
      default:
        this.isLoading.set(true);
        this.store.dispatch(
          FollowshipActions.addFollowship({
            following: this.searchResults()[this.selectedCard()].userID,
          })
        );
        this.store
          .select(selectAddingFollowship)
          .pipe(
            filter((adding) => !adding),
            take(1)
          )
          .subscribe(() => {
            this.store
              .select(selectErrorFollowship)
              .pipe(take(1))
              .subscribe((error) => {
                if (error) {
                  console.error(
                    `Error adding followship: ${error.message}, CODE: ${error.statusCode}`
                  );
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
                }
                //notify user of followship request
                this.sendPushNotification('notifyNewFollower');
                this.isLoading.set(false);
              });
          });
    }
  }

  sendPushNotification(type: string) {
    switch (type) {
      case 'notifyConfirmFriendship':
        this.pushTokenService
          .getSearchResultUserPushTokensAndSendNotification(
            this.searchResults()[this.selectedCard()].userID,
            'notifyFriendRequest',
            'notifyConfirmFriendship',
            {
              friendName: `${this.profile().nameFirst} ${
                this.profile().nameLast
              }`,
              friendUserID: this.profile().userID,
            }
          )
          .subscribe(
            () => {},
            (error) => {
              console.error('Error sending push notification:', error);
            }
          );
        return null;

      case 'notifyRequestFriendship':
        this.pushTokenService
          .getSearchResultUserPushTokensAndSendNotification(
            this.searchResults()[this.selectedCard()].userID,
            'notifyFriendRequest',
            'notifyRequestFriendship',
            {
              requesterName: `${this.profile().nameFirst} ${
                this.profile().nameLast
              }`,
              requesterUserID: this.profile().userID,
            }
          )
          .subscribe(
            () => {},
            (error) => {
              console.error('Error sending push notification:', error);
            }
          );
        return null;
      case 'notifyNewFollower':
        this.pushTokenService
          .getSearchResultUserPushTokensAndSendNotification(
            this.searchResults()[this.selectedCard()].userID,
            'notifyNewFollower',
            'notifyNewFollower',
            {
              followerName: `${this.profile().nameFirst} ${
                this.profile().nameLast
              }`,
              followerUserID: this.profile().userID,
            }
          )
          .subscribe(
            () => {},
            (error) => {
              console.error('Error sending push notification:', error);
            }
          );
        return null;
      default:
        return null;
    }
  }

  onExitClick() {
    this.dialogRef.close();
  }
}
