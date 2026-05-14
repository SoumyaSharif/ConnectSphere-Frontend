import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminDashboardStats,
  AdminUserDetail,
  AdminUserListResponse,
  AdminUserFilters,
  AdminUpdateRoleRequest,
  AdminUpdateStatusRequest,
} from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly adminApiUrl = `${environment.apiUrl}/api/v1/auth/admin`;

  /** GET /api/v1/auth/admin/dashboard */
  getDashboardStats(): Observable<AdminDashboardStats> {
    return this.http.get<AdminDashboardStats>(`${this.adminApiUrl}/dashboard`);
  }

  /** GET /api/v1/auth/admin/users with filter/pagination params */
  getUsers(filters: AdminUserFilters): Observable<AdminUserListResponse> {
    let params = new HttpParams()
      .set('page', filters.page.toString())
      .set('size', filters.size.toString())
      .set('sort', filters.sort);

    if (filters.query) params = params.set('query', filters.query);
    if (filters.role) params = params.set('role', filters.role);
    if (filters.provider) params = params.set('provider', filters.provider);
    if (filters.active !== '' && filters.active !== undefined)
      params = params.set('active', String(filters.active));
    if (filters.verified !== '' && filters.verified !== undefined)
      params = params.set('verified', String(filters.verified));

    return this.http.get<AdminUserListResponse>(`${this.adminApiUrl}/users`, { params });
  }

  /** GET /api/v1/auth/admin/users/{userId} */
  getUserDetail(userId: string): Observable<AdminUserDetail> {
    return this.http.get<AdminUserDetail>(`${this.adminApiUrl}/users/${userId}`);
  }

  /** PATCH /api/v1/auth/admin/users/{userId}/role */
  updateRole(userId: string, request: AdminUpdateRoleRequest): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.adminApiUrl}/users/${userId}/role`,
      request
    );
  }

  /** PATCH /api/v1/auth/admin/users/{userId}/status */
  updateStatus(userId: string, request: AdminUpdateStatusRequest): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.adminApiUrl}/users/${userId}/status`,
      request
    );
  }

  /** DELETE /api/v1/auth/admin/users/{userId} */
  deleteUser(userId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.adminApiUrl}/users/${userId}`);
  }

  /** PATCH /api/v1/auth/admin/users/{userId}/verify — grant blue tick */
  approveVerification(userId: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.adminApiUrl}/users/${userId}/verify`,
      {}
    );
  }

  /** PATCH /api/v1/auth/admin/users/{userId}/deny-verification — refund & refuse */
  denyVerification(userId: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.adminApiUrl}/users/${userId}/deny-verification`,
      {}
    );
  }
}
