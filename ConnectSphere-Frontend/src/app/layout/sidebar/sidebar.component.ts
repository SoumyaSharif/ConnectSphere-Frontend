import { Component, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, UserAvatarComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  user!: Signal<User | null>;
  isAdmin!: Signal<boolean>;

  navItems = [
    { icon: 'home',           label: 'Home',          route: '/home' },
    { icon: 'explore',        label: 'Explore',       route: '/explore' },
    { icon: 'notifications',  label: 'Notifications', route: '/notifications' },
    { icon: 'person',         label: 'Profile',       route: '/profile/' },
    { icon: 'settings',       label: 'Settings',      route: '/settings' },
  ];

  constructor(public authService: AuthService) {
    this.user = authService.currentUser;
    this.isAdmin = authService.isAdmin;
  }

  getProfileRoute(): string {
    return `/profile/${this.user()?.userId}`;
  }

  logout(): void { this.authService.logout(); }
}
