import {
  Component,
  Inject,
  WritableSignal,
  effect,
  signal,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';

import { ManualAddRecipeModalComponent } from '../manual-add-recipe-modal/manual-add-recipe-modal.component';
import { VisionAddRecipeModalComponent } from '../vision-add-recipe-modal/vision-add-recipe-modal.component';
import { FromUrlAddRecipeModalComponent } from '../from-url-add-recipe-modal/from-url-add-recipe-modal.component';
import { RecipeCategory } from 'src/app/recipes/state/recipe-category/recipe-category-state';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { StringsService } from 'src/app/shared/utils/strings';
import { Store } from '@ngrx/store';
import { selectProfile } from 'src/app/profile/state/profile-selectors';
import { OnboardingMessageModalComponent } from 'src/app/onboarding/ui/message-modal/onboarding-message-modal.component';

@Component({
  selector: 'dl-add-recipe-modal',
  standalone: true,
  imports: [CommonModule, ManualAddRecipeModalComponent],
  templateUrl: './add-recipe-modal.component.html',
})
export class AddRecipeModalComponent {
  recipeCategories: RecipeCategory[] = [];
  public profile: WritableSignal<any> = signal(null);

  // Onboarding
  public showOnboardingBadge: WritableSignal<boolean> = signal(false);
  public onboardingModalOpen: WritableSignal<boolean> = signal(false);
  private reopenOnboardingModal: WritableSignal<boolean> = signal(true);

  constructor(
    public dialogRef: MatDialogRef<AddRecipeModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialog: MatDialog,
    public route: ActivatedRoute,
    public router: Router,
    public location: Location,
    private store: Store,
    private stringsService: StringsService
  ) {
    this.recipeCategories = this.data.recipeCategories;

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

  ngOnInit() {
    // Check the initial URL
    this.checkUrlAndAct(this.location.path());

    // Listen for future URL changes
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        ),
        map((event) => event as NavigationEnd)
      )
      .subscribe((navigationEndEvent) => {
        this.checkUrlAndAct(navigationEndEvent.urlAfterRedirects);
      });

    this.store.select(selectProfile).subscribe((profile) => {
      this.profile.set(profile);
    });
  }

  private checkUrlAndAct(fullUrl: string) {
    if (fullUrl.includes('/vision')) {
      this.onVisionAddClick();
    }
    if (fullUrl.includes('/from-url')) {
      this.onFromUrlAddClick();
    }
    // Any other URL checks can be added here
  }

  onManualAddClick(): void {
    const dialogRef = this.dialog.open(ManualAddRecipeModalComponent, {
      data: {
        recipeCategories: this.data.categories,
      },
      width: '90%',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'success') {
        this.dialogRef.close('success');
      }
    });
  }

  onVisionAddClick(): void {
    // update url to include '/vision' if it's not already there
    this.location.go('/recipes/created/add/vision');

    const dialogRef = this.dialog.open(VisionAddRecipeModalComponent, {
      width: '90%',
    });
    dialogRef.afterClosed().subscribe((result) => {
      // remove '/vision' from the url
      this.location.go('/recipes/created/add');
      if (result === 'success') {
        this.dialogRef.close('success');
      }
    });
  }

  onFromUrlAddClick(): void {
    // update url to include '/from-url' if it's not already there
    this.location.go('/recipes/created/add/from-url');

    const dialogRef = this.dialog.open(FromUrlAddRecipeModalComponent, {
      width: '90%',
    });
    dialogRef.afterClosed().subscribe((result) => {
      // remove '/from-url' from the url
      this.location.go('/recipes/created/add');
      if (result === 'success') {
        this.dialogRef.close('success');
      }
    });
  }

  onDestroy() {
    this.dialogRef.close();
  }

  onboardingHandler(onboardingState: number): void {
    if (onboardingState === 9) {
      this.showOnboardingBadge.set(false);
      this.reopenOnboardingModal.set(false);
      this.onboardingModalOpen.set(true);
      const dialogRef = this.dialog.open(OnboardingMessageModalComponent, {
        data: {
          message: this.stringsService.onboardingStrings.recipeCreateManual,
          currentStep: 9,
          showNextButton: true,
        },
        position: {
          bottom: '10%',
        },
      });
      dialogRef.afterClosed().subscribe(() => {
        this.onboardingModalOpen.set(false);
        this.showOnboardingBadge.set(true);
      });
    } else if (onboardingState === 10) {
      this.showOnboardingBadge.set(false);
      this.reopenOnboardingModal.set(false);
      this.onboardingModalOpen.set(true);
      const dialogRef = this.dialog.open(OnboardingMessageModalComponent, {
        data: {
          message: this.stringsService.onboardingStrings.recipeCreateURL,
          currentStep: 10,
          showNextButton: true,
        },
        position: {
          bottom: '30%',
        },
      });
      dialogRef.afterClosed().subscribe(() => {
        this.onboardingModalOpen.set(false);
        this.showOnboardingBadge.set(true);
      });
    } else if (onboardingState === 11) {
      this.showOnboardingBadge.set(false);
      this.reopenOnboardingModal.set(false);
      this.onboardingModalOpen.set(true);
      const dialogRef = this.dialog.open(OnboardingMessageModalComponent, {
        data: {
          message: this.stringsService.onboardingStrings.recipeCreateImageButton,
          currentStep: 11,
          showNextButton: true,
        },
        position: {
          bottom: '60%',
        },
      });
      dialogRef.afterClosed().subscribe(() => {
        this.onboardingModalOpen.set(false);
        this.showOnboardingBadge.set(true);
      });
    }
  }

  onboardingBadgeClick() {
    this.showOnboardingBadge.set(false);
    this.onboardingHandler(this.profile().onboardingState);
  }
}
