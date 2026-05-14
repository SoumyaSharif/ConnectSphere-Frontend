import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { CommentService } from './comment.service';
import { UserService } from './user.service';
import { AuthService } from './auth.service';
import { LikeService } from './like.service';

describe('CommentService', () => {
  let service: CommentService;
  let httpMock: HttpTestingController;
  let userService: any;
  let authService: { currentUser: () => { userId: string } | null };
  let likeService: any;

  beforeEach(() => {
    userService = { getUserProfile: vi.fn() };
    likeService = { hasLiked: vi.fn(), like: vi.fn(), unlike: vi.fn() };
    authService = { currentUser: () => ({ userId: 'viewer' }) };

    TestBed.configureTestingModule({
      providers: [
        CommentService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UserService, useValue: userService },
        { provide: AuthService, useValue: authService },
        { provide: LikeService, useValue: likeService }
      ]
    });

    service = TestBed.inject(CommentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('enriches comments with author, likes, and replies', () => {
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

    service.getCommentsByPost('post-1').subscribe((response) => {
      expect(response.content[0].author.username).toBe('alice');
      expect(response.content[0].hasLiked).toBe(true);
      expect(response.content[0].replies.length).toBe(1);
    });

    const commentsReq = httpMock.expectOne((request) => request.url.includes('/api/v1/comments/post/post-1'));
    commentsReq.flush({
      content: [{ commentId: 'c1', authorId: 'author-1', content: 'Nice post' }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
      last: true
    });

    const repliesReq = httpMock.expectOne((request) => request.url.endsWith('/api/v1/comments/c1/replies'));
    repliesReq.flush([{ commentId: 'r1', authorId: 'author-1', content: 'reply' }]);
  });

  it('falls back to a default author when profile lookup fails', () => {
    userService.getUserProfile.mockReturnValue(throwError(() => new Error('profile failed')));
    likeService.hasLiked.mockReturnValue(of({ hasLiked: false }));

    service.getCommentsByPost('post-2').subscribe((response) => {
      expect(response.content[0].author.username).toBe('user');
      expect(response.content[0].replies).toEqual([]);
    });

    const commentsReq = httpMock.expectOne((request) => request.url.includes('/api/v1/comments/post/post-2'));
    commentsReq.flush({
      content: [{ commentId: 'c2', authorId: 'missing-user', content: 'Fallback me' }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
      last: true
    });

    const repliesReq = httpMock.expectOne((request) => request.url.endsWith('/api/v1/comments/c2/replies'));
    repliesReq.flush([]);
  });

  it('uses the current user as fallback author when ids match', () => {
    authService = { currentUser: () => ({ userId: 'viewer', username: 'viewer-user', fullName: 'Viewer User' }) };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        CommentService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UserService, useValue: userService },
        { provide: AuthService, useValue: authService },
        { provide: LikeService, useValue: likeService }
      ]
    });
    service = TestBed.inject(CommentService);
    httpMock = TestBed.inject(HttpTestingController);

    userService.getUserProfile.mockReturnValue(throwError(() => new Error('profile failed')));
    likeService.hasLiked.mockReturnValue(of({ hasLiked: false }));

    service.getCommentsByPost('post-3').subscribe((response) => {
      expect(response.content[0].author.username).toBe('viewer-user');
    });

    httpMock.expectOne((request) => request.url.includes('/api/v1/comments/post/post-3')).flush({
      content: [{ commentId: 'c3', authorId: 'viewer', content: 'Mine' }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
      last: true
    });
    httpMock.expectOne((request) => request.url.endsWith('/api/v1/comments/c3/replies')).flush([]);
  });

  it('adds comments, replies, likes and deletes through their respective APIs', () => {
    userService.getUserProfile.mockReturnValue(of({ userId: 'author-1', username: 'alice' }));
    likeService.hasLiked.mockReturnValue(of({ hasLiked: true }));
    likeService.like.mockReturnValue(of({}));
    likeService.unlike.mockReturnValue(of(void 0));

    service.addComment('post/new id', 'hello').subscribe((comment) => expect(comment.commentId).toBe('c4'));
    service.replyToComment('c4', 'reply').subscribe((reply) => expect(reply.commentId).toBe('r4'));
    service.likeComment('c4').subscribe();
    service.unlikeComment('c4').subscribe();
    service.deleteComment('c4').subscribe();
    service.getCommentCount('post/new id').subscribe((response) => expect(response.count).toBe(7));

    httpMock.expectOne((request) => request.method === 'POST' && request.url.includes('/api/v1/comments') && request.url.includes('postId=post%2Fnew%20id'))
      .flush({ commentId: 'c4', authorId: 'author-1', content: 'hello' });
    httpMock.expectOne((request) => request.url.endsWith('/api/v1/comments/c4/replies')).flush([]);

    httpMock.expectOne((request) => request.method === 'POST' && request.url.endsWith('/api/v1/comments/c4/reply'))
      .flush({ commentId: 'r4', authorId: 'author-1', content: 'reply' });

    expect(likeService.like).toHaveBeenCalledWith('c4', 'COMMENT');
    expect(likeService.unlike).toHaveBeenCalledWith('c4', 'COMMENT');
    httpMock.expectOne((request) => request.method === 'DELETE' && request.url.endsWith('/api/v1/comments/c4')).flush({});
    httpMock.expectOne((request) => request.method === 'GET' && request.url.endsWith('/api/v1/comments/count/post%2Fnew%20id')).flush({ count: 7 });
  });

  it('treats comments as not liked when there is no authenticated user', () => {
    authService = { currentUser: () => null };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        CommentService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UserService, useValue: userService },
        { provide: AuthService, useValue: authService },
        { provide: LikeService, useValue: likeService }
      ]
    });
    service = TestBed.inject(CommentService);
    httpMock = TestBed.inject(HttpTestingController);

    userService.getUserProfile.mockReturnValue(of({ userId: 'author-1', username: 'alice' }));

    service.getCommentsByPost('post-4').subscribe((response) => {
      expect(response.content[0].hasLiked).toBe(false);
    });

    httpMock.expectOne((request) => request.url.includes('/api/v1/comments/post/post-4')).flush({
      content: [{ commentId: 'c5', authorId: 'author-1', content: 'anonymous' }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
      last: true
    });
    httpMock.expectOne((request) => request.url.endsWith('/api/v1/comments/c5/replies')).flush([]);
  });
});
