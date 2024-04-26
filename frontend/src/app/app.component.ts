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

import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token,
} from '@capacitor/push-notifications';

import { AuthService } from './shared/utils/authenticationService';
import { PushTokenService } from './shared/utils/pushTokenService';
import { filter } from 'rxjs';
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
  ];
  pushToken: WritableSignal<string | null> = signal(null);
  private prevPushToken: WritableSignal<string | null> = signal(null);

  constructor(
    public store: Store,
    private router: Router,
    private zone: NgZone,
    public authService: AuthService,
    public pushTokenService: PushTokenService
  ) {
    // Listen to routing events, ensuring only NavigationEnd events are processed
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        )
      )
      .subscribe((event: NavigationEnd) => {
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
        // }
      },
      { allowSignalWrites: true }
    );
  }

  initializeApp() {
    App.addListener('appUrlOpen', async (event: URLOpenListenerEvent) => {
      const access = event.url.split('#access_token=').pop()?.split('&')[0];
      const refresh = event.url.split('refresh_token=').pop()?.split('&')[0];

      if (access && refresh) {
        await this.authService.setSession(access, refresh);
      }
      
      this.zone.run(() => {
        const domain = 'doughly.co'
        const pathArray = event.url.split(domain);
        const appPath = pathArray.pop();
        if (appPath) {
          this.router.navigateByUrl(appPath);
        }



        console.log('DEEP LINK URL', event.url);
        let newPath = '';
        if (event.url.includes('doughly.co')) {
          // Extract the part after 'co.doughly.app/' and navigate
          let queryParams = event.url.split('?')[1];
          if (queryParams) {
            // get a list of query parameters
            const queryParamsSplit = queryParams.split('&');
            if (queryParamsSplit[0].split('=')[0] === 'recipeID')
              newPath += '/recipe/public/' + queryParamsSplit[0].split('=')[1];
          }

          console.log(`NAVIGATING TO ${newPath}`);
          this.router.navigateByUrl(newPath || '/login', {
            replaceUrl: true,
          });
        }
      });
    });
  }

  ngOnInit() {
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
      // Some issue with our setup and push will not work
      // PushNotifications.addListener('registrationError', (error: any) => {
      //   alert('Error on registration: ' + JSON.stringify(error));
      // });
      // Show us the notification payload if the app is open on our device
      PushNotifications.addListener(
        'pushNotificationReceived',
        (notification: PushNotificationSchema) => {
          // alert(JSON.stringify(notification));
        }
      );
      // Method called when tapping on a notification
      PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (notification: ActionPerformed) => {
          // alert('Push action performed: ' + JSON.stringify(notification));
        }
      );
    }
  }
}
