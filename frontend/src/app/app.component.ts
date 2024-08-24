import {
  Component,
  NgZone,
  WritableSignal,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AppFooterComponent } from './footer/feature/app-footer.component';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { Store } from '@ngrx/store';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { ExtraStuffService } from './shared/utils/extraStuffService';
import {
  AppUpdate,
  AppUpdateAvailability,
} from '@capawesome/capacitor-app-update';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token,
} from '@capacitor/push-notifications';
import { DarkMode } from '@aparajita/capacitor-dark-mode';

import { AuthService } from './shared/utils/authenticationService';
import { PushTokenService } from './shared/utils/pushTokenService';
import { filter } from 'rxjs';
import { RedirectPathService } from './shared/utils/redirect-path.service';
import { ProductService } from './shared/utils/productService';
import { Renderer2 } from '@angular/core';
import { selectProfile } from './profile/state/profile-selectors';
import { StylesService } from './shared/utils/stylesService';
@Component({
  standalone: true,
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterModule,
    AppFooterComponent,
    StoreDevtoolsModule,
  ],
  templateUrl: './app.component.html',
})
export class AppComponent {
  showFooter = true;
  hideFooterRoutes = [
    '/login',
    '/loading',
    '/register',
    '/password-reset',
    '/verify-account',
    '/tempRoute',
    '/onboarding',
    '/privacy',
    '/products',
    '/web',
    '/admin',
    '/update',
  ];
  pushToken: WritableSignal<string | null> = signal(null);
  private prevPushToken: WritableSignal<string | null> = signal(null);
  private offerings: WritableSignal<any> = signal([]);

  constructor(
    public store: Store,
    private router: Router,
    private zone: NgZone,
    public authService: AuthService,
    public pushTokenService: PushTokenService,
    private redirectPathService: RedirectPathService,
    private extraStuffService: ExtraStuffService,
    private productService: ProductService,
    private renderer: Renderer2,
    private stylesService: StylesService
  ) {
    // Listen to routing events, ensuring only NavigationEnd events are processed
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        )
      )
      .subscribe((event: NavigationEnd) => {
        console.log('NAVIGATION: ', event.urlAfterRedirects);
        // Check if the current URL matches any in the list where the footer should be hidden
        this.showFooter = !this.hideFooterRoutes.some((route) =>
          event.urlAfterRedirects.includes(route)
        );
      });

    // listen for deep-links
    this.initializeApp();
    effect(
      () => {
        const pushToken = this.pushToken();
        const previousPushToken = this.prevPushToken();
        // if (pushToken !== previousPushToken) {
        // Only run if pushToken has changed and profile is available
        this.prevPushToken.set(pushToken); // Update previous pushToken
        if (pushToken) {
          this.authService
            .updateProfile({
              profile: {
                pushToken: pushToken,
              },
            })
            .subscribe();
        }
      },
      { allowSignalWrites: true }
    );
  }

  initializeApp() {
    // DarkMode.init().catch((err) => console.error(err));
    DarkMode.addAppearanceListener((darkMode: any) => {
      this.extraStuffService.systemDarkMode.set(darkMode.dark);
      if (this.authService.profile()!.darkMode !== 'System Default') {
        return;
      }
      if (darkMode.dark) {
        this.renderer.addClass(document.body, 'dark');
        this.renderer.removeClass(document.body, 'light');
        this.stylesService.updateStyles('#26221C', 'dark');
      } else {
        this.renderer.addClass(document.body, 'light');
        this.renderer.removeClass(document.body, 'dark');
        this.stylesService.updateStyles('#E9E6E2', 'light');
      }
    });
    // Listen for hardware back button press
    App.addListener('backButton', () => {
      console.log('BACK BUTTON PRESSED');
      // this.router.navigate(['/tempRoute']);
      this.zone.run(() => {
        console.log('BACK BUTTON PRESSED');
        this.router.navigate(['/recipes/discover']);
      });
    });
    // Listen for link events
    App.addListener('appUrlOpen', async (event: URLOpenListenerEvent) => {
      if (
        event.url.includes('access_token') &&
        event.url.includes('refresh_token')
      ) {
        const access = event.url.split('#access_token=').pop()?.split('&')[0];
        const refresh = event.url.split('refresh_token=').pop()?.split('&')[0];
        await this.authService.setSession(access, refresh);
      }

      this.zone.run(() => {
        console.log('URL OPENED: ', event.url);
        if (event.url.includes('link-previews/recipe')) {
          const recipeID = event.url.split('link-previews/recipe')[1];
          const path = `/recipe/public${recipeID}`;
          console.log('IOS NAVIGATING TO', path);
          this.router.navigateByUrl(path);
        } else {
          const domain = 'doughly.co';
          const pathArray = event.url.split(domain);
          // console.log('PATH ARRAY', pathArray);
          const appPath = pathArray.pop();
          if (appPath) {
            console.log('NAVIGATING TO', appPath);
            this.router.navigateByUrl(appPath);
          }
        }
      });
    });

    // listen for dark mode changes in app
    this.store.select(selectProfile).subscribe((profile) => {
      if (profile) {
        const darkMode = profile.darkMode;
        if (darkMode === 'Enabled') {
          this.renderer.addClass(document.body, 'dark');
          this.renderer.removeClass(document.body, 'light');
          this.stylesService.updateStyles('#26221C', 'dark');
        } else if (darkMode === 'Disabled') {
          this.renderer.addClass(document.body, 'light');
          this.renderer.removeClass(document.body, 'dark');
          this.stylesService.updateStyles('#E9E6E2', 'light');
        } else {
          // default is 'System Default'
          let darkModePreference: string;
          // get system dark mode preference
          DarkMode.isDarkMode().then((isDarkMode) => {
            this.extraStuffService.systemDarkMode.set(isDarkMode.dark);
            darkModePreference = isDarkMode.dark ? 'Enabled' : 'Disabled';
            if (this.authService.profile()!.darkMode !== 'System Default') {
              return;
            }
            if (darkModePreference === 'Enabled') {
              this.renderer.addClass(document.body, 'dark');
              this.renderer.removeClass(document.body, 'light');
              this.stylesService.updateStyles('#26221C', 'dark');
            } else {
              this.renderer.addClass(document.body, 'light');
              this.renderer.removeClass(document.body, 'dark');
              this.stylesService.updateStyles('#E9E6E2', 'light');
            }
          });
        }
      }
    });
  }

  ngOnInit() {
    // set initial styling to dark mode:
    this.renderer.addClass(document.body, 'dark');
    this.renderer.removeClass(document.body, 'light');
    this.stylesService.updateStyles('#26221C', 'dark');

    this.offerings.set(this.productService.offerings());

    // register for push notifications on mobile
    if (Capacitor.isNativePlatform()) {
      PushNotifications.requestPermissions().then((result) => {
        if (result.receive === 'granted') {
          // Register with Apple / Google to receive push via APNS/FCM
          PushNotifications.register();
        } else {
          // Show some error
        }
      });
      PushNotifications.addListener('registration', (token: Token) => {
        // Send the token to the server
        this.pushTokenService.unsavedPushToken.set(token.value);
      });
      // Show us the notification payload if the app is open on our device
      PushNotifications.addListener(
        'pushNotificationReceived',
        (notification: PushNotificationSchema) => {
          // save current route path, then redirect to loading page to refresh state
          console.log(`PUSH RECEIVED. SAVING PATH: ${this.router.url}`);
          this.redirectPathService.setPath(this.router.url);
          this.extraStuffService.stateToLoad.set('messages');
          this.router.navigateByUrl('/loading');
        }
      );
      // Method called when tapping on a notification
      PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (notification: ActionPerformed) => {
          // alert('Push action performed: ' + JSON.stringify(notification));
          switch (notification.notification.data.type) {
            case 'followeePublicRecipeCreated':
              this.redirectPathService.setPath(
                `/recipe/public/${notification.notification.data.recipeID}`
              );
              this.router.navigateByUrl('/loading');
              break;
            case 'friendHeirloomRecipeCreated':
              this.redirectPathService.setPath(
                `/recipe/public/${notification.notification.data.recipeID}`
              );
              this.router.navigateByUrl('/loading');
              break;
            case 'newFollower':
              this.redirectPathService.setPath('/social/followers');
              this.router.navigateByUrl('/loading');
              break;
            case 'friendshipRequest':
              this.redirectPathService.setPath('/social/friends');
              this.router.navigateByUrl('/loading');
              break;
            case 'friendshipConfirmation':
              this.redirectPathService.setPath('/social/friends');
              this.router.navigateByUrl('/loading');
              break;
            case 'autoDeletedExpiredStock':
              this.redirectPathService.setPath('/kitchen/ingredients');
              this.router.navigateByUrl('/loading');
              break;
            case 'autoDeletedExpiredStocks':
              this.redirectPathService.setPath('/kitchen/ingredients');
              this.router.navigateByUrl('/loading');
              break;
            case 'noStock':
              this.redirectPathService.setPath('/kitchen/ingredients');
              this.router.navigateByUrl('/loading');
              break;
            case 'lowStock':
              this.redirectPathService.setPath('/kitchen/ingredients');
              this.router.navigateByUrl('/loading');
              break;
            case 'upcomingStockExpiration':
              this.redirectPathService.setPath('/kitchen/ingredients');
              this.router.navigateByUrl('/loading');
              break;
            case 'notifyFriendListShare':
              this.redirectPathService.setPath('/groceries/shared');
              this.router.navigateByUrl('/loading');
              break;
            case 'notifyFriendListProgress':
              this.redirectPathService.setPath('/groceries/shopping');
              this.router.navigateByUrl('/loading');
              break;
            default:
              this.router.navigateByUrl('/login');
              break;
          }
        }
      );
    }

    // check for app updates
    this.checkForAppUpdate();
  }

  checkForAppUpdate = async () => {
    // if platform is not mobile, return
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    const platform = Capacitor.getPlatform();
    const currentVersion = await this.getCurrentAppVersion();
    const availableVersion = await this.getAvailableAppVersion();
    console.log('CURRENT VERSION: ', currentVersion);
    console.log('AVAILABLE VERSION: ', availableVersion);

    if (currentVersion !== availableVersion) {
      console.log('OLD VERSION FOUND, PROMPTING FOR UPDATE');
      if (platform === 'android') {
        this.promptForUpdate();
      } else if (platform === 'ios') {
        this.promptForUpdate();
      }
    }
  };

  getCurrentAppVersion = async () => {
    const result = await AppUpdate.getAppUpdateInfo();
    if (Capacitor.getPlatform() === 'android') {
      return result.currentVersionCode;
    } else {
      return result.currentVersionName;
    }
  };

  getAvailableAppVersion = async () => {
    const result = await AppUpdate.getAppUpdateInfo();
    if (Capacitor.getPlatform() === 'android') {
      return result.availableVersionCode;
    } else {
      return result.availableVersionName;
    }
  };

  // performImmediateUpdate = async () => {
  //   const result = await AppUpdate.getAppUpdateInfo();
  //   if (result.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE) {
  //     return;
  //   }
  //   if (result.immediateUpdateAllowed) {
  //     await AppUpdate.performImmediateUpdate();
  //   }
  // };

  promptForUpdate = async () => {
    // route to update route
    this.router.navigate(['/update']);
  };
}
