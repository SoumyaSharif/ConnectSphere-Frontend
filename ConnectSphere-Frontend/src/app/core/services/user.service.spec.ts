import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { UserService } from './user.service';
import { MockDataService } from './mock-data.service';
import { AuthService } from './auth.service';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  let mockData: any;
  let authService: any;

  beforeEach(() => {
    mockData = { getSuggestedUsers: vi.fn(() => [{ userId: 'u1', username: 'alice' }]) };
    authService = { updateStoredUser: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        UserService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MockDataService, useValue: mockData },
        { provide: AuthService, useValue: authService }
      ]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('updates profile and syncs auth service', () => {
    service.updateProfile({ username: 'alice', fullName: 'Alice' }).subscribe();

    const req = httpMock.expectOne((request) => request.method === 'PUT' && request.url.endsWith('/api/v1/auth/profile'));
    req.flush({ userId: 'u1', username: 'alice' });

    expect(authService.updateStoredUser).toHaveBeenCalled();
  });

  it('returns suggested users from mock data', async () => {
    const users = await firstValueFrom(service.getSuggestedUsers());

    expect(users[0].userId).toBe('u1');
  });
});
