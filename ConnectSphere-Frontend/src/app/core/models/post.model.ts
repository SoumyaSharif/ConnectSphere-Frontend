export interface Post {
  postId: string;
  authorId: string;
  content: string;
  mediaUrls: string[];
  postType: 'TEXT' | 'MEDIA';
  visibility: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: string;
  updatedAt: string;
  author?: { username: string; profilePicUrl?: string; fullName?: string; isVerified?: boolean; };
  userReaction?: string;
  hasLiked?: boolean;
}

export interface CreatePostRequest {
  content: string;
  mediaUrls?: string[];
  visibility: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
}
