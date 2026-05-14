import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TopbarComponent } from '../topbar/topbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { AuthService } from '../../core/services/auth.service';
import { PostComposerService } from '../../core/services/post-composer.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, TopbarComponent, SidebarComponent],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.css']
})
export class ShellComponent {
  currentUserId = computed(() => this.authService.currentUser()?.userId || '');

  constructor(
    public authService: AuthService,
    private postComposer: PostComposerService
  ) {}

  openCreatePost(): void {
    this.postComposer.open();
  }
}
