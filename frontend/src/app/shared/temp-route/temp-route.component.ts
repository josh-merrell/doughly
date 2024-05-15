import { Component, WritableSignal, signal } from '@angular/core';
import { RedirectPathService } from 'src/app/shared/utils/redirect-path.service';
import { Router, RouterLinkWithHref } from '@angular/router';
import { AuthService } from '../utils/authenticationService';
import { ExtraStuffService } from '../utils/extraStuffService';
import { Store } from '@ngrx/store';
import { ProfileActions } from 'src/app/profile/state/profile-actions';
import {
  selectError,
  selectProfile,
  selectUpdating,
} from 'src/app/profile/state/profile-selectors';
import { filter, take } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'dl-temp-route',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './temp-route.component.html',
})
export class TempRouteComponent {
  isLoading: WritableSignal<boolean> = signal(true);
  private profile: WritableSignal<any> = signal(null);
  constructor(
    private redirectPathService: RedirectPathService,
    private router: Router,
    private authService: AuthService,
    private extraStuffService: ExtraStuffService,
    private store: Store
  ) {}

  ngOnInit(): void {
    this.store.select(selectProfile).subscribe((profile) => {
      this.profile.set(profile);
    });
    const path = this.redirectPathService.getPath();
    const profile = this.profile();
    console.log('IN TEMP ROUTE. ONBOARDING STATE: ', profile?.onboardingState);
    switch (profile?.onboardingState) {
      case 0.5:
        this.router.navigate(['/onboarding']);
        break;
      case 1:
      case 2:
        this.router.navigate(['/recipes/discover']);
        break;
      case 3:
      case 4:
        if (this.extraStuffService.onboardingPublicRecipe()) {
          this.router.navigate([
            '/recipe/public/' + this.extraStuffService.onboardingPublicRecipe(),
          ]);
        } else {
          // set onboardingState back to 2 to have user select a recipe for routing again
          this.isLoading.set(true);
          console.log('onboardingPublicRecipe not set');
          this.store.dispatch(
            ProfileActions.updateProfileProperty({
              property: 'onboardingState',
              value: 2,
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
                    this.isLoading.set(false);
                    this.router.navigate(['/recipes/discover']);
                  }
                });
            });
        }
        break;
      case 5:
        if (path === '/social') {
          // advance onboardingState to 6
          this.isLoading.set(true);
          this.store.dispatch(
            ProfileActions.updateProfileProperty({
              property: 'onboardingState',
              value: 6,
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
                    this.isLoading.set(false);
                    this.router.navigate(['/social']);
                  }
                });
            });
        } else if (this.extraStuffService.onboardingSubscribedRecipe()) {
          console.log('onboardingSubscribedRecipe set, routing to it');
          this.router.navigate([
            '/recipe/' + this.extraStuffService.onboardingSubscribedRecipe(),
          ]);
        } else {
          // set onboardingState back to 2 to have user select a recipe for routing again
          this.isLoading.set(true);
          console.log('onboardingSubscribedRecipe not set');
          this.store.dispatch(
            ProfileActions.updateProfileProperty({
              property: 'onboardingState',
              value: 2,
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
                    this.isLoading.set(false);
                    this.router.navigate(['/recipes/discover'], {
                      onSameUrlNavigation: 'reload',
                    });
                  }
                });
            });
        }
        break;
      case 6:
        this.router.navigate(['/social']);
        break;
      case 7:
        this.router.navigate(['/groceries']);
        break;
      case 8:
        this.router.navigate(['/recipes/created']);
        break;
      case 9:
      case 10:
      case 11:
        this.router.navigate(['/recipes/created/add']);
        break;
      case 12:
        this.router.navigate(['/recipes/created/add/vision']);
        break;
      case 13:
      case 14:
      case 15:
        if (this.extraStuffService.onboardingVisionRecipe()) {
          this.router.navigate([
            '/recipe/' + this.extraStuffService.onboardingVisionRecipe(),
          ]);
        } else {
          // set onboardingState back to 12
          this.isLoading.set(true);
          this.store.dispatch(
            ProfileActions.updateProfileProperty({
              property: 'onboardingState',
              value: 12,
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
                    this.isLoading.set(false);
                    this.router.navigate(['/recipes/created/add/vision'], {
                      onSameUrlNavigation: 'reload',
                    });
                  }
                });
            });
        }
        break;
      default: // onboardingState 0 (done)
        if (path) {
          this.router.navigate([path], { onSameUrlNavigation: 'reload' });
        }
    }
  }
}
