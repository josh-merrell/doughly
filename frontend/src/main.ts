import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    // provideStore({ router: routerReducer, auth: authReducer }),
    // provideRouterStore(),
    // provideEffects([RouterEffects, AuthEffects])
  ],
})
  .catch((err) => console.error(err));
