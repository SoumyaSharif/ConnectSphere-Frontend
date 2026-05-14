import { Routes } from '@angular/router';
import { authGuard, guestGuard, adminGuard } from './core/guards/auth.guard';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  // Root → landing page for unauthenticated visitors
  { path: '', redirectTo: 'landing', pathMatch: 'full' },

  // Public Landing Page (no auth required)
  {
    path: 'landing',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
  },

  // Guest Routes (Auth)
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
      { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
      { path: 'verify-otp', loadComponent: () => import('./features/auth/verify-otp/verify-otp.component').then(m => m.VerifyOtpComponent) },
      { path: 'reset-password', loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },

  // OAuth2 callback — NO guard: user has no token yet when Google redirects here
  {
    path: 'auth/oauth2/callback',
    loadComponent: () => import('./features/auth/oauth2-callback/oauth2-callback.component').then(m => m.OAuth2CallbackComponent)
  },

  // Main App Routes (Authenticated)
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'home', loadComponent: () => import('./features/feed/feed.component').then(m => m.FeedComponent) },
      { path: 'explore', loadComponent: () => import('./features/explore/explore.component').then(m => m.ExploreComponent) },
      { path: 'notifications', loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent) },
      { path: 'profile/:id', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent) },
      { path: 'post/:id', loadComponent: () => import('./features/post-detail/post-detail.component').then(m => m.PostDetailComponent) },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },

  // Fallback — unknown paths go to landing
  { path: '**', redirectTo: 'landing' }
];
