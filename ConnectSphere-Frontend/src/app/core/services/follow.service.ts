import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { User } from '../models/user.model';
import { PagedResponse } from '../models/post.model';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class FollowService {
  private readonly followApiUrl = `${environment.apiUrl}/api/v1/follows`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private userService: UserService
  ) {}

  followUser(targetUserId: string): Observable<void> {
    return this.http.post<void>(
      `${this.followApiUrl}/?followeeId=${encodeURIComponent(targetUserId)}`,
      {}
    );
  }

  unfollowUser(targetUserId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.followApiUrl}/?followeeId=${encodeURIComponent(targetUserId)}`
    );
  }

  isFollowing(targetUserId: string): Observable<{ isFollowing: boolean }> {
    if (!this.authService.hasToken()) {
      return of({ isFollowing: false });
    }

    return this.http.get<{ isFollowing: boolean }>(
      `${this.followApiUrl}/is-following?followeeId=${encodeURIComponent(targetUserId)}`
    );
  }

  getFollowers(userId: string, page = 0, size = 20): Observable<PagedResponse<User>> {
    return this.getUsersFromIds(`${this.followApiUrl}/${userId}/followers`, page, size);
  }

  getFollowing(userId: string, page = 0, size = 20): Observable<PagedResponse<User>> {
    return this.getUsersFromIds(`${this.followApiUrl}/${userId}/following`, page, size);
  }

  getMutuals(userId: string, page = 0, size = 20): Observable<PagedResponse<User>> {
    return this.getUsersFromIds(`${this.followApiUrl}/${userId}/mutual`, page, size);
  }

  getFollowerCount(userId: string): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.followApiUrl}/${userId}/followers/count`);
  }

  getFollowingCount(userId: string): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.followApiUrl}/${userId}/following/count`);
  }

  getFollowingIds(userId: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.followApiUrl}/${userId}/following`);
  }

  private getUsersFromIds(url: string, page: number, size: number): Observable<PagedResponse<User>> {
    return this.http.get<string[]>(url).pipe(
      switchMap((ids) => {
        if (!ids.length) {
          return of({
            content: [],
            totalElements: 0,
            totalPages: 0,
            number: page,
            size,
            last: true
          });
        }

        return forkJoin(ids.map((id) => this.userService.getUserProfile(id))).pipe(
          map((users) => {
            const start = page * size;
            const content = users.slice(start, start + size);
            return {
              content,
              totalElements: users.length,
              totalPages: Math.ceil(users.length / size),
              number: page,
              size,
              last: start + size >= users.length
            };
          })
        );
      })
    );
  }
}
