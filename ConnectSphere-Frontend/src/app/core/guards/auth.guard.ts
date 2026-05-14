import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.hasToken()) {
    return router.createUrlTree(['/auth/login']);
  }

  return auth.ensureSession().pipe(
    map((isAuthenticated) => isAuthenticated ? true : router.createUrlTree(['/auth/login']))
  );
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAdmin()) {
    return true;
  }

  return auth.ensureSession().pipe(
    map((isAuthenticated) => {
      if (!isAuthenticated) {
        return router.createUrlTree(['/auth/login']);
      }

      return auth.isAdmin() ? true : router.createUrlTree(['/home']);
    })
  );
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.hasToken()) {
    return true;
  }

  if (auth.currentUser()) {
    return router.createUrlTree(['/home']);
  }

  return auth.ensureSession().pipe(
    map((isAuthenticated) => isAuthenticated ? router.createUrlTree(['/home']) : true)
  );
};
