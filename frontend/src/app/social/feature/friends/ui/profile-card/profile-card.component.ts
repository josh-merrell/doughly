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
import { PushTokenService } from 'src/app/shared/utils/pushTokenService';
import { AuthService } from 'src/app/shared/utils/authenticationService';
import { StylesService } from 'src/app/shared/utils/stylesService';
import { ImageFromCDN } from 'src/app/shared/utils/imageFromCDN.pipe';


@Component({
  selector: 'dl-profile-card',
  standalone: true,
  imports: [CommonModule, ImageFromCDN],
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

  constructor(
    private store: Store,
    private pushTokenService: PushTokenService,
    private authService: AuthService,
    private stylesService: StylesService
  ) {}

  ngOnInit(): void {
    this.initials = this.profile.nameFirst[0] + this.profile.nameLast[0];

    this.store
      .select(selectFriendshipByFriendID(this.profile.userID))
      .subscribe((friendship) => {
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

  pingUser() {
    console.log('Pinging user: ', this.profile.userID);
    // get the push token(s) for the user
    this.pushTokenService.getOtherUserPushTokens(this.profile.userID).subscribe(
      (pushTokens) => {
        console.log('Got push tokens for user: ', pushTokens);
        // send a push notification to the user
        pushTokens.forEach((pushToken) => {
          console.log('Sending push notification to user: ', pushToken);
          // send push notification
        });
      },
      (error) => {
        console.error('Error getting push tokens for user: ', error);
      }
    );
  }

  getFillColor(index: number): string {
    const darkMode = this.authService.profile()?.darkMode;
    switch (index) {
      case 1:
        return darkMode
          ? this.stylesService.getHex('pink-6')
          : this.stylesService.getHex('pink-4');
      default:
        return darkMode
          ? this.stylesService.getHex('pink-6')
          : this.stylesService.getHex('pink-4');
    }
  }
}
