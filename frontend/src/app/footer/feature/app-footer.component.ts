import {
  Renderer2,
  ElementRef,
  ViewChild,
  Component,
  WritableSignal,
  signal,
  effect,
} from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLinkWithHref,
  RouterOutlet,
} from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { Store } from '@ngrx/store';
import { Subject, filter, takeUntil, tap } from 'rxjs';
import { setCurrentUrl } from '../../shared/state/shared-actions';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { selectCurrentUrl } from '../../shared/state/shared-selectors';
import { AppState } from '../../shared/state/app-state';
import { AuthService } from '../../shared/utils/authenticationService';
import {
  selectAdding,
  selectNewRecipeID,
} from '../../recipes/state/recipe/recipe-selectors';
import { selectMessages } from '../state/message-selectors';
import { PushNotifications } from '@capacitor/push-notifications';
import { MatDialog } from '@angular/material/dialog';
import { MessagesModalComponent } from '../ui/messages-modal/messages-modal.component';
import { RedirectPathService } from 'src/app/shared/utils/redirect-path.service';
import { ModalService } from 'src/app/shared/utils/modalService';
import { ImageFromCDN } from 'src/app/shared/utils/imageFromCDN.pipe';
import { ExtraStuffService } from 'src/app/shared/utils/extraStuffService';
import { AnimationOptions, LottieComponent } from 'ngx-lottie';
import { AnimationItem } from 'lottie-web';
import { selectProfile } from 'src/app/profile/state/profile-selectors';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLinkWithHref,
    MatProgressSpinnerModule,
    ImageFromCDN,
    LottieComponent,
  ],
  templateUrl: './app-footer.component.html',
})
export class AppFooterComponent {
  @ViewChild('menu') menu!: ElementRef;
  globalClickListener: () => void = () => {};
  isMenuOpen = false;
  currentURL: WritableSignal<string> = signal('');
  private destroy$ = new Subject<void>();
  public profileImageLink: string | undefined;
  public initials: string = '';
  public profile: object | any = {};
  public addingRecipe: WritableSignal<boolean> = signal(false);
  public currentLocation: WritableSignal<string> = signal('');
  private messages: WritableSignal<any> = signal([]);
  public unackedMessageLength: WritableSignal<number> = signal(0);
  stars: string = '';
  kitchen: WritableSignal<string> = signal('');
  recipes: WritableSignal<string> = signal('');
  groceries: WritableSignal<string> = signal('');
  social: WritableSignal<string> = signal('');

  // Lottie animation
  public creditCountRed: WritableSignal<boolean> = signal(false);
  private animationItem: AnimationItem | undefined;
  animationOptions: AnimationOptions = {
    path: '',
    loop: true,
    autoplay: false,
  };
  lottieStyles = {
    position: 'absolute',
    right: '0',
    top: '0',
    height: '40px',
    width: '40px',
  };

  options: any = { exact: false };

  constructor(
    private renderer: Renderer2,
    private router: Router,
    private store: Store<AppState>,
    public authService: AuthService,
    private location: Location,
    public dialog: MatDialog,
    private redirectPathService: RedirectPathService,
    private modalService: ModalService,
    public extraStuffService: ExtraStuffService
  ) {
    effect(
      () => {
        this.unackedMessageLength.set(
          this.messages().filter(
            (message: any) => message.messageData.status === 'notAcked'
          ).length
        );
      },
      { allowSignalWrites: true }
    );

    effect(() => {
      const profile = this.authService.profile();
      this.profile = profile;
      this.profileImageLink = profile?.photo_url;
      this.initials =
        (profile?.name_first?.charAt(0) || '') +
        (profile?.name_last?.charAt(0) || '');
    });
  }

  ngOnInit() {
    // watch location for changes
    this.location.onUrlChange((url) => {
      this.currentLocation.set(url);
    });
    this.store.select(selectAdding).subscribe((adding) => {
      this.addingRecipe.set(adding);
    });
    this.store.select(selectCurrentUrl).subscribe((url) => {
      this.currentURL.set(url);
    });
    this.store.select(selectMessages).subscribe((messages) => {
      this.messages.set(messages);
    });
    this.router.events
      .pipe(
        takeUntil(this.destroy$),
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        ),
        tap((event: NavigationEnd) => {
          this.store.dispatch(setCurrentUrl({ url: event.url }));
        })
      )
      .subscribe();
    this.store.select(selectNewRecipeID).subscribe((newRecipeID) => {
      if (newRecipeID) {
        // this means user just used AI credit for vision/url recipe create. Play the AI stars animation
        this.playAnimation();
      }
    });
    this.setAnimationPath();
    this.store.select(selectProfile).subscribe((profile) => {
      this.setAnimationPath();
    });
  }

  ngAfterViewInit() {
    this.globalClickListener = this.renderer.listen(
      'document',
      'click',
      (event) => {
        const clickedInside = this.menu?.nativeElement.contains(event.target);
        if (!clickedInside && this.isMenuOpen) {
          this.closeMenu();
        }
      }
    );
  }

  ngOnDestroy() {
    if (this.globalClickListener) {
      this.globalClickListener();
    }
  }

  setAnimationPath() {
    if (!document.body.classList.contains('dark')) {
      this.stars = '/assets/animations/lottie/stars-light.json';
      this.groceries.set('/assets/icons/Groceries-light.svg');
      this.recipes.set('/assets/icons/Recipes-light.svg');
      this.kitchen.set('/assets/icons/Kitchen-light.svg');
      this.social.set('/assets/icons/Social-light.svg');
    } else {
      this.stars = '/assets/animations/lottie/stars-dark.json';
      this.groceries.set('/assets/icons/Groceries-dark.svg');
      this.recipes.set('/assets/icons/Recipes-dark.svg');
      this.kitchen.set('/assets/icons/Kitchen-dark.svg');
      this.social.set('/assets/icons/Social-dark.svg');
    }
    this.updateAnimationOptions();
  }

  updateAnimationOptions() {
    this.animationOptions = {
      ...this.animationOptions,
      path: this.stars,
    };
  }

  animationCreated(animation: any) {
    this.animationItem = animation;
    this.animationItem?.setSpeed(1.6);
    animation.play();
  }
  loopComplete(): void {
    this.animationItem?.pause();
  }
  playAnimation(): void {
    this.animationItem?.goToAndPlay(0);
    this.creditCountRed.set(true);
    setTimeout(() => {
      this.creditCountRed.set(false);
    }, 1200);
  }

  toggleMenu(event: any) {
    console.log('toggleMenu');
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  navigate(link: string) {
    this.redirectPathService.setPath(link);
    this.router.navigate(['/tempRoute']);
  }

  profileNavigate(link: string) {
    this.closeMenu();
    this.router.navigate([link]);
  }

  getURL() {
    const currentURL = this.currentURL();
    if (currentURL.includes('groceries')) {
      return 'groceries';
    } else if (currentURL.includes('recipe')) {
      return 'recipes';
    } else if (currentURL.includes('social')) {
      return 'social';
    } else if (currentURL.includes('kitchen')) {
      return 'kitchen';
    }
    return '';
  }

  logout() {
    this.closeMenu();
    this.authService.logout().then(() => {
      this.router.navigate(['/login']);
    });
    PushNotifications.unregister;
  }

  onMessagesClick() {
    const ref = this.modalService.open(
      MessagesModalComponent,
      {
        width: '440px',
      },
      1
    );
    if (ref) {
      ref!.afterClosed().subscribe((result: any) => {
        this.closeMenu();
      });
    } else {
    }
  }

  navigateToProducts() {
    // if user profile 'permRecipeCreateUnlimited' is true, navigate to 'your-premium' page, else navigate to 'upgrade' page
    const latestProfile = this.authService.profile();
    if (!latestProfile) {
      this.router.navigate(['/products']);
    }
    if (latestProfile!.isPremium) {
      this.router.navigate(['/products/your-premium']);
    } else if (latestProfile!.permRecipeCreateUnlimited) {
      this.router.navigate(['/products/your-lifetime']);
    } else {
      this.router.navigate(['/products/upgrade']);
    }
  }
}
