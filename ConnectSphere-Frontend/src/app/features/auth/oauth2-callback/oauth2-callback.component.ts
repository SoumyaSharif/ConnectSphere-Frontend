import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-oauth2-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:var(--bg-deep);">
      <div style="text-align:center;">
        <div class="spinner" style="width:48px;height:48px;border-width:4px;margin:0 auto 16px;"></div>
        <p style="color:var(--text-muted);">Completing sign in...</p>
      </div>
    </div>
  `,
  styles: [`.spinner{border:4px solid rgba(255,255,255,0.1);border-top-color:var(--accent-cyan);border-radius:50%;animation:spin 0.8s linear infinite;}@keyframes spin{to{transform:rotate(360deg);}}`]
})
export class OAuth2CallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute, 
    private authService: AuthService, 
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Only process the token in the browser so it gets saved to localStorage
    if (isPlatformBrowser(this.platformId)) {
      const token = this.route.snapshot.queryParamMap.get('token') || '';
      const userId = this.route.snapshot.queryParamMap.get('userId') || '';
      
      if (token) {
        this.authService.handleOAuth2Callback(token, userId);
      } else {
        this.router.navigate(['/auth/login']);
      }
    }
  }
}
