import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  CanActivateFn,
} from '@angular/router';
import { Store } from '@ngrx/store';
import { map, first } from 'rxjs';

import { selectProfile } from '../profile/state/profile-selectors';

export const stateLoaded: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectProfile).pipe(
    map((profile) => {
      if (!profile) {
        router.navigate(['/loading']); // Redirect to loading page if profile is not loaded
        return false;
      }
      return true;
    }),
    first()
  );
};
