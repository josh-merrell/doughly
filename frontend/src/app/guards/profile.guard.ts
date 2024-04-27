import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateChildFn,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { RedirectPathService } from '../shared/utils/redirect-path.service';
import { first, from, map } from 'rxjs';
import { AuthService } from '../shared/utils/authenticationService';



export const canActivate: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const redirectPathService = inject(RedirectPathService);
  const router = inject(Router);
  const profile = authService.profile();
  // Allow access if the user's profile is set
  if (profile) return true;
  else {
    redirectPathService.setPath(state.url); // '/temp' will use this path to redirect after login
    // Redirect to the /login route, while capturing the current url so we can redirect after login
    router.navigate(['/login']);
    return false;
  }
}

export const ProfileGuard: CanActivateChildFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => canActivate(route, state);