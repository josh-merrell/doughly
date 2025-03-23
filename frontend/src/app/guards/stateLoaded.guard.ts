import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  CanActivateFn,
} from '@angular/router';
import { RedirectPathService } from '../shared/utils/redirect-path.service';
import { Store } from '@ngrx/store';
import { map, first } from 'rxjs';

import { selectProfile } from '../profile/state/profile-selectors';

export const stateLoaded: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const store = inject(Store);
  const router = inject(Router);
  const redirectPathService = inject(RedirectPathService);

  return store.select(selectProfile).pipe(
    map((profile) => {
      if (!profile) {
        console.log(`StateLoadedGuard: Saving path: ${state.url}`);
        redirectPathService.setPath(state.url); // '/temp' will use this path to redirect after login
        router.navigate(['/loading']); // Redirect to loading page if profile is not loaded
        return false;
      }
      return true;
    }),
    first()
  );
};
