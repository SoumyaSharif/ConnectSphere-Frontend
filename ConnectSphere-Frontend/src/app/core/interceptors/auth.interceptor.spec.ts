import { HttpErrorResponse, HttpHeaders, HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { throwError } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  let authService: any;

  beforeEach(() => {
    authService = {
      token: vi.fn(),
      expireSession: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: authService }]
    });
  });

  function buildToken(expiryMs: number): string {
    return `header.${btoa(JSON.stringify({ exp: Math.floor(expiryMs / 1000) }))}.sig`;
  }

  it('adds authorization header when token is valid', async () => {
    authService.token.mockReturnValue(buildToken(Date.now() + 60_000));
    const request = new HttpRequest('GET', '/api/test', null, { headers: new HttpHeaders() });

    const observable = TestBed.runInInjectionContext(() =>
      authInterceptor(request, (nextReq) => {
        expect(nextReq.headers.get('Authorization')).toContain('Bearer');
        return throwError(() => new Error('stop'));
      })
    );

    await expect(firstValueFrom(observable)).rejects.toThrow('stop');
  });

  it('expires session on 401 responses', async () => {
    authService.token.mockReturnValue(null);
    const request = new HttpRequest('GET', '/api/test');

    const observable = TestBed.runInInjectionContext(() =>
      authInterceptor(
        request,
        () => throwError(() => new HttpErrorResponse({ status: 401, url: '/api/test' }))
      )
    );

    await expect(firstValueFrom(observable)).rejects.toMatchObject({ status: 401 });
    expect(authService.expireSession).toHaveBeenCalled();
  });

  it('expires session on admin 403 responses', async () => {
    authService.token.mockReturnValue(null);
    const request = new HttpRequest('GET', '/admin/dashboard');

    const observable = TestBed.runInInjectionContext(() =>
      authInterceptor(
        request,
        () => throwError(() => new HttpErrorResponse({ status: 403, url: '/admin/dashboard' }))
      )
    );

    await expect(firstValueFrom(observable)).rejects.toMatchObject({ status: 403 });
    expect(authService.expireSession).toHaveBeenCalled();
  });
});
