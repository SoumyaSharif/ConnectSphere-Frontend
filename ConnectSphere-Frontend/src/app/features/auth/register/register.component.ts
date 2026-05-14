import { Component, OnInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { gsap } from 'gsap';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['../login/login.component.css'] // reuse login styles
})
export class RegisterComponent implements OnInit {
  @ViewChild('card', { static: true }) card!: ElementRef;

  form: FormGroup;
  loading = false;
  error = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      fullName: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  ngOnInit(): void {
    gsap.fromTo(this.card.nativeElement,
      { opacity: 0, y: 40, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out' }
    );
  }

  get f() { return this.form.controls; }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error = '';
    
    this.authService.register(this.form.value).subscribe({
      next: () => this.router.navigate(['/home']),
      error: err => {
        this.error = this.getErrorMessage(err);
        this.loading = false;
        this.cdr.detectChanges();
        gsap.fromTo(this.card.nativeElement, { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' });
      }
    });
  }

  loginWithGoogle(): void {
    window.location.href = `${environment.apiUrl}/oauth2/authorization/google`;
  }

  togglePassword(): void { this.showPassword = !this.showPassword; }

  private getErrorMessage(err: HttpErrorResponse): string {
    const fieldErrors = err.error?.fieldErrors;
    if (fieldErrors && typeof fieldErrors === 'object') {
      return Object.values(fieldErrors).join(', ');
    }

    return err.error?.message || 'Registration failed. Try again.';
  }
}
