import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from './auth.service';
import { User } from '../models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: { navigate: ReturnType<typeof vi.fn> };

  const user: User = {
    userId: 'u1',
    username: 'alice',
    email: 'alice@example.com',
    role: 'USER',
    provider: 'LOCAL',
    isActive: true,
    createdAt: '2026-05-10T10:00:00Z'
  };

  beforeEach(() => {
    localStorage.clear();
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('stores session after login and skips the next session validation request', async () => {
    const loginPromise = firstValueFrom(service.login({ email: 'alice@example.com', password: 'secret' }));

    const loginReq = httpMock.expectOne((req) => req.method === 'POST' && req.url.endsWith('/api/v1/auth/login'));
    loginReq.flush({
      accessToken: buildJwtToken(Date.now() + 60_000),
      tokenType: 'Bearer',
      expiresIn: 3600,
      user
    });

    await loginPromise;
    expect(localStorage.getItem('cs_token')).toBeTruthy();
    expect(service.currentUser()?.username).toBe('alice');

    const ensureResult = await firstValueFrom(service.ensureSession());
    expect(ensureResult).toBe(true);
    httpMock.expectNone((req) => req.url.endsWith('/api/v1/auth/me'));
  });

  it('clears session and redirects on logout', () => {
    localStorage.setItem('cs_token', buildJwtToken(Date.now() + 60_000));
    localStorage.setItem('cs_user', JSON.stringify(user));

    service.handleOAuth2Callback(buildJwtToken(Date.now() + 60_000), user.userId);
    const meReq = httpMock.expectOne((req) => req.url.endsWith('/api/v1/auth/me'));
    meReq.flush(user);
    router.navigate.mockClear();

    service.logout();

    expect(localStorage.getItem('cs_token')).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('handles OAuth callback by fetching the current user and redirecting home', () => {
    service.handleOAuth2Callback(buildJwtToken(Date.now() + 60_000), user.userId);

    const meReq = httpMock.expectOne((req) => req.method === 'GET' && req.url.endsWith('/api/v1/auth/me'));
    meReq.flush(user);

    expect(service.currentUser()?.email).toBe('alice@example.com');
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('stores a fallback google user when profile refresh fails after OAuth callback', () => {
    service.handleOAuth2Callback(buildJwtToken(Date.now() + 60_000), 'google-user');

    const meReq = httpMock.expectOne((req) => req.method === 'GET' && req.url.endsWith('/api/v1/auth/me'));
    meReq.flush('boom', { status: 500, statusText: 'Server Error' });

    expect(service.currentUser()?.provider).toBe('GOOGLE');
    expect(service.currentUser()?.userId).toBe('google-user');
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('covers register, password flows, account deletion and refresh', async () => {
    const registerPromise = firstValueFrom(service.register({ email: 'alice@example.com', password: 'secret' } as any));
    httpMock.expectOne((req) => req.method === 'POST' && req.url.endsWith('/api/v1/auth/register')).flush({
      accessToken: buildJwtToken(Date.now() + 60_000),
      tokenType: 'Bearer',
      expiresIn: 3600,
      user
    });
    await registerPromise;

    firstValueFrom(service.forgotPassword('alice@example.com'));
    httpMock.expectOne((req) => req.method === 'POST' && req.url.endsWith('/api/v1/auth/forgot-password')).flush({ message: 'sent' });

    firstValueFrom(service.resetPassword('alice@example.com', '123456', 'new-secret'));
    httpMock.expectOne((req) => req.method === 'POST' && req.url.endsWith('/api/v1/auth/reset-password')).flush({ message: 'reset' });

    firstValueFrom(service.changePassword({ currentPassword: 'old', newPassword: 'new' }));
    httpMock.expectOne((req) => req.method === 'PUT' && req.url.endsWith('/api/v1/auth/password')).flush({ message: 'changed' });

    firstValueFrom(service.refreshCurrentUser());
    httpMock.expectOne((req) => req.method === 'GET' && req.url.endsWith('/api/v1/auth/me')).flush({ ...user, fullName: 'Alice Doe' });
    expect(service.currentUser()?.fullName).toBe('Alice Doe');

    firstValueFrom(service.deleteAccount());
    httpMock.expectOne((req) => req.method === 'DELETE' && req.url.endsWith('/api/v1/auth/account')).flush({ message: 'deleted' });
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('clears invalid sessions and handles ensureSession failures', async () => {
    localStorage.setItem('cs_token', buildJwtToken(Date.now() - 60_000));
    localStorage.setItem('cs_user', JSON.stringify(user));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router }
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    expect(service.hasToken()).toBe(false);
    expect(await firstValueFrom(service.ensureSession())).toBe(false);
    httpMock.expectNone((req) => req.url.endsWith('/api/v1/auth/me'));

    service.handleOAuth2Callback(buildJwtToken(Date.now() + 60_000), user.userId);
    httpMock.expectOne((req) => req.url.endsWith('/api/v1/auth/me')).flush(user);
    service.updateStoredUser({ fullName: 'Updated Name' } as any);
    expect(service.currentUser()?.fullName).toBe('Updated Name');

    const ensurePromise = firstValueFrom(service.ensureSession());
    const meReq = httpMock.expectOne((req) => req.url.endsWith('/api/v1/auth/me'));
    meReq.flush('boom', { status: 500, statusText: 'Server Error' });
    expect(await ensurePromise).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('expires session and tolerates malformed stored users', () => {
    localStorage.setItem('cs_token', buildJwtToken(Date.now() + 60_000));
    localStorage.setItem('cs_user', '{bad json');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router }
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    expect(service.currentUser()).toBeNull();

    service.expireSession();
    expect(service.token()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  function buildJwtToken(expiryMs: number): string {
    const payload = btoa(JSON.stringify({ exp: Math.floor(expiryMs / 1000) }));
    return `header.${payload}.signature`;
  }
});
