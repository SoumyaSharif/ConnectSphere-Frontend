import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AdminService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('builds dashboard request', () => {
    service.getDashboardStats().subscribe();

    const req = httpMock.expectOne((request) => request.url.endsWith('/api/v1/auth/admin/dashboard'));
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('builds filtered user list query params', () => {
    service.getUsers({
      page: 1,
      size: 20,
      sort: 'createdAt,desc',
      query: 'john',
      role: 'USER',
      provider: 'GOOGLE',
      active: true,
      verified: false
    } as any).subscribe();

    const req = httpMock.expectOne((request) =>
      request.url.endsWith('/api/v1/auth/admin/users') &&
      request.params.get('page') === '1' &&
      request.params.get('query') === 'john' &&
      request.params.get('active') === 'true' &&
      request.params.get('verified') === 'false'
    );
    req.flush({});
  });

  it('omits optional filters when they are blank', () => {
    service.getUsers({
      page: 0,
      size: 10,
      sort: 'createdAt,desc',
      query: '',
      role: '',
      provider: '',
      active: '',
      verified: ''
    } as any).subscribe();

    const req = httpMock.expectOne((request) =>
      request.url.endsWith('/api/v1/auth/admin/users') &&
      request.params.get('page') === '0' &&
      request.params.get('query') === null &&
      request.params.get('role') === null &&
      request.params.get('provider') === null &&
      request.params.get('active') === null &&
      request.params.get('verified') === null
    );
    req.flush({});
  });

  it('requests user detail and mutations through the expected endpoints', () => {
    service.getUserDetail('u1').subscribe();
    service.updateRole('u1', { role: 'ADMIN' } as any).subscribe();
    service.updateStatus('u1', { isActive: false } as any).subscribe();
    service.deleteUser('u1').subscribe();
    service.approveVerification('u1').subscribe();
    service.denyVerification('u1').subscribe();

    httpMock.expectOne((request) => request.method === 'GET' && request.url.endsWith('/api/v1/auth/admin/users/u1')).flush({});
    httpMock.expectOne((request) => request.method === 'PATCH' && request.url.endsWith('/api/v1/auth/admin/users/u1/role')).flush({});
    httpMock.expectOne((request) => request.method === 'PATCH' && request.url.endsWith('/api/v1/auth/admin/users/u1/status')).flush({});
    httpMock.expectOne((request) => request.method === 'DELETE' && request.url.endsWith('/api/v1/auth/admin/users/u1')).flush({});
    httpMock.expectOne((request) => request.method === 'PATCH' && request.url.endsWith('/api/v1/auth/admin/users/u1/verify')).flush({});
    httpMock.expectOne((request) => request.method === 'PATCH' && request.url.endsWith('/api/v1/auth/admin/users/u1/deny-verification')).flush({});
  });
});
