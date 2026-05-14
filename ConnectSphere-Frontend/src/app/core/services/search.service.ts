import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, switchMap, catchError } from 'rxjs';
import { Hashtag } from '../models/hashtag.model';
import { User } from '../models/user.model';
import { Post, PagedResponse } from '../models/post.model';
import { environment } from '../../../environments/environment';
import { UserService } from './user.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly hashtagApiUrl = `${environment.apiUrl}/api/v1/hashtags`;
  private readonly userApiUrl = `${environment.apiUrl}/api/v1/users`;
  private readonly postApiUrl = `${environment.apiUrl}/api/v1/posts`;

  constructor(
    private http: HttpClient,
    private userService: UserService,
    private authService: AuthService
  ) {}

  getTrendingHashtags(limit = 10): Observable<Hashtag[]> {
    return this.http.get<Hashtag[]>(`${this.hashtagApiUrl}/trending?limit=${limit}`);
  }

  searchUsers(query: string, page = 0, size = 10): Observable<PagedResponse<User>> {
    return this.http.get<User[]>(`${this.userApiUrl}/search?query=${encodeURIComponent(query)}`).pipe(
      map((users) => this.paginateUsers(users, page, size))
    );
  }

  searchPosts(query: string, page = 0, size = 10): Observable<PagedResponse<Post>> {
    return this.http.get<PagedResponse<Post>>(
      `${this.postApiUrl}/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`
    ).pipe(
      switchMap((response) =>
        this.enrichPosts(response.content).pipe(
          map((content) => ({ ...response, content }))
        )
      )
    );
  }

  private enrichPosts(posts: Post[]): Observable<Post[]> {
    if (!posts.length) {
      return of([]);
    }

    return forkJoin(
      posts.map((post) =>
        this.userService.getUserProfile(post.authorId).pipe(
          catchError(() => of(this.getFallbackAuthor(post.authorId))),
          map((author) => ({
            ...post,
            author
          }))
        )
      )
    );
  }

  private paginateUsers(users: User[], page: number, size: number): PagedResponse<User> {
    const start = page * size;
    const content = users.slice(start, start + size);

    return {
      content,
      totalElements: users.length,
      totalPages: Math.ceil(users.length / size) || 1,
      number: page,
      size,
      last: start + size >= users.length
    };
  }

  private getFallbackAuthor(authorId: string): User {
    const currentUser = this.authService.currentUser();
    if (currentUser?.userId === authorId) {
      return currentUser;
    }

    return {
      userId: authorId,
      username: 'user',
      email: '',
      fullName: 'User',
      role: 'USER',
      provider: 'LOCAL',
      isActive: true,
      createdAt: new Date().toISOString()
    };
  }
}
