import { Route } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { IngredientsComponent } from './kitchen/feature/ingredients/ingredients.component';
import { NotfoundComponent } from './shared/ui/app-notfound/app-notfound.component';
import { KitchenPageComponent } from './kitchen/kitchen-page.component';
import { UserRecipeComponent } from './recipes/feature/recipe/user-recipe/user-recipe.component';
import { LoginPageComponent } from './account/feature/login/login-page.component';
import { PasswordResetPageComponent } from './account/feature/password/password-reset-page.component';
import { SignupPageComponent } from './account/feature/signup/signup-page.component';
import { VerifyComponent } from './account/feature/verify/verify.component';
import { ProfileComponent } from './profile/profile.component';
import { SocialPageComponent } from './social/social-page.component';
import { RecipesPageNewComponent } from './recipes/feature/recipes-page/recipes-page.component-new';
import { PublicRecipeComponent } from './recipes/feature/recipe/public-recipe/public-recipe.component';
import { GroceriesPageComponent } from './groceries/groceries-page/groceries-page.component';
import { DraftPageComponent } from './groceries/feature/draft-page/draft-page.component';
import { ShoppingPageComponent } from './groceries/feature/shopping-page/shopping-page.component';
import { FriendsComponent } from './social/feature/friends/friends.component';
import { FollowersComponent } from './social/feature/followers/followers.component';
import { ToolsComponent } from './kitchen/feature/tools/tools.component';
import { CreatedRecipesComponent } from './recipes/feature/created-recipes/created-recipes.component';
import { SubscribedRecipesComponent } from './recipes/feature/subscribed-recipes/subscribed-recipes.component';
import { DiscoverRecipesComponent } from './recipes/feature/discover/discover-recipes.component';
import { SettingsComponent } from './settings/settings.component';
import { UsingRecipeComponent } from './recipes/feature/recipe/ui/using-recipe/using-recipe.component';
import { LoadingPageComponent } from './account/feature/loading-page/loading-page.component';
import { TempRouteComponent } from './shared/temp-route/temp-route.component';

import { ProfileGuard } from './guards/profile.guard';
import { stateLoaded } from './guards/stateLoaded.guard';

export const routes: Route[] = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'loading',
    component: LoadingPageComponent,
  },
  {
    path: 'groceries',
    component: GroceriesPageComponent,
    canActivate: [ProfileGuard, stateLoaded],
    children: [
      {
        path: 'draft/:shoppingListID',
        component: DraftPageComponent,
        canActivate: [ProfileGuard, stateLoaded],
      },
      {
        path: 'shopping/:shoppingListID',
        component: ShoppingPageComponent,
        canActivate: [ProfileGuard, stateLoaded],
      },
      {
        path: '',
        redirectTo: 'draft', // Default path or add a component for the default view
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [ProfileGuard, stateLoaded],
  },
  {
    path: 'ingredients',
    component: IngredientsComponent,
    canActivate: [ProfileGuard, stateLoaded],
  },
  {
    path: 'kitchen',
    component: KitchenPageComponent,
    canActivate: [ProfileGuard, stateLoaded],
    runGuardsAndResolvers: 'always',
    children: [
      {
        path: 'tools',
        component: ToolsComponent,
        canActivate: [ProfileGuard, stateLoaded],
      },
      {
        path: 'ingredients',
        component: IngredientsComponent,
        canActivate: [ProfileGuard, stateLoaded],
      },
    ],
  },
  {
    path: 'login',
    component: LoginPageComponent,
  },
  {
    path: 'reset-password',
    component: PasswordResetPageComponent,
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [ProfileGuard, stateLoaded],
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [ProfileGuard, stateLoaded],
  },
  {
    path: 'recipe/public/:recipeID',
    component: PublicRecipeComponent,
    canActivate: [ProfileGuard, stateLoaded],
  },
  {
    path: 'recipe/using/:recipeID',
    component: UsingRecipeComponent,
    canActivate: [ProfileGuard, stateLoaded],
  },
  {
    path: 'recipe/:recipeID',
    component: UserRecipeComponent,
    canActivate: [ProfileGuard, stateLoaded],
  },
  {
    path: 'recipes',
    component: RecipesPageNewComponent,
    canActivate: [ProfileGuard, stateLoaded],
    children: [
      {
        path: 'created',
        component: CreatedRecipesComponent,
        canActivate: [ProfileGuard, stateLoaded],
        children: [
          {
            path: 'add',
            component: CreatedRecipesComponent,
            canActivate: [ProfileGuard, stateLoaded],
            children: [
              {
                path: 'vision',
                component: CreatedRecipesComponent,
                canActivate: [ProfileGuard, stateLoaded],
              },
              {
                path: 'manual',
                component: CreatedRecipesComponent,
                canActivate: [ProfileGuard, stateLoaded],
              },
            ],
          },
        ],
      },
      {
        path: 'discover',
        component: DiscoverRecipesComponent,
        canActivate: [ProfileGuard, stateLoaded],
      },
      {
        path: 'subscribed',
        component: SubscribedRecipesComponent,
        canActivate: [ProfileGuard, stateLoaded],
      },
      {
        path: '',
        redirectTo: 'discover', // Default path or add a component for the default view
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'register',
    component: SignupPageComponent,
  },
  {
    path: 'social',
    component: SocialPageComponent,
    canActivate: [ProfileGuard, stateLoaded],
    children: [
      {
        path: 'friends',
        component: FriendsComponent,
        canActivate: [ProfileGuard, stateLoaded],
      },
      {
        path: 'followers',
        component: FollowersComponent,
        canActivate: [ProfileGuard, stateLoaded],
      },
    ],
  },
  {
    path: 'verify-account',
    component: VerifyComponent,
  },
  {
    path: 'tempRoute',
    component: TempRouteComponent,
  },
  {
    path: '**',
    component: NotfoundComponent,
  },
];
