import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, tap } from 'rxjs';
import { User, UpdateProfileRequest } from '../models/user.model';
import { MockDataService } from './mock-data.service';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly userApiUrl = `${environment.apiUrl}/api/v1/users`;
  private readonly authApiUrl = `${environment.apiUrl}/api/v1/auth`;

  constructor(
    private http: HttpClient,
    private mockData: MockDataService,
    private authService: AuthService
  ) {}

  getUserProfile(userId: string): Observable<User> {
    return this.http.get<User>(`${this.userApiUrl}/${userId}/profile`);
  }

  updateProfile(data: UpdateProfileRequest): Observable<User> {
    const payload = {
      username: data.username,
      fullName: data.fullName,
      bio: data.bio,
      website: data.website,
      profilePicUrl: data.profilePicUrl
    };

    return this.http.put<User>(`${this.authApiUrl}/profile`, payload).pipe(
      tap((user) => this.authService.updateStoredUser(user))
    );
  }

  getSuggestedUsers(): Observable<User[]> {
    return of(this.mockData.getSuggestedUsers()).pipe(delay(400));
  }
}
