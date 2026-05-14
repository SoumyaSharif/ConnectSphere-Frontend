import { Component, OnInit, ElementRef, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { gsap } from 'gsap';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
<div class="auth-wrapper">
  <div class="stars"></div>
  <div class="nebula nebula-1"></div>
  <div class="nebula nebula-2"></div>

  <div class="auth-container">
    <div class="brand-header">
      <span class="material-icons cosmic-icon">rocket_launch</span>
      <h1 class="glow-text">ConnectSphere</h1>
    </div>

    <div class="card auth-card" #card>
      <div class="auth-header">
        <h2>Forgot Password</h2>
        <p>Enter your email and we'll send you a 6-digit OTP.</p>
      </div>

      <div class="alert alert-error" *ngIf="error" style="margin-bottom: 20px;">
        <span class="material-icons">error_outline</span>
        {{ error }}
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
        <div class="form-group">
          <label>Email Address</label>
          <div class="input-wrapper">
            <span class="material-icons input-icon">email</span>
            <input type="email" class="input-field with-icon" formControlName="email"
              placeholder="astronaut@space.com" id="fp-email" autocomplete="email">
          </div>
          <div class="error-text" *ngIf="form.get('email')?.touched && form.get('email')?.errors?.['required']">Email is required</div>
          <div class="error-text" *ngIf="form.get('email')?.touched && form.get('email')?.errors?.['email']">Invalid email format</div>
        </div>

        <button type="submit" class="btn btn-primary w-full submit-btn" [disabled]="loading" id="btn-send-otp">
          <span *ngIf="loading" class="material-icons rotating">autorenew</span>
          <span *ngIf="!loading">Send OTP</span>
        </button>
      </form>

      <p class="auth-footer" style="margin-top: 1.5rem;">
        <a routerLink="/auth/login">← Back to Sign In</a>
      </p>
    </div>
  </div>
</div>
  `,
  styleUrls: ['../login/login.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  @ViewChild('card', { static: true }) card!: ElementRef;

  form: FormGroup;
  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      gsap.fromTo(this.card.nativeElement,
        { opacity: 0, y: 40, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out' }
      );
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = '';
    const email = this.form.value.email;
    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/auth/verify-otp'], { queryParams: { email } });
      },
      error: () => {
        // Navigate anyway — prevent email enumeration
        this.loading = false;
        this.router.navigate(['/auth/verify-otp'], { queryParams: { email } });
      }
    });
  }
}
