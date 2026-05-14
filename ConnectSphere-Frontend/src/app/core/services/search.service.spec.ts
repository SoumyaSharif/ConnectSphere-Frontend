import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { SearchService } from './search.service';
import { UserService } from './user.service';
import { AuthService } from './auth.service';

describe('SearchService', () => {
  let service: SearchService;
  let httpMock: HttpTestingController;
  let userService: any;
  let authService: any;

  beforeEach(() => {
    userService = { getUserProfile: vi.fn() };
    authService = { currentUser: vi.fn(() => null) };

    TestBed.configureTestingModule({
      providers: [
        SearchService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UserService, useValue: userService },
        { provide: AuthService, useValue: authService }
      ]
    });

    service = TestBed.inject(SearchService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('paginates user search results locally', () => {
    service.searchUsers('al', 1, 1).subscribe((response) => {
      expect(response.totalElements).toBe(2);
      expect(response.content[0].userId).toBe('u2');
    });

    const req = httpMock.expectOne((request) => request.url.includes('/api/v1/users/search?query=al'));
    req.flush([
      { userId: 'u1' },
      { userId: 'u2' }
    ]);
  });

  it('falls back when post author lookup fails', () => {
    userService.getUserProfile.mockReturnValue(throwError(() => new Error('boom')));

    service.searchPosts('hello').subscribe((response) => {
      expect(response.content[0].author?.username).toBe('user');
    });

    const req = httpMock.expectOne((request) => request.url.includes('/api/v1/posts/search?query=hello&page=0&size=10'));
    req.flush({
      content: [{
        postId: 'p1',
        authorId: 'u9',
        content: 'hello',
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
      number: 0,
      size: 10,
      last: true
    });
  });
});
