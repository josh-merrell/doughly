import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/routes';
import { provideState, provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideEffects } from '@ngrx/effects';
import { importProvidersFrom } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Services
import { authInterceptor } from './app/shared/utils/authInterceptor';

// NgRX Items
import { IngredientStockEffects } from './app/kitchen/feature/Inventory/feature/ingredient-inventory/state/ingredient-stock-effects';
import { IngredientEffects } from './app/ingredients/state/ingredient-effects';
import { sharedReducer } from './app/shared/state/shared-reducers';
import { kitchenReducer } from './app/kitchen/state/kitchen-reducers';
import { IngredientReducer } from './app/ingredients/state/ingredient-reducers';
import { ingredientStockReducer } from './app/kitchen/feature/Inventory/feature/ingredient-inventory/state/ingredient-stock-reducers';
import { employeeReducer } from './app/employees/state/employee-reducers';
import { EmployeeEffects } from './app/employees/state/employee-effects';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideStore(),
    provideState('shared', sharedReducer),
    provideState('kitchen', kitchenReducer),
    provideState('ingredient', IngredientReducer),
    provideState('ingredientStock', ingredientStockReducer),
    provideState('employee', employeeReducer),
    provideEffects([
      IngredientEffects,
      IngredientStockEffects,
      EmployeeEffects,
    ]),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStoreDevtools({
      maxAge: 25, // Retains last 25 states
      logOnly: false, // Restrict extension to log-only mode
      autoPause: true, // Pauses recording actions and state changes when the extension window is not open
      trace: true, // If set to true, will include stack trace for every dispatched action
      traceLimit: 25, // maximum stack trace frames to be stored (in case trace option was provided as true)
    }),
    importProvidersFrom(
      MatDialogModule,
      MatFormFieldModule,
      ReactiveFormsModule,
      MatDatepickerModule,
      MatMomentDateModule,
      BrowserAnimationsModule
    ),
    // provideRouterStore(),
    // provideEffects([RouterEffects, AuthEffects])
  ],
}).catch((err) => console.error(err));
