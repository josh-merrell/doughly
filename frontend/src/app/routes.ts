import { Route } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { IngredientsComponent } from './kitchen/feature/ingredients/ingredients.component';
import { NotfoundComponent } from './shared/ui/app-notfound/app-notfound.component';
import { KitchenPageComponent } from './kitchen/kitchen-page.component';
import { RecipesPageComponent } from './recipes/feature/recipes-page/recipes-page.component';
import { RecipeComponent } from './recipes/feature/recipe/recipe.component';
import { LoginPageComponent } from './account/feature/login/login-page.component';
import { ProfileGuard } from './guards/profile.guard';
import { PasswordResetPageComponent } from './account/feature/password/password-reset-page.component';
import { SignupPageComponent } from './account/feature/signup/signup-page.component';
import { VerifyComponent } from './account/feature/verify/verify.component';
import { ProfileComponent } from './profile/profile.component'
import { SocialPageComponent } from './social/social-page.component';

export const routes: Route[] = [
  {
    path: '',
    component: HomeComponent,
    canActivate: [ProfileGuard],
  },
  {
    path: 'social',
    component: SocialPageComponent,
    canActivate: [ProfileGuard],
  },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [ProfileGuard],
  },
  {
    path: 'login',
    component: LoginPageComponent,
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [ProfileGuard],
  },
  {
    path: 'register',
    component: SignupPageComponent,
  },
  {
    path: 'verify-account',
    component: VerifyComponent,
  },
  {
    path: 'password-reset',
    component: PasswordResetPageComponent,
  },
  {
    path: 'recipes',
    component: RecipesPageComponent,
    children: [
      {
        path: ':recipeID',
        component: RecipeComponent,
      },
    ],
  },
  {
    path: 'kitchen',
    component: KitchenPageComponent,
    canActivate: [ProfileGuard],
  },
  {
    path: 'ingredients',
    component: IngredientsComponent,
    canActivate: [ProfileGuard],
  },
  {
    path: '**',
    component: NotfoundComponent,
  },
];
