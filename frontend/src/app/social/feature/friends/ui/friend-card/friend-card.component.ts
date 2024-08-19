import { Input, Component, signal, WritableSignal } from '@angular/core';
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
  recipeIcon: WritableSignal<string> = signal('');
  social: WritableSignal<string> = signal('');

  ngOnInit(): void {
    this.initials = this.friend.nameFirst[0] + this.friend.nameLast[0];
  }
}
