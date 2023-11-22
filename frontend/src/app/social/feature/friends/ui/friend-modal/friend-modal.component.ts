import { Component, Inject, Input, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Friendship } from 'src/app/social/state/friendship-state';
import { Store } from '@ngrx/store';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SocialService } from 'src/app/social/data/social.service';
import { Profile } from 'src/app/profile/state/profile-state';

@Component({
  selector: 'dl-friend-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './friend-modal.component.html',
})
export class FriendModalComponent {
  public friend!: Profile;
  public initials: string = '';


  constructor(
    private store: Store,
    private dialogRef: MatDialogRef<FriendModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private socialService: SocialService,
  ) {}

  ngOnInit(): void {
    this.friend = this.data;
    this.initials = this.friend.nameFirst[0] + this.friend.nameLast[0];
  }

}
