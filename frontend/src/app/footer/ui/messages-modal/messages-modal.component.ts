import {
  Component,
  Inject,
  WritableSignal,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '@ngrx/store';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { UnitService } from 'src/app/shared/utils/unitService';
import {
  FolloweePublicRecipeCreatedData,
  IngredientStockExpiredData,
  Message,
} from 'src/app/footer/state/message-state';
import { selectMessages, selectLoading } from '../../state/message-selectors';
import { Router } from '@angular/router';
import { MessageActions } from '../../state/message-actions';
import { filter, take } from 'rxjs';

@Component({
  selector: 'dl-messages-modal',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './messages-modal.component.html',
})
export class MessagesModalComponent {
  public messages: WritableSignal<Message[]> = signal([]);
  sortedMessages: WritableSignal<Message[]> = signal([]);
  isUpdating: WritableSignal<boolean> = signal(false);
  public selectedMessageIndex: WritableSignal<number> = signal(-1);
  constructor(
    private store: Store,
    public dialog: MatDialog,
    private unitService: UnitService,
    public dialogRef: MatDialogRef<MessagesModalComponent>,
    private router: Router
  ) {
    effect(
      () => {
        const messages = this.messages();

        const unsortedMessages = messages.map((message) => ({
          ...message,
          // Assume the original date string is in ISO format and parse it directly
          date: new Date(message.date),
          displayDate: '', // Initialize a new property for the display date
        }));

        const sortedMessages = unsortedMessages.sort(
          (a, b) => b.date.getTime() - a.date.getTime()
        );

        // Adjust displayDate of each message. If message date is today, show time only; otherwise, show date only
        sortedMessages.forEach((message) => {
          const today = new Date();
          const messageDate = new Date(message.date); // message.date is already in local timezone if parsed directly from ISO string
          if (
            today.getDate() === messageDate.getDate() &&
            today.getMonth() === messageDate.getMonth() &&
            today.getFullYear() === messageDate.getFullYear()
          ) {
            // Format time to local, without leading zero for hour and no seconds
            message.displayDate = messageDate.toLocaleTimeString([], {
              hour: 'numeric', // 'numeric' hour: no leading zero
              minute: '2-digit', // minute always in two digits
            });
          } else {
            message.displayDate = messageDate.toLocaleDateString(); // Store formatted date in displayDate
          }
        });

        this.sortedMessages.set(sortedMessages);
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit() {
    this.store.select(selectMessages).subscribe((messages) => {
      this.messages.set(messages);
    });
    this.store.select(selectLoading).subscribe((loading) => {
      this.isUpdating.set(loading);
    });
  }

  onDeleteAll() {
    this.isUpdating.set(true);
    for (const message of this.sortedMessages()) {
      this.store.dispatch(MessageActions.deleteMessage({ message }));
    }
    this.onCancel();
  }

  onMessageSelect(message: Message, index: number) {
    if (this.selectedMessageIndex() === index) {
      this.selectedMessageIndex.set(-1);
    } else {
      this.selectedMessageIndex.set(index);
    }
  }

  onView(message: any, index: number) {
    this.onAck(message, index);
    switch (message.type) {
      case 'ingredientStockExpired':
        this.router.navigate(['/kitchen/ingredients']);
        this.onCancel();
        break;
      case 'ingredientOutOfStock':
        this.router.navigate(['/kitchen/ingredients']);
        this.onCancel();
        break;
      case 'newFollower':
        this.router.navigate(['/social/followers']);
        this.onCancel();
        break;
      case 'newFriend':
        this.router.navigate(['/social/friends']);
        this.onCancel();
        break;
      case 'newFriendRequest':
        this.router.navigate(['/social/friends']);
        this.onCancel();
        break;
      case 'followeePublicRecipeCreated':
        this.router.navigate([
          '/recipe/public',
          message.messageData.data.recipeID,
        ]);
        this.onCancel();
        break;
      case 'friendHeirloomRecipeCreated':
        this.router.navigate([
          '/recipe/public',
          message.messageData.data.recipeID,
        ]);
        this.onCancel();
        break;
      default:
        this.onCancel();
    }
  }

  onAck(message: Message, index: number) {
    this.isUpdating.set(true);
    this.store.dispatch(MessageActions.acknowledgeMessage({ message }));
    this.store
      .select(selectLoading)
      .pipe(
        filter((loading) => !loading),
        take(1)
      )
      .subscribe(() => {
        this.isUpdating.set(false);
      });
  }

  onDelete(message: Message, index: number) {
    this.isUpdating.set(true);
    this.store.dispatch(MessageActions.deleteMessage({ message }));
    this.store
      .select(selectLoading)
      .pipe(
        filter((loading) => !loading),
        take(1)
      )
      .subscribe(() => {
        this.isUpdating.set(false);
      });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
