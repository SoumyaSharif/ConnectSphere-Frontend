import { Component, OnInit, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { interval, startWith, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { User } from '../../core/models/user.model';
import { PostService } from '../../core/services/post.service';
import { PostComposerService } from '../../core/services/post-composer.service';
import { CreatePostRequest } from '../../core/models/post.model';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, UserAvatarComponent],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent implements OnInit {
  user!: Signal<User | null>;
  unreadCount = signal(0);
  searchQuery = '';
  postPreviewUrl = signal<string | null>(null);
  postMediaType = signal<'IMAGE' | 'VIDEO' | null>(null);
  postSubmitPending = signal(false);
  postError = signal<string | null>(null);
  postVisibility = signal<'PUBLIC' | 'FOLLOWERS'>('PUBLIC');
  postCaption = '';
  private postUploadDataUrl: string | null = null;

  constructor(
    private authService: AuthService,
    private notifService: NotificationService,
    private router: Router,
    private postService: PostService,
    public postComposer: PostComposerService
  ) {
    this.user = authService.currentUser;
  }

  ngOnInit(): void { 
    this.loadUnreadCount(); 
  }

  loadUnreadCount(): void {
    interval(30000).pipe(
      startWith(0),
      switchMap(() => this.notifService.getUnreadCount())
    ).subscribe((r) => this.unreadCount.set(r.count));
  }

  onSearch(event: Event): void {
    const query = this.searchQuery.trim();
    if ((event as KeyboardEvent).key === 'Enter' && query) {
      this.router.navigate(['/explore'], { queryParams: { q: query } });
    }
  }

  openCreatePost(): void {
    this.postComposer.open();
    this.postError.set(null);
  }

  closeCreatePost(): void {
    this.postComposer.close();
    this.postSubmitPending.set(false);
    this.postError.set(null);
    this.postPreviewUrl.set(null);
    this.postMediaType.set(null);
    this.postVisibility.set('PUBLIC');
    this.postCaption = '';
    this.postUploadDataUrl = null;
  }

  onPostFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      this.postError.set('Choose an image or MP4/WebM video for your post.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      this.postUploadDataUrl = result;
      this.postPreviewUrl.set(result);
      this.postMediaType.set(isVideo ? 'VIDEO' : 'IMAGE');
      this.postError.set(null);
    };
    reader.onerror = () => {
      this.postError.set('Could not read that media file. Please try another one.');
      this.postUploadDataUrl = null;
      this.postPreviewUrl.set(null);
      this.postMediaType.set(null);
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  submitPost(): void {
    const trimmedCaption = this.postCaption.trim();
    if (!trimmedCaption && !this.postUploadDataUrl) {
      this.postError.set('Add a caption or choose a photo/video before posting.');
      return;
    }

    const payload: CreatePostRequest = {
      content: trimmedCaption,
      mediaUrls: this.postUploadDataUrl ? [this.postUploadDataUrl] : [],
      visibility: this.postVisibility()
    };

    this.postSubmitPending.set(true);
    this.postError.set(null);

    this.postService.createPost(payload).subscribe({
      next: () => {
        this.postSubmitPending.set(false);
        this.closeCreatePost();
        this.router.navigate(['/home']);
      },
      error: () => {
        this.postSubmitPending.set(false);
        this.postError.set('Could not publish your post right now. Please try again.');
      }
    });
  }

  isVideoPreview(): boolean {
    return this.postMediaType() === 'VIDEO';
  }
}
