import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Story } from '../models/social.model';

@Injectable({ providedIn: 'root' })
export class StoryService {
  private readonly storyApiUrl = `${environment.apiUrl}/api/v1/stories`;

  constructor(private http: HttpClient) {}

  getStoriesFeed(): Observable<Story[]> {
    return this.http.get<Story[]>(`${this.storyApiUrl}/feed`);
  }

  getMyStories(): Observable<Story[]> {
    return this.http.get<Story[]>(`${this.storyApiUrl}/me`);
  }

  getStoriesByUser(userId: string): Observable<Story[]> {
    return this.http.get<Story[]>(`${this.storyApiUrl}/user/${userId}`);
  }

  createStory(payload: {
    mediaUrl: string;
    caption?: string;
    mediaType?: 'IMAGE' | 'VIDEO';
  }): Observable<Story> {
    return this.http.post<Story>(`${this.storyApiUrl}`, payload);
  }

  viewStory(storyId: string): Observable<void> {
    return this.http.post<void>(`${this.storyApiUrl}/${storyId}/view`, {});
  }
}
