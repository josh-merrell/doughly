import {
  Component,
  Inject,
  WritableSignal,
  effect,
  signal,
  Renderer2,
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
import { PrompUpgradeModalComponent } from 'src/app/account/feature/products/ui/promp-upgrade-modal/promp-upgrade-modal.component';
import { ProductService } from 'src/app/shared/utils/productService';
import { ModalService } from 'src/app/shared/utils/modalService';
import { ProfileActions } from 'src/app/profile/state/profile-actions';
import { ExtraStuffService } from 'src/app/shared/utils/extraStuffService';
import { AnimationOptions, LottieComponent } from 'ngx-lottie';
import { AnimationItem } from 'lottie-web';
import { Capacitor } from '@capacitor/core';
import { StylesService } from 'src/app/shared/utils/stylesService';

@Component({
  selector: 'dl-add-recipe-modal',
  standalone: true,
  imports: [CommonModule, ManualAddRecipeModalComponent, LottieComponent],
  templateUrl: './add-recipe-modal.component.html',
})
export class AddRecipeModalComponent {
  recipeCategories: RecipeCategory[] = [];
  public profile: WritableSignal<any> = signal(null);

  // Onboarding
  public showOnboardingBadge: WritableSignal<boolean> = signal(false);
  public onboardingModalOpen: WritableSignal<boolean> = signal(false);
  private reopenOnboardingModal: WritableSignal<boolean> = signal(true);

  // Lottie animation
  private animationItem: AnimationItem | undefined;
  private animation2Item: AnimationItem | undefined;
  animationOptions: AnimationOptions = {
    path: '/assets/animations/lottie/stars-dark.json',
    loop: true,
    autoplay: true,
  };
  lottieStyles = {
    position: 'absolute',
    right: '0',
    top: '0',
    height: '40px',
    width: '40px',
  };

  constructor(
    public dialogRef: MatDialogRef<AddRecipeModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialog: MatDialog,
    public route: ActivatedRoute,
    public router: Router,
    public location: Location,
    private store: Store,
    private stringsService: StringsService,
    private productService: ProductService,
    private modalService: ModalService,
    public extraStuffService: ExtraStuffService,
    private renderer: Renderer2,
    private stylesService: StylesService
  ) {
    this.recipeCategories = this.data.recipeCategories;

    effect(
      () => {
        const profile = this.profile();
        if (!profile || profile.onboardingState === 0) return;
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
      if (profile && profile.onboardingState !== 0) {
        this.showOnboardingBadge.set(true);
      }
      this.profile.set(profile);
    });
  }

  animationCreated(animationItem: AnimationItem): void {
    this.animationItem = animationItem;
    this.animationItem.setSpeed(1.8);
  }
  animation2Created(animationItem: AnimationItem): void {
    this.animation2Item = animationItem;
    this.animation2Item.pause();
    setTimeout(() => {
      this.animation2Item?.setSpeed(1.8);
      this.animation2Item?.play();
    }, 500);
  }
  loopComplete(): void {
    this.animationItem?.pause();
  }
  loop2Complete(): void {
    this.animation2Item?.stop();
  }

  private checkUrlAndAct(fullUrl: string) {
    console.log('fullUrl', fullUrl);
    if (fullUrl.includes('/vision')) {
      this.onVisionAddClick();
    }
    if (fullUrl.includes('/from-url')) {
      this.onFromUrlAddClick();
    }
    // Any other URL checks can be added here
  }

  onManualAddClick(): void {
    const dialogRef = this.modalService.open(
      ManualAddRecipeModalComponent,
      {
        data: {
          recipeCategories: this.data.categories,
        },
        width: '90%',
      },
      2
    );
    if (dialogRef) {
      dialogRef.afterClosed().subscribe((result) => {
        if (result === 'success') {
          this.dialogRef.close('success');
        }
      });
    } else {
    }
  }

  onVisionAddClick(): void {
    console.log('onVisionAddClick. isPremium: ', this.profile().isPremium);
    // first ensure user has at least one AI credit
    if (
      this.profile().permAITokenCount < 1 &&
      this.profile().isPremium === true
    ) {
      const dialogRef = this.modalService.open(
        PrompUpgradeModalComponent,
        {
          data: {
            titleMessage: this.stringsService.productStrings.timeToTopUp,
            promptMessage: `Your Premium Subscription will add ${
              this.productService.licences.premiumMonthlyAICredits
            } tokens on ${this.getNextTokenRefreshDate()}. Buy an extra pack now to create new recipes before then.`,
            buttonMessage: 'ADD MORE TOKENS',
          },
        },
        2
      );
      if (dialogRef) {
        dialogRef.afterClosed().subscribe((result) => {
          this.dialogRef.close();
          if (result === 'routeToUpgrade') {
            this.router.navigate(['/products']);
          }
        });
      } else {
      }
    } else if (
      this.profile().permAITokenCount < 1 &&
      this.profile().isPremium === false
    ) {
      const dialogRef = this.modalService.open(
        PrompUpgradeModalComponent,
        {
          data: {
            titleMessage: this.stringsService.productStrings.timeToTopUp,
            promptMessage: `You need tokens to use advanced Recipe importing. Add a Premium subscription or buy a pack now to continue!`,
            buttonMessage: 'ADD MORE TOKENS',
          },
        },
        2
      );
      if (dialogRef) {
        dialogRef.afterClosed().subscribe((result) => {
          this.dialogRef.close();
          if (Capacitor.isNativePlatform()) {
            this.stylesService.updateStyles('#A54C18', 'dark');
            this.renderer.addClass(document.body, 'product-page');
          }
          if (result === 'routeToUpgrade') {
            this.router.navigate(['/products']);
          }
        });
      }
    } else {
      // if onboarding state is 11, progress to 12
      if (this.profile().onboardingState === 11) {
        this.store.dispatch(
          ProfileActions.updateProfileProperty({
            property: 'onboardingState',
            value: 12,
          })
        );
      }
      // update url to include '/vision' if it's not already there
      this.location.go('/recipes/created/add/vision');

      const dialogRef = this.modalService.open(
        VisionAddRecipeModalComponent,
        {
          width: '90%',
        },
        2
      );
      if (dialogRef) {
        dialogRef.afterClosed().subscribe((result) => {
          // remove '/vision' from the url
          this.location.go('/recipes/created/add');
          if (result === 'success') {
            this.dialogRef.close('success');
          }
        });
      } else {
      }
    }
  }

  onFromUrlAddClick(): void {
    // first ensure user has at least one AI credit
    if (
      this.profile().permAITokenCount < 1 &&
      this.profile().isPremium === true
    ) {
      const dialogRef = this.modalService.open(
        PrompUpgradeModalComponent,
        {
          data: {
            titleMessage: this.stringsService.productStrings.timeToTopUp,
            promptMessage: `Your Premium Subscription will add ${
              this.productService.licences.premiumMonthlyAICredits
            } tokens on ${this.getNextTokenRefreshDate()}. Buy an extra pack now to create new recipes before then.`,
            buttonMessage: 'ADD MORE TOKENS',
          },
        },
        2
      );
      if (dialogRef) {
        dialogRef.afterClosed().subscribe((result) => {
          if (result === 'routeToUpgrade') {
            this.router.navigate(['/products']);
          }
        });
      } else {
      }
    } else if (
      this.profile().permAITokenCount < 1 &&
      this.profile().isPremium === false
    ) {
      const dialogRef = this.modalService.open(
        PrompUpgradeModalComponent,
        {
          data: {
            titleMessage: this.stringsService.productStrings.timeToTopUp,
            promptMessage: `You need tokens to use advanced Recipe importing. Add a Premium subscription or buy a pack now to continue!`,
            buttonMessage: 'ADD MORE TOKENS',
          },
        },
        2
      );
      if (dialogRef) {
        dialogRef.afterClosed().subscribe((result) => {
          this.dialogRef.close();
          if (Capacitor.isNativePlatform()) {
            this.stylesService.updateStyles('#A54C18', 'dark');
            this.renderer.addClass(document.body, 'product-page');
          }
          if (result === 'routeToUpgrade') {
            this.router.navigate(['/products']);
          }
        });
      }
    } else {
      // update url to include '/from-url' if it's not already there
      this.location.go('/recipes/created/add/from-url');

      const dialogRef = this.modalService.open(
        FromUrlAddRecipeModalComponent,
        {
          width: '90%',
        },
        2
      );
      if (dialogRef) {
        dialogRef.afterClosed().subscribe((result) => {
          // remove '/from-url' from the url
          this.location.go('/recipes/created/add');
          if (result === 'success') {
            this.dialogRef.close('success');
          }
        });
      } else {
      }
    }
  }

  getNextTokenRefreshDate() {
    const previousRefreshDate = new Date(
      this.profile().permAITokenLastRefreshDate
    );
    // add 1 month to the previous refresh date
    const nextRefreshDate = new Date(
      previousRefreshDate.setMonth(previousRefreshDate.getMonth() + 1)
    );
    return nextRefreshDate.toDateString();
  }

  onDestroy() {
    this.dialogRef.close();
  }

  onboardingHandler(onboardingState: number): void {}

  onboardingCallback() {
    setTimeout(() => {
      this.onboardingHandler(this.profile().onboardingState);
    }, 1000);
  }

  onboardingBadgeClick() {
    this.showOnboardingBadge.set(false);
    this.onboardingHandler(this.profile().onboardingState);
  }

  onExitClick() {
    this.dialogRef.close();
  }
}
