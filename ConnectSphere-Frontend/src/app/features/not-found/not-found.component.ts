import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="nf-page">
      <div class="nf-content">
        <div class="nf-code text-gradient">404</div>
        <h1 class="nf-title">Lost in Space</h1>
        <p class="nf-sub">The page you're looking for doesn't exist or has been moved.</p>
        <a routerLink="/home" class="btn-primary" id="btn-go-home">
          <span class="material-icons-outlined">home</span> Go Home
        </a>
      </div>
    </div>
  `,
  styles: [`
    .nf-page { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: var(--bg-deep); }
    .nf-content { text-align: center; }
    .nf-code { font-size: 120px; font-family: var(--font-heading); line-height: 1; margin-bottom: 16px; }
    .nf-title { font-size: 28px; margin-bottom: 12px; }
    .nf-sub { color: var(--text-muted); margin-bottom: 32px; }
    .btn-primary { display: inline-flex; align-items: center; gap: 8px; }
  `]
})
export class NotFoundComponent {}
