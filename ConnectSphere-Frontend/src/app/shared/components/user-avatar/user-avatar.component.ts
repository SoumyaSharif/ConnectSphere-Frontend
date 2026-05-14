import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-avatar.component.html',
  styleUrls: ['./user-avatar.component.css']
})
export class UserAvatarComponent implements OnChanges {
  /** URL of the user's profile picture */
  @Input() src: string | null | undefined = null;

  /** Username used to derive initials and gradient colour */
  @Input() username: string | null | undefined = null;

  /** Size class: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' */
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' = 'md';

  /** Whether to show the verified badge */
  @Input() verified = false;

  imgError = false;
  initials = '?';
  gradientId = '';
  gradientStart = '#7c3aed';
  gradientEnd = '#ec4899';

  /** Gradient palette — one per letter bucket */
  private readonly GRADIENTS: [string, string][] = [
    ['#7c3aed', '#a855f7'],
    ['#ec4899', '#f43f5e'],
    ['#06b6d4', '#0ea5e9'],
    ['#f59e0b', '#f97316'],
    ['#10b981', '#06b6d4'],
    ['#a855f7', '#ec4899'],
    ['#3b82f6', '#6366f1'],
    ['#14b8a6', '#10b981'],
  ];

  ngOnChanges(_: SimpleChanges): void {
    this.imgError = false;
    this.initials = this.getInitials();
    this.gradientId = 'grad-' + Math.random().toString(36).slice(2, 7);
    const idx = ((this.username?.charCodeAt(0) ?? 65) - 65) % this.GRADIENTS.length;
    [this.gradientStart, this.gradientEnd] = this.GRADIENTS[Math.abs(idx)];
  }

  onImgError(): void {
    this.imgError = true;
  }

  get showImage(): boolean {
    return !!this.src && !this.imgError;
  }

  private getInitials(): string {
    if (!this.username) return '?';
    const parts = this.username.trim().split(/[\s_-]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return this.username.slice(0, 2).toUpperCase();
  }
}
