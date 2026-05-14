import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-otp',
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

    <div class="card auth-card">
      <div class="auth-header">
        <span class="material-icons" style="font-size:48px;color:#00D4FF;margin-bottom:12px;display:block;">mark_email_read</span>
        <h2>Verify OTP</h2>
        <p>We sent a 6-digit code to<br><strong style="color:#E8EAF0;">{{ maskedEmail }}</strong></p>
      </div>

      <div class="alert alert-error" *ngIf="error" style="margin-bottom: 20px;">
        <span class="material-icons">error_outline</span>
        {{ error }}
      </div>

      <!-- OTP digit inputs -->
      <form [formGroup]="otpForm" (ngSubmit)="onSubmit()" class="auth-form">
        <div style="display:flex;gap:10px;justify-content:center;margin:24px 0;">
          <input *ngFor="let ctrl of otpControls; let i = index"
            type="text"
            inputmode="numeric"
            maxlength="1"
            [id]="'otp-' + i"
            class="otp-digit-input"
            [formControl]="ctrl"
            (input)="onDigitInput($event, i)"
            (keydown)="onKeyDown($event, i)"
            (paste)="onPaste($event)"
            autocomplete="one-time-code"
            style="
              width:48px;height:56px;
              text-align:center;font-size:22px;font-weight:bold;
              background:#1A2235;color:#00D4FF;
              border:1.5px solid #2A344A;border-radius:12px;
              outline:none;transition:border 0.2s;
              font-family:monospace;
            "
          >
        </div>

        <!-- Timer -->
        <p style="text-align:center;color:#6B7280;font-size:13px;margin-bottom:20px;">
          <ng-container *ngIf="secondsLeft > 0">
            Code expires in <strong style="color:#E8EAF0;">{{ secondsLeft }}s</strong>
          </ng-container>
          <ng-container *ngIf="secondsLeft === 0">
            <span style="color:#FF4B2B;">Code expired.</span>
          </ng-container>
        </p>

        <button type="submit" class="btn btn-primary w-full submit-btn"
          [disabled]="loading || otpValue.length < 6 || secondsLeft === 0" id="btn-verify-otp">
          <span *ngIf="loading" class="material-icons rotating">autorenew</span>
          <span *ngIf="!loading">Verify & Continue</span>
        </button>
      </form>

      <p class="auth-footer" style="margin-top: 1.5rem;text-align:center;">
        Didn't receive it?
        <a (click)="resend()" style="cursor:pointer;color:#00D4FF;" [class.disabled]="resendCooldown > 0">
          {{ resendCooldown > 0 ? 'Resend in ' + resendCooldown + 's' : 'Resend OTP' }}
        </a>
      </p>

      <p class="auth-footer" style="margin-top: 0.5rem;">
        <a routerLink="/auth/forgot-password">← Use different email</a>
      </p>
    </div>
  </div>
</div>
  `,
  styles: [`
    .otp-digit-input:focus {
      border-color: #00D4FF !important;
      box-shadow: 0 0 0 3px rgba(0,212,255,0.15);
    }
    .disabled { opacity: 0.5; pointer-events: none; }
  `],
  styleUrls: ['../login/login.component.css']
})
export class VerifyOtpComponent implements OnInit, OnDestroy {

  otpForm: FormGroup;
  otpControls: any[] = [];

  email = '';
  maskedEmail = '';
  loading = false;
  error = '';

  secondsLeft = 600; // 10 minutes
  resendCooldown = 0;

  private timerInterval: any;
  private resendInterval: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Build 6 individual digit form controls
    const controls: any = {};
    for (let i = 0; i < 6; i++) {
      controls[`d${i}`] = this.fb.control('', [Validators.required, Validators.pattern(/^\d$/)]);
    }
    this.otpForm = this.fb.group(controls);
    this.otpControls = Object.values(this.otpForm.controls);
  }

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') || '';
    if (!this.email) {
      this.router.navigate(['/auth/forgot-password']);
      return;
    }
    this.maskedEmail = this.maskEmail(this.email);
    this.startTimer();
  }

  ngOnDestroy(): void {
    clearInterval(this.timerInterval);
    clearInterval(this.resendInterval);
  }

  get otpValue(): string {
    return Array.from({ length: 6 }, (_, i) => this.otpForm.get(`d${i}`)?.value || '').join('');
  }

  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '');
    this.otpForm.get(`d${index}`)?.setValue(val ? val[val.length - 1] : '');
    if (val && index < 5 && isPlatformBrowser(this.platformId)) {
      (document.getElementById(`otp-${index + 1}`) as HTMLInputElement)?.focus();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.otpForm.get(`d${index}`)?.value && index > 0 && isPlatformBrowser(this.platformId)) {
      (document.getElementById(`otp-${index - 1}`) as HTMLInputElement)?.focus();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') || '';
    const digits = text.replace(/\D/g, '').slice(0, 6);
    digits.split('').forEach((d, i) => {
      this.otpForm.get(`d${i}`)?.setValue(d);
    });
    if (digits.length > 0 && isPlatformBrowser(this.platformId)) {
      const lastIdx = Math.min(digits.length - 1, 5);
      (document.getElementById(`otp-${lastIdx}`) as HTMLInputElement)?.focus();
    }
  }

  onSubmit(): void {
    const otp = this.otpValue;
    if (otp.length < 6) { return; }
    this.loading = true;
    this.error = '';
    // Navigate to reset-password with email + otp as query params
    this.loading = false;
    this.router.navigate(['/auth/reset-password'], {
      queryParams: { email: this.email, otp }
    });
  }

  resend(): void {
    if (this.resendCooldown > 0) { return; }
    this.authService.forgotPassword(this.email).subscribe({
      next: () => {},
      error: () => {}
    });
    this.secondsLeft = 600;
    this.resendCooldown = 60;
    clearInterval(this.resendInterval);
    this.resendInterval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) clearInterval(this.resendInterval);
    }, 1000);
  }

  private startTimer(): void {
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.secondsLeft > 0) {
        this.secondsLeft--;
      } else {
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) return email;
    const visible = local.length > 3 ? local.slice(0, 3) : local.slice(0, 1);
    return `${visible}${'*'.repeat(Math.max(local.length - 3, 2))}@${domain}`;
  }
}
