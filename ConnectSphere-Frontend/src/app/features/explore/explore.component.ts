import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../../core/services/search.service';
import { User } from '../../core/models/user.model';
import { Post } from '../../core/models/post.model';
import { Hashtag } from '../../core/models/hashtag.model';
import { gsap } from 'gsap';
import { PostService } from '../../core/services/post.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.css']
})
export class ExploreComponent implements OnInit, OnDestroy {
  activeTab = signal<'POSTS' | 'USERS'>('POSTS');
  searchQuery = signal('');
  loading = signal(false);
  
  posts = signal<Post[]>([]);
  users = signal<User[]>([]);
  postResultCount = signal(0);
  userResultCount = signal(0);
  trendingHashtags = signal<Hashtag[]>([]);
  recentPosts = signal<Post[]>([]);
  private postCreatedSubscription?: Subscription;

  constructor(
    private searchService: SearchService,
    private route: ActivatedRoute,
    private router: Router,
    private postService: PostService
  ) {}

  ngOnInit(): void {
    this.postCreatedSubscription = this.postService.postCreated$.subscribe((post) => {
      if (!this.searchQuery() && post.visibility === 'PUBLIC') {
        this.recentPosts.update((prev) => [post, ...prev.filter((item) => item.postId !== post.postId)].slice(0, 12));
      }
    });

    this.route.queryParams.subscribe(params => {
      const q = params['q'];
      if (q) {
        this.searchQuery.set(q);
        this.performSearch();
      } else {
        this.searchQuery.set('');
        this.posts.set([]);
        this.users.set([]);
        this.postResultCount.set(0);
        this.userResultCount.set(0);
        this.loadTrending();
        this.loadRecentPosts();
      }
    });
  }

  ngOnDestroy(): void {
    this.postCreatedSubscription?.unsubscribe();
  }

  setTab(tab: 'POSTS' | 'USERS'): void {
    this.activeTab.set(tab);
    if (this.searchQuery()) {
      this.performSearch();
    }
  }

  onSearch(event: Event): void {
    const query = this.searchQuery().trim();
    if ((event as KeyboardEvent).key === 'Enter') {
      this.router.navigate(['/explore'], { queryParams: query ? { q: query } : {} });
    }
  }

  loadTrending(): void {
    this.loading.set(true);
    this.searchService.getTrendingHashtags(10).subscribe({
      next: tags => {
        this.trendingHashtags.set(tags);
        this.loading.set(false);
        setTimeout(() => this.animateItems(), 50);
      },
      error: () => this.loading.set(false)
    });
  }

  loadRecentPosts(): void {
    this.postService.getPublicFeed(0, 12).subscribe({
      next: (res) => {
        this.recentPosts.set(res.content);
        setTimeout(() => this.animateItems(), 50);
      },
      error: () => this.recentPosts.set([])
    });
  }

  performSearch(): void {
    const query = this.searchQuery().trim();
    if (!query) {
      this.posts.set([]);
      this.users.set([]);
      this.postResultCount.set(0);
      this.userResultCount.set(0);
      this.loadTrending();
      return;
    }

    this.loading.set(true);
    
    if (this.activeTab() === 'POSTS') {
      this.searchService.searchPosts(query).subscribe({
        next: res => {
          this.posts.set(res.content);
          this.postResultCount.set(res.totalElements);
          this.loading.set(false);
          setTimeout(() => this.animateItems(), 50);
        },
        error: () => this.loading.set(false)
      });
    } else {
      this.searchService.searchUsers(query).subscribe({
        next: res => {
          this.users.set(res.content);
          this.userResultCount.set(res.totalElements);
          this.loading.set(false);
          setTimeout(() => this.animateItems(), 50);
        },
        error: () => this.loading.set(false)
      });
    }
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

  private animateItems(): void {
    gsap.fromTo('.animate-item', 
      { opacity: 0, y: 15 }, 
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
    );
  }
}
