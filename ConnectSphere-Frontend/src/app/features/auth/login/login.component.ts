import { Component, OnInit, ElementRef, ViewChild, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { gsap } from 'gsap';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  @ViewChild('card', { static: true }) card!: ElementRef;

  form: FormGroup;
  loading = false;
  error = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      gsap.fromTo(this.card.nativeElement,
        { opacity: 0, y: 40, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out' }
      );
    }
  }

  get f() { return this.form.controls; }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error = '';
    this.authService.login({ email: this.f['email'].value, password: this.f['password'].value })
      .subscribe({
        next: () => this.router.navigate(['/home']),
        error: err => {
          this.error = err.error?.message || 'Invalid email or password.';
          this.loading = false;
          this.cdr.detectChanges();
          gsap.fromTo(this.card.nativeElement, { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' });
        }
      });
  }

  loginWithGoogle(): void {
    window.location.href = `${environment.apiUrl}/oauth2/authorization/google`;
  }

  loginWithFacebook(): void {
    console.log('Login with Facebook');
    // Implement Facebook login logic
  }

  togglePassword(): void { this.showPassword = !this.showPassword; }
}
