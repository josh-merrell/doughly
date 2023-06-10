import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/routes';
import { provideState, provideStore } from '@ngrx/store';
import { sharedReducer } from './app/shared/state/shared-reducers';
import { kitchenReducer } from './app/kitchen/state/kitchen-reducers';
// import { ingredientReducer } from './app/ingredients/state/ingredient-reducers';
// import { SharedState } from './app/shared/state/shared-state';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideStore(),
    provideState( 'shared', sharedReducer ),
    provideState( 'kitchen', kitchenReducer )
    // provideState( 'ingredient', ingredientReducer )
    // provideRouterStore(),
    // provideEffects([RouterEffects, AuthEffects])
  ],
}).catch((err) => console.error(err));
