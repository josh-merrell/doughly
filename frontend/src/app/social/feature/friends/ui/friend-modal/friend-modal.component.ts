import { Component, Inject, Input, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Friendship } from 'src/app/social/state/friendship-state';
import { Store } from '@ngrx/store';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SocialService } from 'src/app/social/data/social.service';

@Component({
  selector: 'dl-friend-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './friend-modal.component.html',
})
export class FriendModalComponent {
  public friend!: Friendship;
  public friendFriendships: WritableSignal<Friendship[]> = signal([]);
  public initials: string = '';


  constructor(
    private store: Store,
    private dialogRef: MatDialogRef<FriendModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private socialService: SocialService,
  ) {}

  ngOnInit(): void {
    this.friend = this.data;
    console.log(`FRIEND: `, this.friend)
    this.initials = this.friend.friendNameFirst[0] + this.friend.friendNameLast[0];
    this.socialService.getAllFriendships(this.friend.friend).subscribe((friendships) => {
      this.friendFriendships.set(friendships);
    });
  }

}
