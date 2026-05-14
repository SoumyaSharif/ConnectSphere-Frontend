import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { StoryService } from './story.service';

describe('StoryService', () => {
  let service: StoryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StoryService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(StoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('gets the stories feed', () => {
    service.getStoriesFeed().subscribe();

    const req = httpMock.expectOne((request) => request.url.endsWith('/api/v1/stories/feed'));
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('creates and views a story', () => {
    service.createStory({ mediaUrl: '/story.png', mediaType: 'IMAGE' }).subscribe();
    const createReq = httpMock.expectOne((request) => request.method === 'POST' && request.url.endsWith('/api/v1/stories'));
    expect(createReq.request.body.mediaUrl).toBe('/story.png');
    createReq.flush({});

    service.viewStory('s1').subscribe();
    const viewReq = httpMock.expectOne((request) => request.method === 'POST' && request.url.endsWith('/api/v1/stories/s1/view'));
    viewReq.flush({});
  });
});
