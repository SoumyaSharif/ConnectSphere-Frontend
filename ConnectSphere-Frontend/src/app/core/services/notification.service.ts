import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notification } from '../models/social.model';
import { PagedResponse } from '../models/post.model';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly notificationApiUrl = `${environment.apiUrl}/api/v1/notifications`;

  constructor(
    private http: HttpClient,
    private userService: UserService
  ) {}

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.notificationApiUrl}/unread-count`);
  }

  getNotifications(page = 0, size = 20): Observable<PagedResponse<Notification>> {
    return this.http.get<PagedResponse<Notification>>(`${this.notificationApiUrl}?page=${page}&size=${size}`).pipe(
      switchMap((response) => this.enrichNotifications(response))
    );
  }

  markAsRead(notificationId: string): Observable<void> {
    return this.http.patch<void>(`${this.notificationApiUrl}/${notificationId}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.notificationApiUrl}/read-all`, {});
  }

  private enrichNotifications(response: PagedResponse<Notification>): Observable<PagedResponse<Notification>> {
    if (!response.content.length) {
      return of(response);
    }

    return forkJoin(
      response.content.map((notification) => {
        if (!notification.actorId || notification.actorId === 'SYSTEM') {
          return of({
            ...notification,
            actorUsername: 'ConnectSphere',
            actorFullName: 'ConnectSphere'
          });
        }

        return this.userService.getUserProfile(notification.actorId).pipe(
          map((actor) => ({
            ...notification,
            actorUsername: actor.username,
            actorFullName: actor.fullName,
            actorPic: actor.profilePicUrl
          }))
        );
      })
    ).pipe(
      map((content) => ({ ...response, content }))
    );
  }
}
