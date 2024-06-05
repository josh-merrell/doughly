import {
  Component,
  WritableSignal,
  computed,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Friendship } from '../../state/friendship-state';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { selectFriendships } from '../../state/friendship-selectors';
import {
  selectFriendRequests,
  selectFriends,
  selectProfile,
} from 'src/app/profile/state/profile-selectors';
import { FriendCardComponent } from './ui/friend-card/friend-card.component';
import { FriendModalComponent } from './ui/friend-modal/friend-modal.component';
import { Profile } from 'src/app/profile/state/profile-state';
import { FriendRequestsModalComponent } from './ui/friend-requests-modal/friend-requests-modal.component';
import { AddFriendModalComponent } from './ui/add-friend-modal/add-friend-modal.component';
import { StringsService } from 'src/app/shared/utils/strings';
import { OnboardingMessageModalComponent } from 'src/app/onboarding/ui/message-modal/onboarding-message-modal.component';
import { ModalService } from 'src/app/shared/utils/modalService';
import { ExtraStuffService } from 'src/app/shared/utils/extraStuffService';
import { Router } from '@angular/router';

@Component({
  selector: 'dl-friends',
  standalone: true,
  imports: [CommonModule, FriendCardComponent],
  templateUrl: './friends.component.html',
})
export class FriendsComponent {
  public friendships: WritableSignal<Friendship[]> = signal([]);
  public friends: WritableSignal<Profile[]> = signal([]);
  private profile: WritableSignal<any> = signal(null);

  // Onboarding
  public showOnboardingBadge: WritableSignal<boolean> = signal(false);
  public onboardingModalOpen: WritableSignal<boolean> = signal(false);
  private reopenOnboardingModal: WritableSignal<boolean> = signal(true);

  public filteredFriends = computed(() => {
    const searchFilter = this.searchFilter();
    let friends = this.friends();
    if (searchFilter) {
      return friends.filter((friend) => {
        return (
          friend.nameFirst.toLowerCase().includes(searchFilter.toLowerCase()) ||
          friend.nameLast.toLowerCase().includes(searchFilter.toLowerCase()) ||
          friend.username.toLowerCase().includes(searchFilter.toLowerCase())
        );
      });
    } else {
      return friends;
    }
  });
  public requests: WritableSignal<Profile[]> = signal([]);
  public searchFilter: WritableSignal<string> = signal('');

  constructor(
    private store: Store,
    public dialog: MatDialog,
    private stringsService: StringsService,
    private modalService: ModalService,
    public extraStuffService: ExtraStuffService,
    private router: Router
  ) {
    effect(
      () => {
        const profile = this.profile();
        if (!profile || profile.onboardingState === 0) return;
        if (!this.onboardingModalOpen() && this.reopenOnboardingModal()) {
          this.onboardingHandler(profile.onboardingState);
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit(): void {
    this.store.select(selectProfile).subscribe((profile) => {
      this.profile.set(profile);
    });
    this.store.select(selectFriendships).subscribe((friendships: any) => {
      this.friendships.set(friendships);
    });

    this.store.select(selectFriends).subscribe((friends: any) => {
      this.friends.set(
        [...friends].sort((a, b) => {
          const nameA = a.nameLast?.toLowerCase() || '';
          const nameB = b.nameLast?.toLowerCase() || '';

          if (nameA < nameB) return -1;
          if (nameA > nameB) return 1;
          return 0;
        })
      );
    });

    this.store.select(selectFriendRequests).subscribe((friendRequests) => {
      this.requests.set(friendRequests);
    });
  }

  onRequestsClick(): void {
    const ref = this.modalService.open(
      FriendRequestsModalComponent,
      {
        width: '90%',
        maxWidth: '500px',
      },
      1
    );

    if (ref) {
      //upon closing, if a profile is sent back, use it to open FriendModalComponent.
      ref.afterClosed().subscribe((result) => {
        if (result?.profile) {
          this.modalService.open(
            FriendModalComponent,
            {
              data: result.profile,
              width: '90%',
            },
            1
          );
        }
      });
    } else {
    }
  }

  onAddFriend(): void {
    this.modalService.open(
      AddFriendModalComponent,
      {
        width: '90%',
        maxWidth: '500px',
      },
      1
    );
  }

  onFriendClick(friend: any): void {
    this.modalService.open(
      FriendModalComponent,
      {
        data: friend,
        width: '90%',
      },
      1
    );
  }

  updateSearchFilter(searchFilter: string): void {
    this.searchFilter.set(searchFilter);
  }

  onboardingHandler(onboardingState: number): void {
    if (onboardingState === 2) {
      this.showOnboardingBadge.set(false);
      this.reopenOnboardingModal.set(false);
      this.onboardingModalOpen.set(true);
      this.modalService.closeAll();
      const ref = this.modalService.open(
        OnboardingMessageModalComponent,
        {
          data: {
            message: this.stringsService.onboardingStrings.socialPageOverview,
            currentStep: 2,
            showNextButton: true,
          },
          position: {
            top: '30%',
          },
        },
        1
      );
      if (ref) {
        ref.afterClosed().subscribe((result) => {
          this.onboardingModalOpen.set(false);
          this.showOnboardingBadge.set(true);
          if (result === 'nextClicked') {
            this.onboardingCallback();
          }
        });
      }
    } else {
      this.router.navigate(['/tempRoute']);
    }
    // ** OLD ONBOARDING STEPS **
    // if (onboardingState === 6) {
    //   this.showOnboardingBadge.set(false);
    //   this.reopenOnboardingModal.set(false);
    //   this.onboardingModalOpen.set(true);
    //   const ref = this.modalService.open(
    //     OnboardingMessageModalComponent,
    //     {
    //       data: {
    //         message: this.stringsService.onboardingStrings.socialPageOverview,
    //         currentStep: 6,
    //         showNextButton: true,
    //       },
    //       position: {
    //         bottom: '70%',
    //       },
    //     },
    //     1
    //   );
    //   if (ref) {
    //     ref.afterClosed().subscribe((result) => {
    //       this.onboardingModalOpen.set(false);
    //       this.showOnboardingBadge.set(true);
    //       if (result === 'nextClicked') {
    //         this.onboardingCallback();
    //       }
    //     });
    //   } else {
    //   }
    // } else if (onboardingState === 7) {
    //   this.showOnboardingBadge.set(false);
    //   this.reopenOnboardingModal.set(false);
    //   this.onboardingModalOpen.set(true);
    //   const ref = this.modalService.open(
    //     OnboardingMessageModalComponent,
    //     {
    //       data: {
    //         message: this.stringsService.onboardingStrings.shoppingPageOverview,
    //         currentStep: 7,
    //         showNextButton: false,
    //       },
    //       position: {
    //         bottom: '40%',
    //       },
    //     },
    //     1
    //   );
    //   if (ref) {
    //     ref.afterClosed().subscribe(() => {
    //       this.onboardingModalOpen.set(false);
    //       this.showOnboardingBadge.set(true);
    //     });
    //   } else {
    //   }
    // }
  }

  onboardingCallback() {
    setTimeout(() => {
      this.onboardingHandler(this.profile().onboardingState);
    }, 1000);
  }

  onboardingBadgeClick() {
    this.showOnboardingBadge.set(false);
    this.onboardingHandler(this.profile().onboardingState);
  }
}
