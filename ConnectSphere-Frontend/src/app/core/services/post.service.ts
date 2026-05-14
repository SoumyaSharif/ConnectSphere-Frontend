import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, forkJoin, map, of, switchMap, catchError, tap } from 'rxjs';
import { Post, PagedResponse, CreatePostRequest } from '../models/post.model';
import { environment } from '../../../environments/environment';
import { UserService } from './user.service';
import { LikeService } from './like.service';
import { AuthService } from './auth.service';
import { CommentService } from './comment.service';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class PostService {
  private readonly postApiUrl = `${environment.apiUrl}/api/v1/posts`;
  private readonly postCreatedSubject = new Subject<Post>();
  private readonly postCache = new Map<string, Post>();
  readonly postCreated$ = this.postCreatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private userService: UserService,
    private likeService: LikeService,
    private authService: AuthService,
    private commentService: CommentService
  ) {}

  getHomeFeed(page = 0, size = 10): Observable<PagedResponse<Post>> {
    const currentUserId = this.authService.currentUser()?.userId;

    if (!currentUserId) {
      return this.getPublicFeed(page, size);
    }

    return forkJoin({
      publicFeed: this.getPublicFeed(page, size),
      ownPosts: this.getUserPosts(currentUserId, 0, Math.max(size, 20))
    }).pipe(
      map(({ publicFeed, ownPosts }) => {
        const mergedPosts = [...publicFeed.content, ...ownPosts.content]
          .reduce((map, post) => map.set(post.postId, post), new Map<string, Post>());

        const content = [...mergedPosts.values()]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, size);

        return {
          ...publicFeed,
          content,
          size,
          last: publicFeed.last && ownPosts.last && content.length < size
        };
      })
    );
  }

  getPublicFeed(page = 0, size = 10): Observable<PagedResponse<Post>> {
    return this.http.get<PagedResponse<Post>>(`${this.postApiUrl}/public?page=${page}&size=${size}`).pipe(
      switchMap((response) => this.enrichPosts(response.content).pipe(
        map((content) => ({ ...response, content }))
      ))
    );
  }

  getPostById(id: string): Observable<Post> {
    return this.http.get<Post>(`${this.postApiUrl}/${id}`).pipe(
      switchMap((post) => this.enrichPost(post)),
      catchError((error) => {
        const cachedPost = this.getCachedPost(id);
        if (!cachedPost) {
          throw error;
        }

        return of(cachedPost);
      })
    );
  }

  getUserPosts(userId: string, page = 0, size = 9): Observable<PagedResponse<Post>> {
    return this.http.get<PagedResponse<Post>>(
      `${this.postApiUrl}/user/${encodeURIComponent(userId)}?page=${page}&size=${size}`
    ).pipe(
      switchMap((response) => this.enrichPosts(response.content).pipe(
        map((content) => ({ ...response, content }))
      ))
    );
  }

  createPost(data: CreatePostRequest): Observable<Post> {
    return this.http.post<Post>(this.postApiUrl, data).pipe(
      switchMap((post) => this.enrichPost(post)),
      tap((post) => {
        this.cachePost(post);
        this.postCreatedSubject.next(post);
      })
    );
  }

  deletePost(postId: string): Observable<void> {
    return this.http.delete<void>(`${this.postApiUrl}/${encodeURIComponent(postId)}`);
  }

  searchPosts(q: string, page = 0, size = 10): Observable<PagedResponse<Post>> {
    return this.http.get<PagedResponse<Post>>(
      `${this.postApiUrl}/search?query=${encodeURIComponent(q)}&page=${page}&size=${size}`
    ).pipe(
      switchMap((response) => this.enrichPosts(response.content).pipe(
        map((content) => ({ ...response, content }))
      ))
    );
  }

  incrementShare(postId: string): Observable<void> {
    return this.http.patch<void>(`${this.postApiUrl}/${encodeURIComponent(postId)}/shares/increment`, {});
  }

  getCachedPost(postId: string): Post | null {
    return this.postCache.get(postId) || null;
  }

  private enrichPosts(posts: Post[]): Observable<Post[]> {
    if (!posts.length) {
      return of([]);
    }

    return forkJoin(posts.map((post) => this.enrichPost(post)));
  }

  private enrichPost(post: Post): Observable<Post> {
    const author$ = this.userService.getUserProfile(post.authorId).pipe(
      catchError(() => of(this.getFallbackAuthor(post.authorId)))
    );
    const hasLiked$ = this.authService.currentUser()?.userId
      ? this.likeService.hasLiked(post.postId, 'POST').pipe(
          map((response) => response.hasLiked),
          catchError(() => of(false))
        )
      : of(false);
    const likesCount$ = this.likeService.getCount(post.postId, 'POST').pipe(
      map((response) => response.count),
      catchError(() => of(post.likesCount || 0))
    );
    const commentsCount$ = this.commentService.getCommentCount(post.postId).pipe(
      map((response) => response.count),
      catchError(() => of(post.commentsCount || 0))
    );

    return forkJoin([author$, hasLiked$, likesCount$, commentsCount$]).pipe(
      map(([author, hasLiked, likesCount, commentsCount]) => ({
        ...post,
        author,
        hasLiked,
        likesCount,
        commentsCount
      })),
      tap((enrichedPost) => this.cachePost(enrichedPost))
    );
  }

  private cachePost(post: Post): void {
    this.postCache.set(post.postId, post);
  }

  private getFallbackAuthor(authorId: string): User {
    const currentUser = this.authService.currentUser();
    if (currentUser?.userId === authorId) {
      return currentUser;
    }

    return {
      userId: authorId,
      username: 'user',
      email: '',
      fullName: 'User',
      role: 'USER',
      provider: 'LOCAL',
      isActive: true,
      createdAt: new Date().toISOString()
    };
  }
}
