import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { User, AuthResponse, RegisterRequest, LoginRequest } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authApiUrl = `${environment.apiUrl}/api/v1/auth`;
  private readonly initialToken = this.loadToken();
  private readonly initialUser = this.initialToken ? this.loadUser() : null;
  private skipNextSessionValidation = false;

  private _currentUser = signal<User | null>(this.initialUser);
  private _token = signal<string | null>(this.initialToken);

  readonly currentUser = this._currentUser.asReadonly();
  readonly token = this._token.asReadonly();
  readonly hasToken = computed(() => this._token() !== null && !this.isTokenExpired(this._token()));
  readonly isLoggedIn = computed(() => this.hasToken());
  readonly isAdmin = computed(() => this._currentUser()?.role === 'ADMIN');

  constructor(private router: Router) {}

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authApiUrl}/login`, request).pipe(
      tap((res) => this.storeSession(res))
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authApiUrl}/register`, request).pipe(
      tap((res) => this.storeSession(res))
    );
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  expireSession(): void {
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.authApiUrl}/forgot-password`, { email });
  }

  resetPassword(email: string, otp: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.authApiUrl}/reset-password`, { email, otp, newPassword });
  }

  changePassword(data: any): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.authApiUrl}/password`, data);
  }

  deleteAccount(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.authApiUrl}/account`).pipe(
      tap(() => this.logout())
    );
  }

  refreshCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.authApiUrl}/me`).pipe(
      tap((user) => this.storeUser(user))
    );
  }

  ensureSession(): Observable<boolean> {
    const token = this._token();
    if (!token || this.isTokenExpired(token)) {
      this.clearSession();
      return of(false);
    }

    if (this.skipNextSessionValidation && this._currentUser()) {
      this.skipNextSessionValidation = false;
      return of(true);
    }

    return this.refreshCurrentUser().pipe(
      map(() => true),
      catchError(() => {
        this.clearSession();
        return of(false);
      })
    );
  }

  updateStoredUser(user: User): void {
    const current = this._currentUser();
    this.storeUser(current ? { ...current, ...user } : user);
  }

  handleOAuth2Callback(token: string, userId: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('cs_token', token);
    }
    this._token.set(token);

    this.refreshCurrentUser().subscribe({
      next: () => this.router.navigate(['/home']),
      error: () => {
        const fallbackUser: User = {
          userId,
          username: '',
          email: '',
          role: 'USER',
          provider: 'GOOGLE',
          isActive: true,
          createdAt: new Date().toISOString()
        };
        this.storeUser(fallbackUser);
        this.router.navigate(['/home']);
      }
    });
  }

  private storeSession(res: AuthResponse): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('cs_token', res.accessToken);
    }
    this._token.set(res.accessToken);
    this.skipNextSessionValidation = true;
    this.storeUser(res.user);
  }

  private storeUser(user: User): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('cs_user', JSON.stringify(user));
    }
    this._currentUser.set(user);
  }

  private clearSession(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('cs_token');
      localStorage.removeItem('cs_user');
    }
    this.skipNextSessionValidation = false;
    this._token.set(null);
    this._currentUser.set(null);
  }

  private loadToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('cs_token');
      if (!token) {
        return null;
      }

      if (this.isTokenExpired(token)) {
        localStorage.removeItem('cs_token');
        localStorage.removeItem('cs_user');
        return null;
      }

      return token;
    }
    return null;
  }

  private loadUser(): User | null {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('cs_user');
      if (!raw) {
        return null;
      }

      try {
        return JSON.parse(raw) as User;
      } catch {
        localStorage.removeItem('cs_user');
      }
    }
    return null;
  }

  private isTokenExpired(token: string | null): boolean {
    if (!token) {
      return true;
    }

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
}
