import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const newPassword = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');
  return newPassword && confirmPassword && newPassword.value === confirmPassword.value
    ? null
    : { mismatch: true };
};

@Component({
  selector: 'app-reset-password',
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
            <h2>Set New Password</h2>
            <p>Choose a strong password for your account.</p>
          </div>

          <div class="alert alert-success" *ngIf="done" style="margin-bottom: 20px;">
            <span class="material-icons">check_circle</span>
            Password reset! <a routerLink="/auth/login" style="color:#00D4FF;">Sign in now →</a>
          </div>

          <div class="alert alert-error" *ngIf="error" style="margin-bottom: 20px;">
            <span class="material-icons">error_outline</span>
            {{ error }}
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form" *ngIf="!done">
            <div class="form-group">
              <label>New Password</label>
              <div class="input-wrapper">
                <span class="material-icons input-icon">lock</span>
                <input type="password" class="input-field with-icon" formControlName="newPassword"
                  placeholder="Min 8 characters" id="rp-new-password" autocomplete="new-password">
              </div>
              <div class="error-text" *ngIf="form.get('newPassword')?.touched && form.get('newPassword')?.errors?.['required']">Password is required</div>
              <div class="error-text" *ngIf="form.get('newPassword')?.touched && form.get('newPassword')?.errors?.['minlength']">Minimum 8 characters</div>
            </div>

            <div class="form-group" style="margin-top: 15px;">
              <label>Confirm Password</label>
              <div class="input-wrapper">
                <span class="material-icons input-icon">lock_reset</span>
                <input type="password" class="input-field with-icon" formControlName="confirmPassword"
                  placeholder="Re-enter password" id="rp-confirm-password" autocomplete="new-password">
              </div>
              <div class="error-text" *ngIf="form.get('confirmPassword')?.touched && form.get('confirmPassword')?.errors?.['required']">Please confirm your password</div>
              <div class="error-text" *ngIf="form.get('confirmPassword')?.touched && form.errors?.['mismatch']">Passwords do not match</div>
            </div>

            <button type="submit" class="btn btn-primary w-full submit-btn" [disabled]="loading" id="btn-reset-password" style="margin-top: 20px;">
              <span *ngIf="loading" class="material-icons rotating">autorenew</span>
              <span *ngIf="!loading">Reset Password</span>
            </button>
          </form>

          <p class="auth-footer" style="margin-top: 1.5rem;" *ngIf="!done">
            <a routerLink="/auth/forgot-password">← Resend OTP</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../login/login.component.css']
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  loading = false;
  done = false;
  error = '';
  email = '';
  otp = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') || '';
    this.otp   = this.route.snapshot.queryParamMap.get('otp')   || '';
    if (!this.email || !this.otp) {
      this.router.navigate(['/auth/forgot-password']);
    }
  }

  onSubmit(): void {
    if (this.loading) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();
    
    this.authService.resetPassword(this.email, this.otp, this.form.value.newPassword).subscribe({
      next: () => { 
        this.done = true; 
        this.loading = false; 
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Reset Password Error:', err);
        const backendError = err.error?.message || err.error?.error;
        const fieldErrors = err.error?.fieldErrors ? JSON.stringify(err.error.fieldErrors) : '';
        this.error = backendError ? backendError + ' ' + fieldErrors : 'Invalid or expired OTP.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
