import { Renderer2, ElementRef, ViewChild, Component } from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLinkWithHref,
  RouterOutlet,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Subject, filter, takeUntil, tap } from 'rxjs';
import { setCurrentUrl } from '../../shared/state/shared-actions';
import { Observable } from 'rxjs';
import { selectCurrentUrl } from '../../shared/state/shared-selectors';
import { AppState } from '../../shared/state/app-state';
import { AuthService } from '../../shared/utils/authenticationService';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLinkWithHref],
  templateUrl: './app-footer.component.html',
})
export class AppFooterComponent {
  @ViewChild('menu') menu!: ElementRef;
  globalClickListener: () => void = () => {};
  isMenuOpen = false;
  currentUrl$: Observable<string> = this.store.select(selectCurrentUrl);
  private destroy$ = new Subject<void>();
  public profileImageLink: string | undefined;
  public initials: string = '';
  public profile: object | any = {};

  options: any = { exact: false };

  constructor(
    private renderer: Renderer2,
    private router: Router,
    private store: Store<AppState>,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.$profile.subscribe((profile) => {
      this.profile = profile;
      this.profileImageLink = profile?.photo_url;
      this.initials = (profile?.name_first?.charAt(0) || '') + (profile?.name_last?.charAt(0) || '');
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
    this.router.navigate([link]);
  }

  profileNavigate(link: string) {
    this.closeMenu();
    this.router.navigate([link]);
  }

  logout() {
    this.closeMenu();
    this.authService.logout().then(() => {
      this.router.navigate(['/login']);
    });
  }
}