import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { PostService } from './post.service';
import { UserService } from './user.service';
import { LikeService } from './like.service';
import { AuthService } from './auth.service';
import { CommentService } from './comment.service';

describe('PostService', () => {
  let service: PostService;
  let httpMock: HttpTestingController;
  let userService: any;
  let likeService: any;
  let commentService: any;
  let authService: { currentUser: () => { userId: string; username: string; email: string; role: 'USER'; provider: 'LOCAL'; isActive: true; createdAt: string } | null };

  beforeEach(() => {
    userService = { getUserProfile: vi.fn() };
    likeService = { hasLiked: vi.fn(), getCount: vi.fn() };
    commentService = { getCommentCount: vi.fn() };
    authService = {
      currentUser: () => ({
        userId: 'viewer',
        username: 'viewer',
        email: 'viewer@example.com',
        role: 'USER',
        provider: 'LOCAL',
        isActive: true,
        createdAt: '2026-05-10T10:00:00Z'
      })
    };

    userService.getUserProfile.mockReturnValue(of({
      userId: 'author-1',
      username: 'alice',
      email: 'alice@example.com',
      role: 'USER',
      provider: 'LOCAL',
      isActive: true,
      createdAt: '2026-05-10T10:00:00Z'
    }));
    likeService.hasLiked.mockReturnValue(of({ hasLiked: true }));
    likeService.getCount.mockReturnValue(of({ count: 9 }));
    commentService.getCommentCount.mockReturnValue(of({ count: 4 }));

    TestBed.configureTestingModule({
      providers: [
        PostService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UserService, useValue: userService },
        { provide: LikeService, useValue: likeService },
        { provide: AuthService, useValue: authService },
        { provide: CommentService, useValue: commentService }
      ]
    });

    service = TestBed.inject(PostService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('enriches the public feed with author and reaction data', () => {
    service.getPublicFeed().subscribe((response) => {
      expect(response.content[0].author?.username).toBe('alice');
      expect(response.content[0].hasLiked).toBe(true);
      expect(response.content[0].likesCount).toBe(9);
      expect(response.content[0].commentsCount).toBe(4);
    });

    const req = httpMock.expectOne((request) => request.url.includes('/api/v1/posts/public?page=0&size=10'));
    req.flush({
      content: [{
        postId: 'p1',
        authorId: 'author-1',
        content: 'hello',
        mediaUrls: [],
        postType: 'TEXT',
        visibility: 'PUBLIC',
        likesCount: 1,
        commentsCount: 2,
        sharesCount: 0,
        createdAt: '2026-05-10T10:00:00Z',
        updatedAt: '2026-05-10T10:00:00Z'
      }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
      last: true
    });
  });

  it('returns a cached post when fetching by id fails after a successful create', () => {
    service.createPost({ content: 'hello', visibility: 'PUBLIC' }).subscribe();
    const createReq = httpMock.expectOne((request) => request.method === 'POST' && request.url.endsWith('/api/v1/posts'));
    createReq.flush({
      postId: 'p2',
      authorId: 'author-1',
      content: 'hello',
      mediaUrls: [],
      postType: 'TEXT',
      visibility: 'PUBLIC',
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      createdAt: '2026-05-10T10:00:00Z',
      updatedAt: '2026-05-10T10:00:00Z'
    });

    userService.getUserProfile.mockReturnValue(throwError(() => new Error('profile unavailable')));
    likeService.hasLiked.mockReturnValue(throwError(() => new Error('like unavailable')));
    likeService.getCount.mockReturnValue(throwError(() => new Error('count unavailable')));
    commentService.getCommentCount.mockReturnValue(throwError(() => new Error('comments unavailable')));

    service.getPostById('p2').subscribe((post) => {
      expect(post.postId).toBe('p2');
      expect(post.content).toBe('hello');
    });

    const getReq = httpMock.expectOne((request) => request.method === 'GET' && request.url.endsWith('/api/v1/posts/p2'));
    getReq.flush('missing', { status: 500, statusText: 'Server Error' });
  });

  it('uses the public feed directly when there is no signed-in user', () => {
    authService.currentUser = () => null;

    service.getHomeFeed(1, 2).subscribe((response) => {
      expect(response.content.length).toBe(1);
      expect(response.size).toBe(2);
    });

    const req = httpMock.expectOne((request) => request.url.includes('/api/v1/posts/public?page=1&size=2'));
    req.flush({
      content: [{
        postId: 'public-1',
        authorId: 'author-1',
        content: 'public',
        mediaUrls: [],
        postType: 'TEXT',
        visibility: 'PUBLIC',
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        createdAt: '2026-05-10T10:00:00Z',
        updatedAt: '2026-05-10T10:00:00Z'
      }],
      totalElements: 1,
      totalPages: 1,
      number: 1,
      size: 2,
      last: true
    });
  });

  it('merges public and own posts in the home feed', () => {
    service.getHomeFeed(0, 2).subscribe((response) => {
      expect(response.content.map((post) => post.postId)).toEqual(['own-1', 'public-1']);
      expect(response.last).toBe(false);
    });

    httpMock.expectOne((request) => request.url.includes('/api/v1/posts/public?page=0&size=2')).flush({
      content: [{
        postId: 'public-1',
        authorId: 'author-1',
        content: 'public',
        mediaUrls: [],
        postType: 'TEXT',
        visibility: 'PUBLIC',
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        createdAt: '2026-05-10T09:00:00Z',
        updatedAt: '2026-05-10T09:00:00Z'
      }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 2,
      last: false
    });

    httpMock.expectOne((request) => request.url.includes('/api/v1/posts/user/viewer?page=0&size=20')).flush({
      content: [{
        postId: 'own-1',
        authorId: 'viewer',
        content: 'mine',
        mediaUrls: [],
        postType: 'TEXT',
        visibility: 'PUBLIC',
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        createdAt: '2026-05-10T11:00:00Z',
        updatedAt: '2026-05-10T11:00:00Z'
      }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
      last: false
    });
  });

  it('delegates user posts, search, delete and share endpoints', () => {
    service.getUserPosts('user/with spaces', 1, 3).subscribe((response) => expect(response.number).toBe(1));
    service.searchPosts('hello world', 2, 5).subscribe((response) => expect(response.number).toBe(2));
    service.deletePost('post/1').subscribe();
    service.incrementShare('post/1').subscribe();

    httpMock.expectOne((request) => request.method === 'GET' && request.url.includes('/api/v1/posts/user/user%2Fwith%20spaces?page=1&size=3')).flush({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 1,
      size: 3,
      last: true
    });
    httpMock.expectOne((request) => request.method === 'GET' && request.url.includes('/api/v1/posts/search?query=hello%20world&page=2&size=5')).flush({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 2,
      size: 5,
      last: true
    });
    httpMock.expectOne((request) => request.method === 'DELETE' && request.url.endsWith('/api/v1/posts/post%2F1')).flush({});
    httpMock.expectOne((request) => request.method === 'PATCH' && request.url.endsWith('/api/v1/posts/post%2F1/shares/increment')).flush({});
  });

  it('enriches a fetched post and uses current user fallback when author lookup fails', () => {
    userService.getUserProfile.mockReturnValue(throwError(() => new Error('profile unavailable')));

    service.getPostById('viewer-post').subscribe((post) => {
      expect((post.author as any)?.userId).toBe('viewer');
      expect(post.likesCount).toBe(9);
      expect(post.commentsCount).toBe(4);
    });

    httpMock.expectOne((request) => request.method === 'GET' && request.url.endsWith('/api/v1/posts/viewer-post')).flush({
      postId: 'viewer-post',
      authorId: 'viewer',
      content: 'hello',
      mediaUrls: [],
      postType: 'TEXT',
      visibility: 'PUBLIC',
      likesCount: 1,
      commentsCount: 2,
      sharesCount: 0,
      createdAt: '2026-05-10T10:00:00Z',
      updatedAt: '2026-05-10T10:00:00Z'
    });
  });
});
