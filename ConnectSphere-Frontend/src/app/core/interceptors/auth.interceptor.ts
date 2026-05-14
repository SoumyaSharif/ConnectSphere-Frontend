import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();
  const validToken = token && !isTokenExpired(token) ? token : null;

  let headers = req.headers;

  if (validToken) {
    headers = headers.set('Authorization', `Bearer ${validToken}`);
  }

  return next(req.clone({ headers })).pipe(
    catchError((error) => {
      if (shouldExpireSession(req.url, error.status)) {
        authService.expireSession();
      }

      return throwError(() => error);
    })
  );
};

function isTokenExpired(token: string): boolean {
  try {
    const [, payload] = token.split('.');
    if (!payload) {
      return true;
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=');
    const decoded = JSON.parse(atob(padded)) as { exp?: number };

    if (!decoded.exp) {
      return false;
    }

    return decoded.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

function shouldExpireSession(url: string, status: number): boolean {
  if (status === 401) {
    return true;
  }
  if (status === 403 && url.includes('/admin/dashboard')) {
    return true;
  }
  return false;
}
