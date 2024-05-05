import { CommonModule } from '@angular/common';
import { Component, WritableSignal, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, take } from 'rxjs';
import { OnboardingMessageModalComponent } from 'src/app/onboarding/ui/message-modal/onboarding-message-modal.component';
import { ProfileActions } from 'src/app/profile/state/profile-actions';
import {
  selectError,
  selectProfile,
  selectUpdating,
} from 'src/app/profile/state/profile-selectors';
import { StringsService } from 'src/app/shared/utils/strings';

@Component({
  selector: 'dl-onboarding',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './onboarding.component.html',
})
export class OnboardingComponent {
  private profile: WritableSignal<any> = signal(null);
  isLoading: WritableSignal<boolean> = signal(false);
  modalOpen: WritableSignal<boolean> = signal(false);
  constructor(
    public dialog: MatDialog,
    private store: Store,
    public router: Router,
    private stringsService: StringsService
  ) {}

  ngOnInit() {
    this.store.select(selectProfile).subscribe((profile) => {
      if (!profile || !profile.onboardingState) {
        this.router.navigate(['/loading']);
      }
      this.profile.set(profile);
      if (profile.onboardingState === 0.5) {
        this.onboardingHandler(0.5);
      } else {
        this.router.navigate(['/recipes/discover']);
      }
    });
  }

  onboardingHandler(onboardingState: number) {
    if (onboardingState === 0.5) {
      // if profile already has all needed info, proceed to next step
      const profile = this.profile();
      if (
        profile.username &&
        profile.nameFirst &&
        profile.nameLast &&
        profile.city &&
        profile.state
      ) {
        this.isLoading.set(true);
        this.store.dispatch(
          ProfileActions.updateProfileProperty({
            property: 'onboardingState',
            value: 1,
          })
        );
        this.store
          .select(selectUpdating)
          .pipe(
            filter((updating) => !updating),
            take(1)
          )
          .subscribe(() => {
            this.store
              .select(selectError)
              .pipe(take(1))
              .subscribe((error) => {
                if (error) {
                  console.error(
                    `Error updating onboarding state: ${error.message}, CODE: ${error.statusCode}`
                  );
                } else {
                  this.router.navigate(['/recipes/discover']);
                }
              });
          });
      } else {
        if (!this.modalOpen()) {
          this.modalOpen.set(true);
          const dialogRef = this.dialog.open(OnboardingMessageModalComponent, {
            data: {
              message: this.stringsService.onboardingStrings.collectUserDetails,
              currentStep: 0.5,
              showNextButton: false,
              username: this.profile().username,
              nameFirst: this.profile().nameFirst,
              nameLast: this.profile().nameLast,
              city: this.profile().city,
              state: this.profile().state,
            },
            position: {
              top: '10%',
            },
          });
          dialogRef.afterClosed().subscribe((result) => {
            this.modalOpen.set(false);
            if (result !== 'success') {
              this.onboardingCallback();
            } else {
              this.router.navigate(['/recipes/discover']);
            }
          });
        }
      }
    } else {
      this.router.navigate(['/recipes/discover']);
    }
  }

  onboardingCallback() {
    setTimeout(() => {
      this.onboardingHandler(this.profile().onboardingState);
    }, 1000);
  }
}
