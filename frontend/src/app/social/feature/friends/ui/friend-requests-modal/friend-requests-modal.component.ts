import { Component, Inject, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Profile } from 'src/app/profile/state/profile-state';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { selectFriendRequests } from 'src/app/profile/state/profile-selectors';
import { RequestCardComponent } from '../request-card/request-card.component';

@Component({
  selector: 'dl-friend-requests-modal',
  standalone: true,
  imports: [CommonModule, RequestCardComponent],
  templateUrl: './friend-requests-modal.component.html',
})
export class FriendRequestsModalComponent {
  public friendRequests: WritableSignal<Profile[]> = signal([]);

  constructor(
    private store: Store,
    public dialogRef: MatDialogRef<FriendRequestsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.store.select(selectFriendRequests).subscribe((friendRequests) => {
      this.friendRequests.set(friendRequests);
    });
  }

  onFriendCardClicked(event: MouseEvent, friend: Profile) {
    const clickedElement = event.target as HTMLElement;

    // Check if the clicked element or its parent has the 'declineRequest' id
    if (
      clickedElement.id === 'declineRequest' ||
      clickedElement.parentElement?.id === 'declineRequest'
    ) {
      this.dialogRef.close();
    } else {
      this.dialogRef.close({ profile: friend });
    }
  }
}
