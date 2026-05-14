import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PostService } from '../../core/services/post.service';
import { CommentService } from '../../core/services/comment.service';
import { LikeService } from '../../core/services/like.service';
import { AuthService } from '../../core/services/auth.service';
import { Post } from '../../core/models/post.model';
import { gsap } from 'gsap';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.css']
})
export class PostDetailComponent implements OnInit {
  post = signal<Post | null>(null);
  comments = signal<any[]>([]);
  loading = signal(true);
  commentSubmitting = signal(false);
  commentError = signal<string | null>(null);
  activeReplyCommentId = signal<string | null>(null);
  replyDrafts = signal<Record<string, string>>({});
  replySubmitting = signal<Record<string, boolean>>({});
  replyErrors = signal<Record<string, string | null>>({});
  newCommentText = '';

  constructor(
    private route: ActivatedRoute,
    private postService: PostService,
    private commentService: CommentService,
    private likeService: LikeService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadPostAndComments(id);
      }
    });
  }

  loadPostAndComments(postId: string): void {
    this.loading.set(true);
    const cachedPost = this.postService.getCachedPost(postId);
    if (cachedPost) {
      this.post.set(cachedPost);
    }
    
    this.postService.getPostById(postId).subscribe({
      next: p => {
        this.post.set(p);
        this.loadComments(postId);
      },
      error: () => {
        if (cachedPost) {
          this.loadComments(postId);
          return;
        }

        this.loading.set(false);
      }
    });
  }

  loadComments(postId: string): void {
    this.commentService.getCommentsByPost(postId).subscribe({
      next: res => {
        this.comments.set(res.content);
        this.loading.set(false);
        setTimeout(() => this.animateItems(), 50);
      },
      error: () => this.loading.set(false)
    });
  }

  toggleLike(): void {
    const p = this.post();
    if (!p) return;
    
    if (!p.hasLiked) {
      this.likeService.like(p.postId, 'POST').subscribe(() => {
        this.post.update(prev => prev ? { ...prev, hasLiked: true, likesCount: prev.likesCount + 1 } : prev);
      });
    } else {
      this.likeService.unlike(p.postId, 'POST').subscribe(() => {
        this.post.update(prev => prev ? { ...prev, hasLiked: false, likesCount: prev.likesCount - 1 } : prev);
      });
    }
  }

  addComment(): void {
    if (!this.newCommentText.trim() || !this.post()) return;

    const postId = this.post()!.postId;
    const commentText = this.newCommentText.trim();
    this.commentSubmitting.set(true);
    this.commentError.set(null);

    this.commentService.addComment(postId, commentText).subscribe({
      next: c => {
        this.comments.update(prev => [c, ...prev]);
        this.post.update(prev => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : prev);
        this.newCommentText = '';
        this.commentSubmitting.set(false);
        this.loadComments(postId);
        setTimeout(() => this.animateItems(), 50);
      },
      error: () => {
        this.commentSubmitting.set(false);
        this.commentError.set('Could not post your comment right now. Please try again.');
      }
    });
  }

  toggleReplyBox(commentId: string): void {
    this.replyErrors.update((prev) => ({ ...prev, [commentId]: null }));
    this.activeReplyCommentId.update((current) => current === commentId ? null : commentId);
  }

  updateReplyDraft(commentId: string, value: string): void {
    this.replyDrafts.update((prev) => ({ ...prev, [commentId]: value }));
  }

  submitReply(commentId: string): void {
    const replyText = (this.replyDrafts()[commentId] || '').trim();
    if (!replyText) {
      return;
    }

    this.replySubmitting.update((prev) => ({ ...prev, [commentId]: true }));
    this.replyErrors.update((prev) => ({ ...prev, [commentId]: null }));

    this.commentService.replyToComment(commentId, replyText).subscribe({
      next: (reply) => {
        this.comments.update((comments) =>
          comments.map((comment) => {
            if (comment.commentId !== commentId) {
              return comment;
            }

            return {
              ...comment,
              replies: [...(comment.replies || []), reply]
            };
          })
        );
        this.post.update((prev) => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : prev);
        this.replyDrafts.update((prev) => ({ ...prev, [commentId]: '' }));
        this.replySubmitting.update((prev) => ({ ...prev, [commentId]: false }));
        this.activeReplyCommentId.set(null);
        setTimeout(() => this.animateItems(), 50);
      },
      error: () => {
        this.replySubmitting.update((prev) => ({ ...prev, [commentId]: false }));
        this.replyErrors.update((prev) => ({
          ...prev,
          [commentId]: 'Could not post your reply right now.'
        }));
      }
    });
  }

  toggleCommentLike(comment: any, parentCommentId?: string | null): void {
    const hasLiked = !!comment.hasLiked;
    const request$ = hasLiked
      ? this.commentService.unlikeComment(comment.commentId)
      : this.commentService.likeComment(comment.commentId);

    request$.subscribe({
      next: () => {
        this.comments.update((comments) =>
          comments.map((item) => this.updateCommentLikeState(item, comment.commentId, !hasLiked, parentCommentId))
        );
      }
    });
  }

  isCommentLiked(comment: any): boolean {
    return !!comment?.hasLiked;
  }

  isReplyingTo(commentId: string): boolean {
    return this.activeReplyCommentId() === commentId;
  }

  isReplySubmitting(commentId: string): boolean {
    return !!this.replySubmitting()[commentId];
  }

  getReplyDraft(commentId: string): string {
    return this.replyDrafts()[commentId] || '';
  }

  getReplyError(commentId: string): string | null {
    return this.replyErrors()[commentId] || null;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString();
  }

  isVideoPost(): boolean {
    const firstMediaUrl = this.post()?.mediaUrls?.[0];
    if (!firstMediaUrl) {
      return false;
    }

    const lowerUrl = firstMediaUrl.toLowerCase();
    return lowerUrl.includes('video/')
      || lowerUrl.startsWith('data:video/')
      || lowerUrl.endsWith('.mp4')
      || lowerUrl.endsWith('.webm')
      || lowerUrl.endsWith('.ogg');
  }

  private updateCommentLikeState(comment: any, commentId: string, hasLiked: boolean, parentCommentId?: string | null) {
    if (parentCommentId && comment.commentId === parentCommentId) {
      return {
        ...comment,
        replies: (comment.replies || []).map((reply: any) =>
          reply.commentId === commentId
            ? {
                ...reply,
                hasLiked,
                likesCount: Math.max(0, (reply.likesCount || 0) + (hasLiked ? 1 : -1))
              }
            : reply
        )
      };
    }

    if (comment.commentId === commentId) {
      return {
        ...comment,
        hasLiked,
        likesCount: Math.max(0, (comment.likesCount || 0) + (hasLiked ? 1 : -1))
      };
    }

    return comment;
  }

  private animateItems(): void {
    gsap.fromTo('.animate-item', 
      { opacity: 0, y: 15 }, 
      { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: 'power2.out' }
    );
  }
}
