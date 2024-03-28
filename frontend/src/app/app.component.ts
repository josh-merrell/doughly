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
import { RecipeActions } from './recipes/state/recipe/recipe-actions';
import { RecipeCategoryActions } from './recipes/state/recipe-category/recipe-category-actions';
import { IngredientActions } from './kitchen/feature/ingredients/state/ingredient-actions';
import { IngredientStockActions } from './kitchen/feature/Inventory/feature/ingredient-inventory/state/ingredient-stock-actions';
import { ToolActions } from './kitchen/feature/tools/state/tool-actions';
import { StepActions } from './recipes/state/step/step-actions';
import { FriendshipActions } from './social/state/friendship-actions';
import { FollowshipActions } from './social/state/followship-actions';
import { ProfileActions } from './profile/state/profile-actions';
import { RecipeIngredientActions } from './recipes/state/recipe-ingredient/recipe-ingredient-actions';
import { ToolStockActions } from './kitchen/feature/Inventory/feature/tool-inventory/state/tool-stock-actions';
import { RecipeToolActions } from './recipes/state/recipe-tool/recipe-tool-actions';
import { RecipeStepActions } from './recipes/state/recipe-step/recipe-step-actions';
import { ShoppingListActions } from './groceries/state/shopping-list-actions';
import { ShoppingListRecipeActions } from './groceries/state/shopping-list-recipe-actions';
import { App, URLOpenListenerEvent } from '@capacitor/app';

import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token,
} from '@capacitor/push-notifications';

import { AuthService } from './shared/utils/authenticationService';
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
    public authService: AuthService
  ) {
    // listen for deep-links
    this.initializeApp();
    effect(() => {
      const pushToken = this.pushToken();
      const previousPushToken = this.prevPushToken();
      console.log('pushToken: ' + pushToken);
      console.log('prevPushToken: ' + this.prevPushToken());
      // if (pushToken !== previousPushToken) {
        // Only run if pushToken has changed and profile is available
        this.prevPushToken.set(pushToken); // Update previous pushToken
        console.log('updated prevPushToken: ' + this.prevPushToken());
        if (pushToken) {
          this.authService.updateProfile({
            profile: {
              pushToken: pushToken,
            },
          }).subscribe();
          console.log('sent push token to server' + pushToken);
        }
      // }
    });
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
    //** LOAD STATE **
    //--kitchen
    this.store.dispatch(IngredientActions.loadIngredients());
    this.store.dispatch(IngredientStockActions.loadIngredientStocks());
    this.store.dispatch(ToolActions.loadTools());
    this.store.dispatch(ToolStockActions.loadToolStocks());

    //--recipes
    this.store.dispatch(RecipeActions.loadRecipes());
    this.store.dispatch(RecipeCategoryActions.loadRecipeCategories());
    this.store.dispatch(RecipeActions.loadRecipeSubscriptions());
    this.store.dispatch(RecipeIngredientActions.loadRecipeIngredients());
    this.store.dispatch(RecipeToolActions.loadRecipeTools());
    this.store.dispatch(StepActions.loadSteps());
    this.store.dispatch(RecipeStepActions.loadRecipeSteps());
    this.store.dispatch(RecipeActions.loadDiscoverRecipes());

    //--social
    this.store.dispatch(FriendshipActions.loadFriendships());
    this.store.dispatch(FollowshipActions.loadFollowships());
    this.store.dispatch(FollowshipActions.loadFollowers());
    this.store.dispatch(ProfileActions.loadFollowers());
    this.store.dispatch(ProfileActions.loadFollowing());
    this.store.dispatch(ProfileActions.loadProfile({}));
    this.store.dispatch(ProfileActions.loadFriends());
    this.store.dispatch(ProfileActions.loadFriendRequests());
    this.store.dispatch(ProfileActions.loadFriendRequestsSent());

    //--shopping
    this.store.dispatch(ShoppingListActions.loadShoppingLists());
    this.store.dispatch(ShoppingListRecipeActions.loadAllShoppingListRecipes());

    //** INIT NOTIFICATION METHODS
    // Request permission to use push notifications
    // iOS will prompt user and return if they granted permission or not
    // Android will just grant without prompting
    PushNotifications.requestPermissions().then((result) => {
      if (result.receive === 'granted') {
        // Register with Apple / Google to receive push via APNS/FCM
        PushNotifications.register();
      } else {
        // Show some error
      }
    });
    // On success, we should be able to receive notifications
    PushNotifications.addListener('registration', (token: Token) => {
      alert('Push registration success, token: ' + token.value);
      console.log('got unsaved pushToken: ' + token.value);
      // Send the token to the server
      this.authService.unsavedPushToken = token.value;
    });
    // Some issue with our setup and push will not work
    PushNotifications.addListener('registrationError', (error: any) => {
      alert('Error on registration: ' + JSON.stringify(error));
    });
    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        alert('Push received: ' + JSON.stringify(notification));
      }
    );
    // Method called when tapping on a notification
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification: ActionPerformed) => {
        alert('Push action performed: ' + JSON.stringify(notification));
      }
    );
  }
}
