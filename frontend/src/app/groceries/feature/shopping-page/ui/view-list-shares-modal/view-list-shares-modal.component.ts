import { CommonModule } from '@angular/common';
import { Component, Inject, WritableSignal, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '@ngrx/store';
import { filter, take } from 'rxjs';
import { ShoppingListActions } from 'src/app/groceries/state/shopping-list-actions';
import {
  selectDeleting,
  selectError,
} from 'src/app/groceries/state/shopping-list-selectors';
import { ConfirmationModalComponent } from 'src/app/shared/ui/confirmation-modal/confirmation-modal.component';
import { ErrorModalComponent } from 'src/app/shared/ui/error-modal/error-modal.component';
import { ExtraStuffService } from 'src/app/shared/utils/extraStuffService';
import { ModalService } from 'src/app/shared/utils/modalService';
import { ProfileCardComponent } from 'src/app/social/feature/friends/ui/profile-card/profile-card.component';

@Component({
  selector: 'dl-view-list-shares-modal',
  standalone: true,
  imports: [CommonModule, ProfileCardComponent, MatProgressSpinnerModule],
  templateUrl: './view-list-shares-modal.component.html',
})
export class ViewListSharesModalComponent {
  public friendsShared: WritableSignal<any[]> = signal([]);
  public selectedCard: WritableSignal<number> = signal(999);
  public buttonTexts: WritableSignal<any[]> = signal([]);
  public isDeleting: WritableSignal<boolean> = signal(false);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private dialogRef: MatDialogRef<ViewListSharesModalComponent>,
    public extraStuffService: ExtraStuffService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.friendsShared.set(this.data.friendsShared);
  }

  onUnshareClick(): void {
    const friend = this.friendsShared().filter(
      (_, index) => index === this.selectedCard()
    )[0];
    this.isDeleting.set(true);
    this.store.dispatch(
      ShoppingListActions.unshareList({
        shoppingListID: this.data.shoppingListID,
        invitedUserID: friend.userID,
      })
    );
    this.store
      .select(selectDeleting)
      .pipe(
        filter((val) => !val),
        take(1)
      )
      .subscribe(() => {
        this.store
          .select(selectError)
          .pipe(take(1))
          .subscribe((error) => {
            this.isDeleting.set(false);
            if (error) {
              console.error('Error unsharing list: ', error);
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
              this.modalService.open(
                ConfirmationModalComponent,
                {
                  maxWidth: '380px',
                  data: {
                    confirmationMessage: `Removed ${friend.username}'s access to the shopping list.`,
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

  onCardClick(index: number): void {
    this.selectedCard.set(index);
  }

  onExitClick() {
    this.dialogRef.close();
  }

  onFriendshipLoaded(index: number, friendship: any): void {
    return;
  }

  onFollowshipLoaded(index: number, followship: any): void {
    return;
  }
}
