import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LikeService {
  private readonly likeApiUrl = `${environment.apiUrl}/api/v1/likes`;

  constructor(private http: HttpClient) {}

  like(targetId: string, type: 'POST' | 'COMMENT', reactionType = 'LIKE'): Observable<unknown> {
    return this.http.post(
      `${this.likeApiUrl}?targetId=${encodeURIComponent(targetId)}&targetType=${type}&reactionType=${reactionType}`,
      {}
    );
  }

  unlike(targetId: string, type: 'POST' | 'COMMENT'): Observable<void> {
    return this.http.delete<void>(
      `${this.likeApiUrl}?targetId=${encodeURIComponent(targetId)}&targetType=${type}`
    );
  }

  hasLiked(targetId: string, type: 'POST' | 'COMMENT'): Observable<{ hasLiked: boolean }> {
    return this.http.get<{ hasLiked: boolean }>(
      `${this.likeApiUrl}/has-liked?targetId=${encodeURIComponent(targetId)}&targetType=${type}`
    );
  }

  getCount(targetId: string, type: 'POST' | 'COMMENT'): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(
      `${this.likeApiUrl}/count?targetId=${encodeURIComponent(targetId)}&targetType=${type}`
    );
  }
}
