import {
  Component,
  NgZone,
  WritableSignal,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
  title = 'frontend';
  pushToken: WritableSignal<string | null> = signal(null);
  private prevPushToken: WritableSignal<string | null> = signal(null);

  constructor(
    public store: Store,
    private router: Router,
    private zone: NgZone,
    public authService: AuthService,
    public pushTokenService: PushTokenService
  ) {
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
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      this.zone.run(() => {
        // Example url: https://beerswift.app/tabs/tab2
        // slug = /tabs/tab2

        // Our app url: https://doughly.co
        const slug = event.url.split('.co').pop();
        if (slug) {
          this.router.navigateByUrl(slug);
        }
        // If no match, do nothing - let regular routing
        // logic take over
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
