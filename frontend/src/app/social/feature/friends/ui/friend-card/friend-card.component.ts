import { Input, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Friendship } from 'src/app/social/state/friendship-state';

@Component({
  selector: 'dl-friend-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './friend-card.component.html',
})
export class FriendCardComponent {
  @Input() friend!: Friendship;
  public initials: string = '';

  ngOnInit(): void {
    console.log('FRIEND: ', this.friend);
    this.initials = this.friend.friendNameFirst[0] + this.friend.friendNameLast[0];
  }

}
