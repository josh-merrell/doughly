import { Route } from '@angular/router';
import { HomeComponent } from './home/feature/home/home.component';
import { IngredientsComponent } from './ingredients/feature/ingredients/ingredients.component';
import { NotfoundComponent } from './shared/ui/app-notfound/app-notfound.component';

export const routes: Route[] = [
  {
    path: '',
    component: HomeComponent,
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
