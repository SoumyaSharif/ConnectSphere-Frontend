import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { FollowService } from './follow.service';
import { AuthService } from './auth.service';
import { UserService } from './user.service';

describe('FollowService', () => {
  let service: FollowService;
  let httpMock: HttpTestingController;
  let authService: any;
  let userService: any;

  beforeEach(() => {
    authService = { hasToken: vi.fn() };
    userService = { getUserProfile: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        FollowService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
        { provide: UserService, useValue: userService }
      ]
    });

    service = TestBed.inject(FollowService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('returns false for isFollowing when the user has no token', () => {
    authService.hasToken.mockReturnValue(false);

    service.isFollowing('u2').subscribe((response) => {
      expect(response.isFollowing).toBe(false);
    });

    httpMock.expectNone(() => true);
  });

  it('resolves follower ids into paged user objects', () => {
    authService.hasToken.mockReturnValue(true);
    userService.getUserProfile.mockImplementation((id: string) => of({
      userId: id,
      username: id === 'u1' ? 'alice' : 'bob',
      email: `${id}@example.com`,
      role: 'USER',
      provider: 'LOCAL',
      isActive: true,
      createdAt: '2026-05-10T10:00:00Z'
    }));

    service.getFollowers('owner', 0, 1).subscribe((response) => {
      expect(response.content.length).toBe(1);
      expect(response.totalElements).toBe(2);
      expect(response.last).toBe(false);
    });

    const req = httpMock.expectOne((request) => request.method === 'GET' && request.url.endsWith('/api/v1/follows/owner/followers'));
    req.flush(['u1', 'u2']);
  });

  it('delegates follow, unfollow, counts and following lookup requests', () => {
    authService.hasToken.mockReturnValue(true);

    service.followUser('u2').subscribe();
    service.unfollowUser('u2').subscribe();
    service.isFollowing('u2').subscribe((response) => expect(response.isFollowing).toBe(true));
    service.getFollowerCount('owner').subscribe((response) => expect(response.count).toBe(3));
    service.getFollowingCount('owner').subscribe((response) => expect(response.count).toBe(4));
    service.getFollowingIds('owner').subscribe((response) => expect(response).toEqual(['u2']));

    httpMock.expectOne((request) => request.method === 'POST' && request.urlWithParams.endsWith('/api/v1/follows/?followeeId=u2')).flush({});
    httpMock.expectOne((request) => request.method === 'DELETE' && request.urlWithParams.endsWith('/api/v1/follows/?followeeId=u2')).flush({});
    httpMock.expectOne((request) => request.method === 'GET' && request.urlWithParams.endsWith('/api/v1/follows/is-following?followeeId=u2')).flush({ isFollowing: true });
    httpMock.expectOne((request) => request.method === 'GET' && request.url.endsWith('/api/v1/follows/owner/followers/count')).flush({ count: 3 });
    httpMock.expectOne((request) => request.method === 'GET' && request.url.endsWith('/api/v1/follows/owner/following/count')).flush({ count: 4 });
    httpMock.expectOne((request) => request.method === 'GET' && request.url.endsWith('/api/v1/follows/owner/following')).flush(['u2']);
  });

  it('returns an empty page when there are no ids to resolve', () => {
    service.getFollowing('owner').subscribe((response) => {
      expect(response.content).toEqual([]);
      expect(response.totalElements).toBe(0);
      expect(response.last).toBe(true);
    });

    httpMock.expectOne((request) => request.method === 'GET' && request.url.endsWith('/api/v1/follows/owner/following')).flush([]);
  });

  it('supports mutual lookups and paginates the resolved user list', () => {
    userService.getUserProfile.mockImplementation((id: string) => of({
      userId: id,
      username: id,
      email: `${id}@example.com`,
      role: 'USER',
      provider: 'LOCAL',
      isActive: true,
      createdAt: '2026-05-10T10:00:00Z'
    }));

    service.getMutuals('owner', 1, 1).subscribe((response) => {
      expect(response.content[0].userId).toBe('u2');
      expect(response.totalPages).toBe(2);
      expect(response.last).toBe(true);
    });

    httpMock.expectOne((request) => request.method === 'GET' && request.url.endsWith('/api/v1/follows/owner/mutual')).flush(['u1', 'u2']);
  });
});
