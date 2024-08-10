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
import { ExtraStuffService } from 'src/app/shared/utils/extraStuffService';
import { Observable, from } from 'rxjs';

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
    private stylesService: StylesService,
    public extraStuffService: ExtraStuffService
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
    const systemDarkMode = this.extraStuffService.systemDarkMode();

    const useDarkMode =
      darkMode === 'Enabled' ||
      (darkMode === 'System Default' && systemDarkMode);

    switch (index) {
      case 1:
        return useDarkMode
          ? this.stylesService.getHex('pinknew-7')
          : this.stylesService.getHex('pinknew-4');
      case 2:
        return useDarkMode
          ? this.stylesService.getHex('tan-10')
          : this.stylesService.getHex('tan-1');
      case 3:
        return useDarkMode
          ? this.stylesService.getHex('tan-7')
          : this.stylesService.getHex('tan-4');
      default:
        return useDarkMode
          ? this.stylesService.getHex('pinknew-7')
          : this.stylesService.getHex('pinknew-4');
    }
  }

  getFillColorObservable(index: number): Observable<string> {
    return from(this.getFillColor(index));
  }

  getFillColorAsync(): Observable<string> {
    const status = this.friendship()?.status;
    if (
      status === 'confirmed' ||
      status === 'requesting' ||
      status === 'receivedRequest'
    ) {
      return this.getFillColorObservable(2);
    }
    return this.getFillColorObservable(3);
  }
}
