import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { Notification } from '../../core/models/social.model';
import { gsap } from 'gsap';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="notifications-container">
      <div class="header card">
        <h1 class="page-title">Notifications</h1>
        <button class="btn btn-secondary btn-sm" (click)="markAllAsRead()">Mark all as read</button>
      </div>

      <div class="notifications-list">
        @if (loading()) {
          <div class="loading-state">
            <span class="material-icons rotating" style="font-size: 48px; color: var(--accent-primary);">autorenew</span>
          </div>
        } @else {
          @for (notif of notifications(); track notif.notificationId) {
            <div class="card notif-card animate-item" [class.unread]="!notif.isRead" (click)="markAsRead(notif)">
              <div class="notif-icon-wrapper" [ngClass]="getIconClass(notif.type)">
                <span class="material-icons">{{ getIcon(notif.type) }}</span>
              </div>
              <div class="notif-avatar">
                <img *ngIf="notif.actorPic" [src]="notif.actorPic" class="avatar avatar-md">
                <div *ngIf="!notif.actorPic" class="avatar avatar-md avatar-placeholder">
                  {{ notif.actorUsername?.charAt(0) || 'S' | uppercase }}
                </div>
              </div>
              <div class="notif-content">
                <p>
                  <span class="actor-name">{{ notif.actorUsername }}</span>
                  {{ notif.message }}
                </p>
                <span class="notif-time">{{ formatDate(notif.createdAt) }}</span>
              </div>
              <div class="unread-dot" *ngIf="!notif.isRead"></div>
            </div>
          }
          @if (notifications().length === 0) {
            <div class="empty-state card">
              <span class="material-icons">notifications_off</span>
              <p>You're all caught up!</p>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .notifications-container { max-width: 680px; margin: 0 auto; }
    .header { padding: 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-title { font-size: 1.5rem; }
    
    .notifications-list { display: flex; flex-direction: column; gap: 12px; }
    .notif-card { padding: 16px; display: flex; align-items: center; gap: 16px; cursor: pointer; transition: all var(--transition); position: relative; }
    .notif-card:hover { background: var(--bg-card-hover); }
    .notif-card.unread { background: rgba(124, 58, 237, 0.05); border-color: rgba(124, 58, 237, 0.3); }
    
    .notif-icon-wrapper { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; }
    .icon-like { background: var(--accent-nebula); }
    .icon-comment { background: var(--accent-primary); }
    .icon-follow { background: var(--accent-cyan); }
    .icon-mention { background: var(--accent-star); }
    .icon-system { background: var(--text-muted); }
    
    .notif-content { flex: 1; }
    .notif-content p { font-size: 0.95rem; margin-bottom: 4px; line-height: 1.4; }
    .actor-name { font-weight: 600; color: var(--text-primary); }
    .notif-time { font-size: 0.8rem; color: var(--text-secondary); }
    
    .unread-dot { width: 10px; height: 10px; background: var(--accent-primary); border-radius: 50%; box-shadow: 0 0 8px var(--accent-primary); }

    .loading-state, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 64px; gap: 16px; color: var(--text-muted); }
    .empty-state .material-icons { font-size: 48px; }

    @media (max-width: 768px) {
      .header { flex-direction: column; align-items: stretch; gap: 12px; }
      .notif-card { align-items: flex-start; gap: 12px; }
      .notif-avatar { display: none; }
      .unread-dot { position: absolute; top: 18px; right: 16px; }
      .loading-state, .empty-state { padding: 40px 20px; text-align: center; }
    }
  `]
})
export class NotificationsComponent implements OnInit {
  notifications = signal<Notification[]>([]);
  loading = signal(true);

  constructor(
    private notifService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.notifService.getNotifications().subscribe({
      next: res => {
        this.notifications.set(res.content);
        this.loading.set(false);
        setTimeout(() => this.animateItems(), 50);
      },
      error: () => this.loading.set(false)
    });
  }

  markAsRead(notif: Notification): void {
    if (!notif.isRead) {
      notif.isRead = true;
      this.notifService.markAsRead(notif.notificationId).subscribe();
    }

    if (notif.deepLinkUrl) {
      this.router.navigateByUrl(notif.deepLinkUrl);
    }
  }

  markAllAsRead(): void {
    this.notifService.markAllAsRead().subscribe(() => {
      this.notifications.update(notifs => notifs.map(n => ({ ...n, isRead: true })));
    });
  }

  getIcon(type: string): string {
    switch (type) {
      case 'LIKE': return 'favorite';
      case 'COMMENT': return 'chat_bubble';
      case 'FOLLOW': return 'person_add';
      case 'MENTION': return 'alternate_email';
      default: return 'info';
    }
  }

  getIconClass(type: string): string {
    switch (type) {
      case 'LIKE': return 'icon-like';
      case 'COMMENT': return 'icon-comment';
      case 'FOLLOW': return 'icon-follow';
      case 'MENTION': return 'icon-mention';
      default: return 'icon-system';
    }
  }

  formatDate(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  }

  private animateItems(): void {
    gsap.fromTo('.animate-item', 
      { opacity: 0, x: -20 }, 
      { opacity: 1, x: 0, duration: 0.3, stagger: 0.05, ease: 'power2.out' }
    );
  }
}
