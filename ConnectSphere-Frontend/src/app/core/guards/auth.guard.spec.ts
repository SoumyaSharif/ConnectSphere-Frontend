import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { authGuard, adminGuard, guestGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('auth guards', () => {
  let authService: any;
  let router: any;

  beforeEach(() => {
    authService = {
      hasToken: vi.fn(),
      ensureSession: vi.fn(),
      isAdmin: vi.fn(),
      currentUser: vi.fn()
    };
    router = {
      createUrlTree: vi.fn((segments: string[]) => ({ segments }))
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('authGuard redirects guests to login', () => {
    authService.hasToken.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
    expect(result).toEqual({ segments: ['/auth/login'] });
  });

  it('authGuard allows authenticated sessions', async () => {
    authService.hasToken.mockReturnValue(true);
    authService.ensureSession.mockReturnValue(of(true));

    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    await expect(firstValueFrom(result as any)).resolves.toBe(true);
  });

  it('adminGuard redirects non-admin users home after valid session', async () => {
    authService.isAdmin.mockReturnValue(false);
    authService.ensureSession.mockReturnValue(of(true));

    const result = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));
    await expect(firstValueFrom(result as any)).resolves.toEqual({ segments: ['/home'] });
  });

  it('guestGuard redirects logged in users home', () => {
    authService.hasToken.mockReturnValue(true);
    authService.currentUser.mockReturnValue({ userId: 'u1' });

    const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));

    expect(result).toEqual({ segments: ['/home'] });
  });
});
