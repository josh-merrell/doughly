import { Route } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { IngredientsComponent } from './kitchen/feature/ingredients/ingredients.component';
import { NotfoundComponent } from './shared/ui/app-notfound/app-notfound.component';
import { KitchenPageComponent } from './kitchen/kitchen-page.component';
import { UserRecipeComponent } from './recipes/feature/recipe/user-recipe/user-recipe.component';
import { LoginPageComponent } from './account/feature/login/login-page.component';
import { ProfileGuard } from './guards/profile.guard';
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

export const routes: Route[] = [
  {
    path: '',
    redirectTo: 'recipes',
    pathMatch: 'full',
  },
  {
    path: 'groceries',
    component: GroceriesPageComponent,
    canActivate: [ProfileGuard],
    children: [
      {
        path: 'draft/:shoppingListID',
        component: DraftPageComponent,
      },
      {
        path: 'shopping/:shoppingListID',
        component: ShoppingPageComponent,
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
    canActivate: [ProfileGuard],
  },
  {
    path: 'ingredients',
    component: IngredientsComponent,
    canActivate: [ProfileGuard],
  },
  {
    path: 'kitchen',
    component: KitchenPageComponent,
    canActivate: [ProfileGuard],
    children: [
      {
        path: 'tools',
        component: ToolsComponent,
        canActivate: [ProfileGuard],
      },
      {
        path: 'ingredients',
        component: IngredientsComponent,
        canActivate: [ProfileGuard],
      },
    ],
  },
  {
    path: 'login',
    component: LoginPageComponent,
  },
  {
    path: 'password-reset',
    component: PasswordResetPageComponent,
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [ProfileGuard],
  },
  {
    path: 'recipe/public/:recipeID',
    component: PublicRecipeComponent,
  },
  {
    path: 'recipe/:recipeID',
    component: UserRecipeComponent,
  },
  {
    path: 'recipes',
    component: RecipesPageNewComponent,
    canActivate: [ProfileGuard],
    children: [
      {
        path: 'created',
        component: CreatedRecipesComponent,
        children: [
          {
            path: 'add',
            component: CreatedRecipesComponent,
            canActivate: [ProfileGuard],
            children: [
              {
                path: 'vision',
                component: CreatedRecipesComponent,
                canActivate: [ProfileGuard],
              },
              {
                path: 'manual',
                component: CreatedRecipesComponent,
                canActivate: [ProfileGuard],
              },
            ],
          },
        ],
      },
      {
        path: 'discover',
        component: DiscoverRecipesComponent,
      },
      {
        path: 'subscribed',
        component: SubscribedRecipesComponent,
      },
      {
        path: '',
        redirectTo: 'created', // Default path or add a component for the default view
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
    canActivate: [ProfileGuard],
    children: [
      {
        path: 'friends',
        component: FriendsComponent,
      },
      {
        path: 'followers',
        component: FollowersComponent,
      },
    ],
  },
  {
    path: 'verify-account',
    component: VerifyComponent,
  },
  {
    path: '**',
    component: NotfoundComponent,
  },
];
