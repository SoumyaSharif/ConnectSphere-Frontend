import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LikeService } from './like.service';

describe('LikeService', () => {
  let service: LikeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LikeService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(LikeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('builds the like request with target and reaction type', () => {
    service.like('post 1', 'POST', 'LOVE').subscribe();

    const req = httpMock.expectOne((request) =>
      request.method === 'POST' &&
      request.url.includes('/api/v1/likes') &&
      request.urlWithParams.includes('targetId=post%201') &&
      request.urlWithParams.includes('targetType=POST') &&
      request.urlWithParams.includes('reactionType=LOVE')
    );
    expect(req.request.body).toEqual({});
    req.flush({});
  });

  it('checks like state and count through dedicated endpoints', () => {
    service.hasLiked('c1', 'COMMENT').subscribe((response) => expect(response.hasLiked).toBe(true));
    service.getCount('c1', 'COMMENT').subscribe((response) => expect(response.count).toBe(7));

    const hasLikedReq = httpMock.expectOne((request) => request.url.includes('/has-liked'));
    hasLikedReq.flush({ hasLiked: true });

    const countReq = httpMock.expectOne((request) => request.url.includes('/count'));
    countReq.flush({ count: 7 });
  });
});
