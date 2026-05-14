import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { PostService } from '../../core/services/post.service';
import { UserService } from '../../core/services/user.service';
import { FollowService } from '../../core/services/follow.service';
import { AuthService } from '../../core/services/auth.service';
import { PaymentService } from '../../core/services/payment.service';
import { Post } from '../../core/models/post.model';
import { User } from '../../core/models/user.model';
import { gsap } from 'gsap';
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, UserAvatarComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profileUser = signal<User | null>(null);
  posts = signal<Post[]>([]);
  loading = signal(true);
  isFollowing = signal(false);
  paymentLoading = signal(false);
  verificationPendingUi = signal(false);
  followersCount = signal(0);
  followingCount = signal(0);
  connectionSheetOpen = signal(false);
  connectionSheetTab = signal<'FOLLOWERS' | 'FOLLOWING'>('FOLLOWERS');
  connectionUsers = signal<User[]>([]);
  connectionLoading = signal(false);
  mobileMenuOpen = signal(false);
  toastMessage = signal<string | null>(null);
  toastSuccess = signal(true);

  readonly isDeniedCooldown = computed(() => {
    const until = this.profileUser()?.verificationDeniedUntil;
    if (!until) return false;
    return new Date(until) > new Date();
  });

  readonly retryDate = computed(() => {
    const until = this.profileUser()?.verificationDeniedUntil;
    if (!until) return '';
    return new Date(until).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  });

  isOwnProfile = computed(() => {
    const currentUserId = this.authService.currentUser()?.userId;
    const profileId = this.profileUser()?.userId;
    return !!currentUserId && !!profileId && currentUserId === profileId;
  });

  activeTab = signal<'POSTS' | 'MEDIA' | 'LIKES'>('POSTS');
  mediaPosts = computed(() => this.posts().filter((post) => (post.mediaUrls?.length || 0) > 0));

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private postService: PostService,
    private followService: FollowService,
    private authService: AuthService,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.authService.refreshCurrentUser().subscribe({
      next: () => {},
      error: () => {}
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadProfile(id);
      }
    });
  }

  loadProfile(userId: string): void {
    this.loading.set(true);
    this.isFollowing.set(false);
    this.connectionSheetOpen.set(false);
    this.connectionUsers.set([]);
    this.followersCount.set(0);
    this.followingCount.set(0);
    this.verificationPendingUi.set(false);

    this.userService.getUserProfile(userId).subscribe({
      next: user => {
        const currentUser = this.authService.currentUser();
        if (currentUser?.userId === user.userId) {
          this.paymentService.getMyStatus().pipe(
            catchError(() => of({
              isVerified: !!user.isVerified,
              verificationPending: !!user.verificationPending
            }))
          ).subscribe((paymentStatus) => {
            const resolvedUser = {
              ...user,
              website: currentUser?.website,
              profilePicUrl: user.profilePicUrl || currentUser?.profilePicUrl,
              bio: user.bio || currentUser?.bio,
              fullName: user.fullName || currentUser?.fullName,
              username: user.username || currentUser?.username,
              email: user.email || currentUser?.email,
              role: user.role || currentUser?.role,
              provider: user.provider || currentUser?.provider,
              isActive: user.isActive ?? currentUser?.isActive,
              isVerified: paymentStatus.isVerified,
              verificationPending: paymentStatus.verificationPending,
              verificationDeniedUntil: user.verificationDeniedUntil ?? currentUser?.verificationDeniedUntil ?? null
            };

            this.profileUser.set(resolvedUser);
            this.verificationPendingUi.set(!!paymentStatus.verificationPending);
            this.authService.updateStoredUser(resolvedUser);
            this.checkFollowState(userId);
            this.loadFollowStats(userId);
            this.loadUserPosts(userId);
          });
          return;
        }

        this.profileUser.set(user);
        this.verificationPendingUi.set(!!user.verificationPending);
        this.checkFollowState(userId);
        this.loadFollowStats(userId);
        this.loadUserPosts(userId);
      },
      error: () => this.loading.set(false)
    });
  }

  checkFollowState(userId: string): void {
    const currentUserId = this.authService.currentUser()?.userId;

    if (currentUserId === userId) return;

    this.followService.isFollowing(userId).pipe(
      catchError(() => of({ isFollowing: false }))
    ).subscribe(res => {
      this.isFollowing.set(res.isFollowing);
    });
  }

  loadUserPosts(userId: string): void {
    this.postService.getUserPosts(userId).subscribe({
      next: res => {
        this.posts.set(res.content);
        this.loading.set(false);
        setTimeout(() => this.animateItems(), 50);
      },
      error: () => this.loading.set(false)
    });
  }

  deletePost(event: Event, postId: string): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    this.postService.deletePost(postId).subscribe({
      next: () => {
        this.showToast('Post deleted successfully.', true);
        this.posts.update(posts => posts.filter(p => p.postId !== postId));
      },
      error: () => {
        this.showToast('Could not delete post. Please try again.', false);
      }
    });
  }

  loadFollowStats(userId: string): void {
    forkJoin({
      followers: this.followService.getFollowerCount(userId).pipe(catchError(() => of({ count: 0 }))),
      following: this.followService.getFollowingCount(userId).pipe(catchError(() => of({ count: 0 })))
    }).subscribe(({ followers, following }) => {
      this.followersCount.set(followers.count);
      this.followingCount.set(following.count);
    });
  }

  toggleFollow(): void {
    const userId = this.profileUser()?.userId;
    if (!userId) return;

    const wasFollowing = this.isFollowing();
    this.authService.ensureSession().pipe(
      switchMap((isAuthenticated) => {
        if (!isAuthenticated) {
          this.showToast('Your session expired. Please log in again.', false);
          return of(null);
        }

        return wasFollowing
          ? this.followService.unfollowUser(userId)
          : this.followService.followUser(userId);
      })
    ).subscribe({
      next: (result) => {
        if (result === null) {
          return;
        }

        const following = !wasFollowing;
        this.isFollowing.set(following);
        this.followersCount.update((count) => Math.max(0, count + (following ? 1 : -1)));
        this.showToast(
          following ? 'Now following this account.' : 'Unfollowed successfully.',
          true
        );

        if (this.connectionSheetOpen()) {
          this.openConnections(this.connectionSheetTab());
        }
      },
      error: () => {
        this.showToast(
          wasFollowing
            ? 'Could not unfollow right now. Please try again.'
            : 'Could not follow this account right now. Please try again.',
          false
        );
      }
    });
  }

  openConnections(tab: 'FOLLOWERS' | 'FOLLOWING'): void {
    const userId = this.profileUser()?.userId;
    if (!userId) {
      return;
    }

    this.connectionSheetTab.set(tab);
    this.connectionSheetOpen.set(true);
    this.connectionLoading.set(true);

    const request = tab === 'FOLLOWERS'
      ? this.followService.getFollowers(userId, 0, 100)
      : this.followService.getFollowing(userId, 0, 100);

    request.pipe(
      catchError(() => {
        this.showToast(`Could not load ${tab.toLowerCase()} right now. Please try again.`, false);
        return of({
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 100,
          last: true
        });
      }),
      finalize(() => this.connectionLoading.set(false))
    ).subscribe((response) => {
      this.connectionUsers.set(response.content);
    });
  }

  closeConnections(): void {
    this.connectionSheetOpen.set(false);
  }

  openMobileMenu(): void {
    this.mobileMenuOpen.set(true);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.closeMobileMenu();
  }

  setTab(tab: 'POSTS' | 'MEDIA' | 'LIKES'): void {
    this.activeTab.set(tab);
    setTimeout(() => this.animateItems(), 50);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  isVideoPost(post: Post): boolean {
    const firstMediaUrl = post.mediaUrls?.[0];
    if (!firstMediaUrl) {
      return false;
    }

    const lowerUrl = firstMediaUrl.toLowerCase();
    return lowerUrl.includes('video/')
      || lowerUrl.startsWith('data:video/')
      || lowerUrl.endsWith('.mp4')
      || lowerUrl.endsWith('.webm')
      || lowerUrl.endsWith('.ogg');
  }

  getGridPosts(): Post[] {
    switch (this.activeTab()) {
      case 'MEDIA':
        return this.mediaPosts();
      case 'LIKES':
        return [];
      case 'POSTS':
      default:
        return this.posts();
    }
  }

  getVerified(): void {
    const user = this.authService.currentUser();
    if (!user || this.paymentLoading()) return;

    this.paymentLoading.set(true);

    this.paymentService
      .openCheckout(user.email, user.fullName || user.username, user.userId)
      .then(res => {
        this.paymentLoading.set(false);
        if (res.success) {
          this.verificationPendingUi.set(true);
          const updated = {
            ...this.profileUser()!,
            isVerified: false,
            verificationPending: true
          };
          this.profileUser.set(updated);
          this.authService.updateStoredUser(updated);
          this.paymentService.getMyStatus().subscribe({
            next: status => {
              if (this.isOwnProfile()) {
                const refreshedProfile = {
                  ...this.profileUser()!,
                  isVerified: status.isVerified,
                  verificationPending: status.verificationPending
                };
                this.profileUser.set(refreshedProfile);
                this.verificationPendingUi.set(!!status.verificationPending);
                this.authService.updateStoredUser(refreshedProfile);
              }
            },
            error: () => {}
          });
          this.loadProfile(user.userId);
          this.showToast(res.message || 'Payment successful.', true);
        } else {
          this.showToast(res.message || 'Verification failed. Please try again.', false);
        }
      })
      .catch((err: Error) => {
        this.paymentLoading.set(false);
        if (err.message !== 'Payment cancelled by user.') {
          this.showToast(err.message || 'Payment failed. Please try again.', false);
        }
      });
  }

  private showToast(message: string, success: boolean): void {
    this.toastSuccess.set(success);
    this.toastMessage.set(message);
    setTimeout(() => this.toastMessage.set(null), 5000);
  }

  private animateItems(): void {
    gsap.fromTo(
      '.animate-item',
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
    );
  }
}
