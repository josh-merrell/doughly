import { Input, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Profile } from 'src/app/profile/state/profile-state';
import { ImageFromCDN } from 'src/app/shared/utils/imageFromCDN.pipe';


@Component({
  selector: 'dl-friend-card',
  standalone: true,
  imports: [CommonModule, ImageFromCDN],
  templateUrl: './friend-card.component.html',
})
export class FriendCardComponent {
  @Input() friend!: Profile;
  public initials: string = '';

  ngOnInit(): void {
    this.initials = this.friend.nameFirst[0] + this.friend.nameLast[0];
  }
}
