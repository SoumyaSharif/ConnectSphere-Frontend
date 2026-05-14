import { Component, OnDestroy, OnInit, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, switchMap, map, catchError } from 'rxjs';
import { PostService } from '../../core/services/post.service';
import { LikeService } from '../../core/services/like.service';
import { AuthService } from '../../core/services/auth.service';
import { SearchService } from '../../core/services/search.service';
import { StoryService } from '../../core/services/story.service';
import { UserService } from '../../core/services/user.service';
import { Hashtag } from '../../core/models/hashtag.model';
import { User } from '../../core/models/user.model';
import { Story } from '../../core/models/social.model';
import { gsap } from 'gsap';
import { Subscription } from 'rxjs';

type StoryCard = {
  id: string;
  authorId?: string;
  storyId?: string;
  username: string;
  profilePicUrl?: string;
  isOwn: boolean;
  viewed: boolean;
  mediaUrl?: string;
  caption?: string;
  createdAt?: string;
};

type StoryGroup = {
  id: string;
  username: string;
  profilePicUrl?: string;
  isOwn: boolean;
  viewed: boolean;
  stories: StoryCard[];
};

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.css']
})
export class FeedComponent implements OnInit, OnDestroy {
  posts = signal<any[]>([]);
  stories = signal<StoryGroup[]>([]);
  trendingHashtags = signal<Hashtag[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  activeStoryGroup = signal<StoryGroup | null>(null);
  activeStoryIndex = signal(0);
  storyComposerOpen = signal(false);
  storySubmitPending = signal(false);
  storyError = signal<string | null>(null);
  storyPreviewUrl = signal<string | null>(null);
  storyMediaType = signal<'IMAGE' | 'VIDEO'>('IMAGE');
  storyProgressToken = signal(0);
  page = 0;
  hasMore = true;
  storyCaption = '';
  private storyUploadDataUrl: string | null = null;
  private storyAdvanceTimer: ReturnType<typeof setTimeout> | null = null;
  private postLikePending = new Set<string>();
  private postSharePending = new Set<string>();
  private postCreatedSubscription?: Subscription;

  /** Maps postId → the emoji the user last reacted with */
  readonly postReactions = new Map<string, string>();
  /** Posts whose reaction picker is currently visible */
  readonly reactionPickerOpen = new Set<string>();
  private reactionCloseTimers = new Map<string, ReturnType<typeof setTimeout>>();

  readonly REACTIONS = [
    { emoji: '😊', label: 'Happy' },
    { emoji: '😂', label: 'Laugh' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '🌸', label: 'Flower' },
    { emoji: '❤️', label: 'Heart' },
    { emoji: '😡', label: 'Angry' },
    { emoji: '👎', label: 'Thumbs Down' },
  ];

  user!: Signal<User | null>;

  constructor(
    private postService: PostService,
    private likeService: LikeService,
    private searchService: SearchService,
    private storyService: StoryService,
    private userService: UserService,
    public authService: AuthService
  ) {
    this.user = authService.currentUser;
  }

  ngOnInit(): void {
    this.loadFeed();
    this.loadTrending();
    this.loadStories();
    this.postCreatedSubscription = this.postService.postCreated$.subscribe((post) => {
      if (post.visibility === 'PUBLIC') {
        this.posts.update((prev) => [{ ...post, animatingHeart: false }, ...prev]);
      }
    });
  }

  ngOnDestroy(): void {
    this.clearStoryTimer();
    this.postCreatedSubscription?.unsubscribe();
  }

  loadStories(): void {
    const currentUser = this.user();
    if (!currentUser?.userId) {
      this.stories.set([]);
      return;
    }

    forkJoin([
      this.storyService.getMyStories().pipe(catchError(() => of([]))),
      this.storyService.getStoriesFeed().pipe(catchError(() => of([])))
    ]).pipe(
      switchMap(([ownStories, followeeStories]) => {
        const ownStoryIds = new Set(ownStories.map((story) => story.storyId));
        const stories = this.mergeStories(ownStories, followeeStories);
        if (!stories.length) {
          return of([]);
        }

        const authorIds = [...new Set(
          stories
            .filter((story) => story.authorId !== currentUser.userId)
            .map((story) => story.authorId)
        )];

        const authorRequests = authorIds.length
          ? forkJoin(
              authorIds.map((authorId) =>
                this.userService.getUserProfile(authorId).pipe(
                  map((author) => [authorId, author] as const),
                  catchError(() => of([authorId, null] as const))
                )
              )
            )
          : of([]);

        return authorRequests.pipe(
          map((authors) => {
            const authorMap = authors.reduce((map, [authorId, author]) => {
              if (author) {
                map.set(authorId, author);
              }
              return map;
            }, new Map<string, User>());
            return this.buildStoryGroups(stories, currentUser, authorMap, ownStoryIds);
          })
        );
      })
    ).subscribe({
      next: (stories) => {
        const ownStoryPlaceholder: StoryGroup = {
          id: 'own-story-placeholder',
          username: 'Your Story',
          profilePicUrl: currentUser.profilePicUrl,
          isOwn: true,
          viewed: false,
          stories: []
        };

        this.stories.set(
          stories.some((story) => story.isOwn) ? stories : [ownStoryPlaceholder, ...stories]
        );
      },
      error: () => {
        this.stories.set([
          {
            id: 'own-story-placeholder',
            username: 'Your Story',
            profilePicUrl: currentUser.profilePicUrl,
            isOwn: true,
            viewed: false,
            stories: []
          }
        ]);
      }
    });
  }

  openStory(group: StoryGroup): void {
    if (!group.stories.length) {
      return;
    }

    this.activeStoryGroup.set(group);
    this.activeStoryIndex.set(0);
    this.stories.update((stories) =>
      stories.map((item) => item.id === group.id ? { ...item, viewed: true } : item)
    );
    this.markActiveStoryViewed();
    this.startStoryTimer();
  }

  closeStory(): void {
    this.clearStoryTimer();
    this.activeStoryGroup.set(null);
    this.activeStoryIndex.set(0);
  }

  openStoryComposer(): void {
    this.storyError.set(null);
    this.storyComposerOpen.set(true);
  }

  handleOwnStoryBadgeClick(event: Event): void {
    event.stopPropagation();
    this.openStoryComposer();
  }

  closeStoryComposer(): void {
    this.storyComposerOpen.set(false);
    this.storySubmitPending.set(false);
    this.storyError.set(null);
    this.storyPreviewUrl.set(null);
    this.storyMediaType.set('IMAGE');
    this.storyCaption = '';
    this.storyUploadDataUrl = null;
  }

  onStoryFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      this.storyError.set('Please choose an image or video file for your story.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      this.storyUploadDataUrl = result;
      this.storyPreviewUrl.set(result);
      this.storyMediaType.set(file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE');
      this.storyError.set(null);
    };
    reader.onerror = () => {
      this.storyError.set('Could not read that file. Please try another one.');
      this.storyUploadDataUrl = null;
      this.storyPreviewUrl.set(null);
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  submitStory(): void {
    if (!this.storyUploadDataUrl) {
      this.storyError.set('Choose an image or video before posting your story.');
      return;
    }

    this.storySubmitPending.set(true);
    this.storyError.set(null);
    this.storyService.createStory({
      mediaUrl: this.storyUploadDataUrl,
      caption: this.storyCaption.trim(),
      mediaType: this.storyMediaType()
    }).subscribe({
      next: () => {
        this.closeStoryComposer();
        this.loadStories();
      },
      error: () => {
        this.storySubmitPending.set(false);
        this.storyError.set('Could not post your story right now. Please try again.');
      }
    });
  }

  getCurrentStory(): StoryCard | null {
    const group = this.activeStoryGroup();
    if (!group) {
      return null;
    }

    return group.stories[this.activeStoryIndex()] || null;
  }

  hasPreviousStory(): boolean {
    return this.activeStoryIndex() > 0;
  }

  hasNextStory(): boolean {
    const group = this.activeStoryGroup();
    return !!group && this.activeStoryIndex() < group.stories.length - 1;
  }

  showPreviousStory(): void {
    if (!this.hasPreviousStory()) {
      return;
    }

    this.activeStoryIndex.update((index) => index - 1);
    this.markActiveStoryViewed();
    this.startStoryTimer();
  }

  showNextStory(): void {
    if (!this.hasNextStory()) {
      this.closeStory();
      return;
    }

    this.activeStoryIndex.update((index) => index + 1);
    this.markActiveStoryViewed();
    this.startStoryTimer();
  }

  setActiveStory(index: number): void {
    this.activeStoryIndex.set(index);
    this.markActiveStoryViewed();
    this.startStoryTimer();
  }

  isVideoStory(story: StoryCard | null): boolean {
    if (!story?.mediaUrl) {
      return false;
    }

    const mediaUrl = story.mediaUrl.toLowerCase();
    return mediaUrl.endsWith('.mp4')
      || mediaUrl.endsWith('.webm')
      || mediaUrl.endsWith('.ogg')
      || mediaUrl.includes('video');
  }

  isVideoPreview(previewUrl: string | null): boolean {
    return !!previewUrl && this.storyMediaType() === 'VIDEO';
  }

  loadFeed(): void {
    this.loading.set(true);
    this.postService.getHomeFeed(0, 20).subscribe({
      next: (res) => {
        const enhancedPosts = res.content.map((p: any) => ({ ...p, animatingHeart: false }));
        this.posts.set(enhancedPosts);
        this.hasMore = !res.last;
        this.page = 1;
        this.loading.set(false);
        setTimeout(() => this.animatePosts(), 100);
      },
      error: () => this.loading.set(false)
    });
  }

  loadTrending(): void {
    this.searchService.getTrendingHashtags(5).subscribe({
      next: (hashtags) => this.trendingHashtags.set(hashtags),
      error: () => console.error('Failed to load trending hashtags')
    });
  }

  loadMore(): void {
    if (!this.hasMore || this.loadingMore()) return;
    this.loadingMore.set(true);
    this.postService.getHomeFeed(this.page, 20).subscribe({
      next: (res) => {
        const enhancedPosts = res.content.map((p: any) => ({ ...p, animatingHeart: false }));
        this.posts.update((prev) => [...prev, ...enhancedPosts]);
        this.hasMore = !res.last;
        this.page++;
        this.loadingMore.set(false);
      },
      error: () => this.loadingMore.set(false)
    });
  }

  toggleLike(post: any): void {
    this.reactToPost(post, this.postReactions.get(post.postId) || '❤️');
  }

  openReactionPicker(postId: string): void {
    // Cancel any pending close
    const t = this.reactionCloseTimers.get(postId);
    if (t) { clearTimeout(t); this.reactionCloseTimers.delete(postId); }
    this.reactionPickerOpen.add(postId);
  }

  closeReactionPicker(postId: string, delay = 300): void {
    const t = setTimeout(() => {
      this.reactionPickerOpen.delete(postId);
      this.reactionCloseTimers.delete(postId);
    }, delay);
    this.reactionCloseTimers.set(postId, t);
  }

  isPickerOpen(postId: string): boolean {
    return this.reactionPickerOpen.has(postId);
  }

  getReactionEmoji(post: any): string {
    return this.postReactions.get(post.postId) || '🤍';
  }

  reactToPost(post: any, emoji: string): void {
    if (this.postLikePending.has(post.postId)) return;
    this.reactionPickerOpen.delete(post.postId);

    const alreadyReactedWithSame = post.hasLiked && this.postReactions.get(post.postId) === emoji;

    this.postLikePending.add(post.postId);

    if (!post.hasLiked) {
      // New reaction
      post.animatingHeart = true;
      setTimeout(() => post.animatingHeart = false, 1000);
      this.postReactions.set(post.postId, emoji);
      this.likeService.like(post.postId, 'POST').subscribe({
        next: () => {
          post.likesCount = (post.likesCount || 0) + 1;
          post.hasLiked = true;
          this.postLikePending.delete(post.postId);
        },
        error: () => {
          this.postReactions.delete(post.postId);
          post.animatingHeart = false;
          this.postLikePending.delete(post.postId);
        }
      });
    } else if (alreadyReactedWithSame) {
      // Same reaction again → unlike
      this.likeService.unlike(post.postId, 'POST').subscribe({
        next: () => {
          post.likesCount = Math.max(0, (post.likesCount || 0) - 1);
          post.hasLiked = false;
          this.postReactions.delete(post.postId);
          this.postLikePending.delete(post.postId);
        },
        error: () => this.postLikePending.delete(post.postId)
      });
    } else {
      // Change reaction (already liked, picking different emoji) — just update emoji locally
      this.postReactions.set(post.postId, emoji);
      this.postLikePending.delete(post.postId);
    }
  }

  sharePost(post: any): void {
    if (this.postSharePending.has(post.postId)) {
      return;
    }

    const shareUrl = `${window.location.origin}/post/${post.postId}`;
    const shareText = post.content?.trim() || 'Check out this post on ConnectSphere';

    const completeShare = () => {
      this.postSharePending.add(post.postId);
      this.postService.incrementShare(post.postId).subscribe({
        next: () => {
          post.sharesCount = (post.sharesCount || 0) + 1;
          this.postSharePending.delete(post.postId);
        },
        error: () => {
          this.postSharePending.delete(post.postId);
        }
      });
    };

    if (navigator.share) {
      navigator.share({
        title: post.author?.fullName || post.author?.username || 'ConnectSphere post',
        text: shareText,
        url: shareUrl
      }).then(() => completeShare()).catch(() => undefined);
      return;
    }

    navigator.clipboard.writeText(shareUrl).then(() => {
      completeShare();
    }).catch(() => {
      window.prompt('Copy this post link', shareUrl);
    });
  }

  deletePost(postId: string): void {
    this.postService.deletePost(postId).subscribe(() => {
      this.posts.update((prev) => prev.filter((p) => p.postId !== postId));
    });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}S`;
    if (diff < 3600) return `${Math.floor(diff / 60)}M`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}H`;
    return `${Math.floor(diff / 86400)}D`;
  }

  isVideoPost(post: any): boolean {
    const firstMediaUrl = post?.mediaUrls?.[0];
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

  private mergeStories(ownStories: Story[], feedStories: Story[]): Story[] {
    const storyMap = new Map<string, Story>();
    [...ownStories, ...feedStories].forEach((story) => {
      storyMap.set(story.storyId, story);
    });

    return [...storyMap.values()].sort((a, b) => {
      const ownPriority = Number(b.authorId === this.user()?.userId) - Number(a.authorId === this.user()?.userId);
      if (ownPriority !== 0) {
        return ownPriority;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  private buildStoryGroups(
    stories: Story[],
    currentUser: User,
    authorMap: Map<string, User>,
    ownStoryIds: Set<string>
  ): StoryGroup[] {
    const groupedStories = new Map<string, StoryCard[]>();

    stories.forEach((story) => {
      const isOwn = ownStoryIds.has(story.storyId) || story.authorId === currentUser.userId;
      const author = isOwn ? currentUser : authorMap.get(story.authorId);
      const storyCard: StoryCard = {
        id: story.storyId,
        authorId: story.authorId,
        storyId: story.storyId,
        username: isOwn ? 'Your Story' : author?.username || 'Story',
        profilePicUrl: isOwn ? currentUser.profilePicUrl : author?.profilePicUrl,
        isOwn,
        viewed: false,
        mediaUrl: story.mediaUrl,
        caption: story.caption,
        createdAt: story.createdAt
      };

      const groupId = isOwn ? 'own-story-group' : story.authorId;
      const currentStories = groupedStories.get(groupId) || [];
      currentStories.push(storyCard);
      groupedStories.set(groupId, currentStories);
    });

    return [...groupedStories.entries()].map(([groupId, groupStories]) => {
      const firstStory = groupStories[0];
      return {
        id: groupId,
        username: firstStory.username,
        profilePicUrl: firstStory.profilePicUrl,
        isOwn: firstStory.isOwn,
        viewed: false,
        stories: groupStories
      };
    });
  }

  private markActiveStoryViewed(): void {
    const currentStory = this.getCurrentStory();
    const currentGroup = this.activeStoryGroup();
    if (!currentStory?.storyId || !currentGroup) {
      return;
    }

    this.activeStoryGroup.update((group) => {
      if (!group) {
        return null;
      }

      return {
        ...group,
        viewed: true,
        stories: group.stories.map((story) =>
          story.id === currentStory.id ? { ...story, viewed: true } : story
        )
      };
    });

    this.stories.update((groups) =>
      groups.map((group) =>
        group.id === currentGroup.id
          ? {
              ...group,
              viewed: true,
              stories: group.stories.map((story) =>
                story.id === currentStory.id ? { ...story, viewed: true } : story
              )
            }
          : group
      )
    );

    this.storyService.viewStory(currentStory.storyId).pipe(
      catchError(() => of(void 0))
    ).subscribe();
  }

  private animatePosts(): void {
    gsap.fromTo('.post-card', { opacity: 0, y: 20 }, {
      opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out'
    });
  }

  private startStoryTimer(): void {
    this.clearStoryTimer();
    this.storyProgressToken.update((value) => value + 1);
    this.storyAdvanceTimer = setTimeout(() => this.showNextStory(), 7000);
  }

  private clearStoryTimer(): void {
    if (this.storyAdvanceTimer) {
      clearTimeout(this.storyAdvanceTimer);
      this.storyAdvanceTimer = null;
    }
  }
}
