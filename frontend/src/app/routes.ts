import { Route } from '@angular/router';
import { HomeComponent } from './home/feature/home/home.component';
import { IngredientsComponent } from './ingredients/feature/ingredients/ingredients.component';
import { NotfoundComponent } from './shared/ui/app-notfound/app-notfound.component';
import { KitchenPageComponent } from './kitchen/kitchen-page.component';
import { RecipePageComponent } from './recipes/feature/recipe-page/recipe-page.component';

export const routes: Route[] = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'recipes',
    component: RecipePageComponent,
  },
  {
    path: 'kitchen',
    component: KitchenPageComponent,
  },
  {
    path: 'ingredients',
    component: IngredientsComponent,
  },
  {
    path: '**',
    component: NotfoundComponent,
  },
];
