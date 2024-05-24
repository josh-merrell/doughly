import {
  Component,
  Renderer2,
  WritableSignal,
  effect,
  signal,
} from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterModule,
} from '@angular/router';
import { filter } from 'rxjs';
import { UpgradePageComponent } from '../ui/upgrade-page/upgrade-page.component';
import { AuthService } from 'src/app/shared/utils/authenticationService';
import { StatusBar, Style } from '@capacitor/status-bar';
import { NavigationBar } from '@hugotomazi/capacitor-navigation-bar';
import { Capacitor } from '@capacitor/core';
import { ModalService } from 'src/app/shared/utils/modalService';
import { StylesService } from 'src/app/shared/utils/stylesService';

@Component({
  selector: 'dl-products-page',
  standalone: true,
  imports: [UpgradePageComponent, RouterModule],
  templateUrl: './products-page.component.html',
})
export class ProductsPageComponent {
  public profile: object | any = {};
  public view: WritableSignal<string> = signal('upgrade');
  private previousUrl: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: ModalService,
    private renderer: Renderer2,
    private stylesService: StylesService
  ) {
    effect(() => {
      const view = this.view();
      if (view === 'upgrade') {
        this.router.navigate(['/products/upgrade']);
      } else if (view === 'your-premium') {
        this.router.navigate(['/products/your-premium']);
      }
    });

    effect(
      () => {
        const profile = this.authService.profile();
        this.profile = profile;
        if (profile) {
          if (profile.permRecipeCreateUnlimited) {
            this.view.set('your-premium');
          }
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit(): void {
    if (Capacitor.isNativePlatform()) {
      this.stylesService.updateStyles('#127FBF', 'dark');
      this.renderer.addClass(document.body, 'product-page');
    }
    // close all modals
    this.modalService.closeAll();
    this.checkAndUpdateView();

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        )
      )
      .subscribe((event: NavigationEnd) => {
        this.checkAndUpdateView();

        // Check if previous path was '/products/your-premium' and current path is '/products'
        if (
          this.previousUrl === '/products/your-premium' &&
          event.url === '/products'
        ) {
          this.router.navigate(['/recipes/discover']);
        }

        // Update previous URL
        this.previousUrl = event.url;
      });
  }

  ngOnDestroy() {
    this.stylesService.updateStyles();
    this.renderer.removeClass(document.body, 'product-page');
  }

  private checkAndUpdateView() {
    const childRoute = this.route.snapshot.firstChild;
    const childSegment = childRoute ? childRoute.url[0]?.path : 'upgrade';
    this.view.set(childSegment);
  }

  setView(view: string) {
    this.view.set(view);
  }

  onCancel() {
    this.router.navigate(['/recipes/discover']);
  }
}
