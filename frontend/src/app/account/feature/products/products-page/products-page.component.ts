import { Component, WritableSignal, effect, signal } from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterModule,
} from '@angular/router';
import { filter } from 'rxjs';
import { UpgradePageComponent } from '../ui/upgrade-page/upgrade-page.component';
import { AuthService } from 'src/app/shared/utils/authenticationService';
import { MatDialog } from '@angular/material/dialog';
import { StatusBar, Style } from '@capacitor/status-bar';
import { NavigationBar } from '@hugotomazi/capacitor-navigation-bar';
import { Capacitor } from '@capacitor/core';


@Component({
  selector: 'dl-products-page',
  standalone: true,
  imports: [UpgradePageComponent, RouterModule],
  templateUrl: './products-page.component.html',
})
export class ProductsPageComponent {
  public profile: object | any = {};
  public view: WritableSignal<string> = signal('upgrade');

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
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

  async setStatusBarStyleDark() {
    await StatusBar.setStyle({ style: Style.Dark });
    // set status bar color do 'dl-blue-5'
    await StatusBar.setBackgroundColor({ color: '#2bb0ed' });

    // set nav bar color to 'dl-blue-3'
    NavigationBar.setColor({ color: '#127fbf', darkButtons: false });
  }

  ngOnInit(): void {
    if (Capacitor.isNativePlatform()) {
      this.setStatusBarStyleDark();
    }
    // close all modals
    this.dialog.closeAll();
    this.checkAndUpdateView();
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkAndUpdateView();
      });
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
