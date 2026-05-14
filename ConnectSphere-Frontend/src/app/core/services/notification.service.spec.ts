import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { NotificationService } from './notification.service';
import { UserService } from './user.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;
  let userService: any;

  beforeEach(() => {
    userService = { getUserProfile: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UserService, useValue: userService }
      ]
    });

    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('enriches system notifications without profile lookup', () => {
    service.getNotifications().subscribe((response) => {
      expect(response.content[0].actorUsername).toBe('ConnectSphere');
    });

    const req = httpMock.expectOne((request) => request.url.includes('/api/v1/notifications?page=0&size=20'));
    req.flush({
      content: [{ notificationId: 'n1', actorId: 'SYSTEM', message: 'Hello' }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
      last: true
    });
  });

  it('enriches actor details through user service', () => {
    userService.getUserProfile.mockReturnValue(of({
      userId: 'u2',
      username: 'alice',
      fullName: 'Alice',
      profilePicUrl: '/alice.png',
      email: 'alice@example.com',
      role: 'USER',
      provider: 'LOCAL',
      isActive: true,
      createdAt: '2026-05-10T10:00:00Z'
    }));

    service.getNotifications().subscribe((response) => {
      expect(response.content[0].actorUsername).toBe('alice');
      expect(response.content[0].actorPic).toBe('/alice.png');
    });

    const req = httpMock.expectOne((request) => request.url.includes('/api/v1/notifications?page=0&size=20'));
    req.flush({
      content: [{ notificationId: 'n2', actorId: 'u2', message: 'liked' }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
      last: true
    });
  });
});
