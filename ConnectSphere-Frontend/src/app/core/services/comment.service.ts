import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, switchMap, catchError } from 'rxjs';
import { PagedResponse } from '../models/post.model';
import { environment } from '../../../environments/environment';
import { UserService } from './user.service';
import { AuthService } from './auth.service';
import { LikeService } from './like.service';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly commentApiUrl = `${environment.apiUrl}/api/v1/comments`;

  constructor(
    private http: HttpClient,
    private userService: UserService,
    private authService: AuthService,
    private likeService: LikeService
  ) {}

  getCommentsByPost(postId: string, page = 0, size = 10): Observable<PagedResponse<any>> {
    return this.http.get<PagedResponse<any>>(
      `${this.commentApiUrl}/post/${postId}?page=${page}&size=${size}`
    ).pipe(
      switchMap((res) => this.enrichComments(res.content).pipe(
        map((content) => ({ ...res, content }))
      ))
    );
  }

  addComment(postId: string, content: string): Observable<any> {
    return this.http.post<any>(
      `${this.commentApiUrl}?postId=${encodeURIComponent(postId)}`,
      { content }
    ).pipe(
      switchMap((comment) => this.enrichComments([comment]).pipe(
        map((comments) => comments[0])
      ))
    );
  }

  replyToComment(commentId: string, content: string): Observable<any> {
    return this.http.post<any>(
      `${this.commentApiUrl}/${encodeURIComponent(commentId)}/reply`,
      { content }
    ).pipe(
      switchMap((reply) => this.enrichReplies([reply]).pipe(
        map((replies) => replies[0])
      ))
    );
  }

  likeComment(commentId: string): Observable<void> {
    return this.likeService.like(commentId, 'COMMENT').pipe(map(() => void 0));
  }

  unlikeComment(commentId: string): Observable<void> {
    return this.likeService.unlike(commentId, 'COMMENT');
  }

  deleteComment(commentId: string): Observable<void> {
    return this.http.delete<void>(`${this.commentApiUrl}/${commentId}`);
  }

  getCommentCount(postId: string): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.commentApiUrl}/count/${encodeURIComponent(postId)}`);
  }

  private enrichComments(comments: any[]): Observable<any[]> {
    if (!comments.length) {
      return of([]);
    }

    return forkJoin(
      comments.map((comment) =>
        forkJoin({
          author: this.userService.getUserProfile(comment.authorId).pipe(
            catchError(() => of(this.getFallbackAuthor(comment.authorId)))
          ),
          hasLiked: this.getCommentLikeState(comment.commentId),
          replies: this.getReplies(comment.commentId)
        }).pipe(
          map(({ author, hasLiked, replies }) => ({
            ...comment,
            author,
            hasLiked,
            replies
          }))
        )
      )
    );
  }

  private getReplies(commentId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.commentApiUrl}/${commentId}/replies`).pipe(
      switchMap((replies) => this.enrichReplies(replies))
    );
  }

  private enrichReplies(replies: any[]): Observable<any[]> {
    if (!replies.length) {
      return of([]);
    }

    return forkJoin(
      replies.map((reply) =>
        forkJoin({
          author: this.userService.getUserProfile(reply.authorId).pipe(
            catchError(() => of(this.getFallbackAuthor(reply.authorId)))
          ),
          hasLiked: this.getCommentLikeState(reply.commentId)
        }).pipe(
          map(({ author, hasLiked }) => ({ ...reply, author, hasLiked }))
        )
      )
    );
  }

  private getCommentLikeState(commentId: string): Observable<boolean> {
    if (!this.authService.currentUser()?.userId) {
      return of(false);
    }

    return this.likeService.hasLiked(commentId, 'COMMENT').pipe(
      map((response) => response.hasLiked),
      catchError(() => of(false))
    );
  }

  private getFallbackAuthor(authorId: string) {
    const currentUser = this.authService.currentUser();
    if (currentUser?.userId === authorId) {
      return currentUser;
    }

    return {
      userId: authorId,
      username: 'user',
      fullName: 'User'
    };
  }
}
