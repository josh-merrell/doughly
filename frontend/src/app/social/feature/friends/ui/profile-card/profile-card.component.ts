import {
  Component,
  EventEmitter,
  Input,
  Output,
  WritableSignal,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Profile } from 'src/app/profile/state/profile-state';
import { Friendship } from 'src/app/social/state/friendship-state';
import { Store } from '@ngrx/store';
import { selectFriendshipByFriendID } from 'src/app/social/state/friendship-selectors';
import { selectFollowshipByFollowingID } from 'src/app/social/state/followship-selectors';

@Component({
  selector: 'dl-profile-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-card.component.html',
})
export class ProfileCardComponent {
  @Input() profile!: Profile;
  @Input() index!: number;
  @Input() selectedIndex!: number;
  @Output() friendshipLoaded = new EventEmitter<any>();
  @Output() followshipLoaded = new EventEmitter<any>();
  public friendship: WritableSignal<Friendship | null> = signal(null);
  public followship: WritableSignal<Friendship | null> = signal(null);
  public initials: string = '';

  constructor(private store: Store) {}

  ngOnInit(): void {
    console.log(`PROFILE: `, this.profile)
    this.initials = this.profile.nameFirst[0] + this.profile.nameLast[0];

    this.store
      .select(selectFriendshipByFriendID(this.profile.userID))
      .subscribe((friendship) => {
        console.log(`FRIENDSHIP: `, friendship)
        this.friendship.set(friendship);
        this.friendshipLoaded.emit(
          friendship
            ? {
                status: friendship.status,
                friendshipID: friendship.friendshipID,
              }
            : { status: '', friendshipID: 0 }
        );
      });

    this.store
      .select(selectFollowshipByFollowingID(this.profile.userID))
      .subscribe((followship) => {
        this.followship.set(followship);
        this.followshipLoaded.emit(
          followship
            ? { exists: true, followshipID: followship.followshipID }
            : { exists: false, followshipID: 0 }
        );
      });
  }
}
