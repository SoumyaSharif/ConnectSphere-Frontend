import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { PaymentService } from '../../core/services/payment.service';
import { User } from '../../core/models/user.model';
import { gsap } from 'gsap';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  activeTab = signal<'PROFILE' | 'ACCOUNT'>('PROFILE');
  user = signal<User | null>(null);

  profileForm!: FormGroup;
  saving = signal(false);
  successMsg = signal('');
  errorMsg = signal('');

  readonly isDeniedCooldown = computed(() => {
    const until = this.user()?.verificationDeniedUntil;
    if (!until) return false;
    return new Date(until) > new Date();
  });

  readonly retryDate = computed(() => {
    const until = this.user()?.verificationDeniedUntil;
    if (!until) return '';
    return new Date(until).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  });

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private paymentService: PaymentService,
    private fb: FormBuilder
  ) {
    this.user.set(this.authService.currentUser() || null);
    this.initForm();
  }

  ngOnInit(): void {
    this.authService.refreshCurrentUser().subscribe({
      next: user => {
        this.user.set(user);
        this.profileForm.patchValue({
          fullName: user.fullName || '',
          username: user.username || '',
          bio: user.bio || '',
          website: user.website || '',
          profilePicUrl: user.profilePicUrl || ''
        });
      },
      error: () => {}
    });

    setTimeout(() => this.animateContent(), 50);
  }

  initForm(): void {
    const u = this.user();
    this.profileForm = this.fb.group({
      fullName: [u?.fullName || ''],
      username: [u?.username || ''],
      bio: [u?.bio || ''],
      website: [u?.website || ''],
      profilePicUrl: [u?.profilePicUrl || '']
    });
  }

  setTab(tab: 'PROFILE' | 'ACCOUNT'): void {
    this.activeTab.set(tab);
    this.errorMsg.set('');
    this.successMsg.set('');
    setTimeout(() => this.animateContent(), 50);
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.saving.set(true);
    this.successMsg.set('');
    this.errorMsg.set('');

    this.userService.updateProfile(this.profileForm.value).subscribe({
      next: updatedUser => {
        this.user.set(updatedUser);
        this.saving.set(false);
        this.successMsg.set('Profile updated successfully.');
        setTimeout(() => this.successMsg.set(''), 3000);
      },
      error: () => {
        this.saving.set(false);
        this.errorMsg.set('Could not save your profile right now.');
      }
    });
  }

  quitVerification(): void {
    if (!confirm('Remove your blue tick and refund this verification purchase?')) return;

    this.saving.set(true);
    this.successMsg.set('');
    this.errorMsg.set('');

    this.paymentService.cancelVerification().subscribe({
      next: res => {
        const currentUser = this.user();
        if (currentUser) {
          const updated = { ...currentUser, isVerified: res.isVerified };
          this.user.set(updated);
          this.authService.updateStoredUser(updated);
        }

        this.authService.refreshCurrentUser().subscribe({
          next: freshUser => this.user.set(freshUser),
          error: () => {}
        });

        this.saving.set(false);
        this.successMsg.set(res.message || 'Blue tick removed successfully.');
        setTimeout(() => this.successMsg.set(''), 4000);
      },
      error: err => {
        this.saving.set(false);
        this.errorMsg.set(err?.error?.message || 'Refund failed. Please try again.');
      }
    });
  }

  onProfilePhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMsg.set('Please choose an image file for your profile photo.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (result) {
        this.profileForm.patchValue({ profilePicUrl: result });
      }
      this.errorMsg.set('');
    };
    reader.onerror = () => {
      this.errorMsg.set('Could not read that file. Please try another one.');
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  removeProfilePhoto(): void {
    this.profileForm.patchValue({ profilePicUrl: '' });
  }

  private animateContent(): void {
    gsap.fromTo(
      '.settings-content',
      { opacity: 0, x: 20 },
      { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }
    );
  }

  updateEmail(): void {
    const newEmail = window.prompt('Enter your new email address:', this.user()?.email || '');
    if (!newEmail || newEmail.trim() === '' || newEmail === this.user()?.email) return;
    
    const emailPattern = /^[a-zA-Z0-9.]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(newEmail.trim())) {
      alert('Invalid email format (only letters, numbers, and dots allowed before @)');
      return;
    }

    this.saving.set(true);
    this.successMsg.set('');
    this.errorMsg.set('');

    const payload = { ...this.profileForm.value, email: newEmail.trim() };
    this.userService.updateProfile(payload).subscribe({
      next: updatedUser => {
        this.user.set(updatedUser);
        this.saving.set(false);
        this.successMsg.set('Email updated successfully.');
        setTimeout(() => this.successMsg.set(''), 3000);
      },
      error: err => {
        this.saving.set(false);
        this.errorMsg.set(err?.error?.message || 'Could not update your email right now.');
      }
    });
  }

  changePassword(): void {
    const currentPassword = window.prompt('Enter your current password:');
    if (!currentPassword) return;
    
    const newPassword = window.prompt('Enter your new password (min 8 characters):');
    if (!newPassword || newPassword.length < 8) {
      alert('New password must be at least 8 characters long.');
      return;
    }

    this.saving.set(true);
    this.successMsg.set('');
    this.errorMsg.set('');

    this.authService.changePassword({ currentPassword, newPassword }).subscribe({
      next: res => {
        this.saving.set(false);
        this.successMsg.set(res.message || 'Password changed successfully.');
        setTimeout(() => this.successMsg.set(''), 3000);
      },
      error: err => {
        this.saving.set(false);
        this.errorMsg.set(err?.error?.message || 'Could not change your password.');
      }
    });
  }

  deleteAccount(): void {
    if (!confirm('Are you absolutely sure you want to permanently delete your account? This action cannot be undone.')) return;
    if (!confirm('This is your last warning. All your data will be erased. Proceed?')) return;

    this.saving.set(true);
    this.authService.deleteAccount().subscribe({
      next: () => {
        // deletion triggers logout in authService
      },
      error: err => {
        this.saving.set(false);
        this.errorMsg.set(err?.error?.message || 'Could not delete your account.');
      }
    });
  }
}
