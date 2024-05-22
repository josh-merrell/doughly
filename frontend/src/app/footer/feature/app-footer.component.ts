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
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token,
} from '@capacitor/push-notifications';
import { MatDialog } from '@angular/material/dialog';
import { MessagesModalComponent } from '../ui/messages-modal/messages-modal.component';
import { RedirectPathService } from 'src/app/shared/utils/redirect-path.service';
import { ModalService } from 'src/app/shared/utils/modalService';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLinkWithHref,
    MatProgressSpinnerModule,
  ],
  templateUrl: './app-footer.component.html',
})
export class AppFooterComponent {
  iconPing: WritableSignal<boolean> = signal(false);
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

  options: any = { exact: false };

  constructor(
    private renderer: Renderer2,
    private router: Router,
    private store: Store<AppState>,
    public authService: AuthService,
    private location: Location,
    public dialog: MatDialog,
    private redirectPathService: RedirectPathService,
    private modalService: ModalService
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
        // this means user just used AI credit for vision/url recipe create. Cause the premium icon to ping for a couple seconds
        this.iconPing.set(true);
        setTimeout(() => {
          this.iconPing.set(false);
        }, 2800);
      }
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

  toggleMenu(event: any) {
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

  getFillColor(index: number): string {
    const darkMode = this.authService.profile()?.darkMode;
    switch (index) {
      case 1:
        return darkMode ? '#E4E7EB' : '#323F4B';
      case 2:
        return darkMode ? '#F5F7FA' : '#1F2933';
      case 3:
        return darkMode ? '#9AA5B1' : '#52606D';
      default:
        return darkMode ? '#CBD2D9' : '#3E4C59';
    }
  }
}
