export interface Comment {
  commentId: string;
  postId: string;
  authorId: string;
  parentCommentId?: string;
  content: string;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
  author?: { username: string; profilePicUrl?: string; fullName?: string; isVerified?: boolean; };
}

export interface Notification {
  notificationId: string;
  recipientId: string;
  actorId: string;
  type: 'LIKE' | 'COMMENT' | 'REPLY' | 'FOLLOW' | 'MENTION' | 'BROADCAST' | 'SYSTEM';
  message: string;
  targetId?: string;
  targetType?: string;
  deepLinkUrl?: string;
  isRead: boolean;
  createdAt: string;
  actorUsername?: string;
  actorPic?: string;
  actorFullName?: string;
}

export interface Story {
  storyId: string;
  authorId: string;
  mediaUrl: string;
  caption?: string;
  mediaType: 'IMAGE' | 'VIDEO';
  viewsCount: number;
  expiresAt: string;
  createdAt: string;
  isActive: boolean;
  author?: { username: string; profilePicUrl?: string; fullName?: string; isVerified?: boolean; };
}

export interface Hashtag {
  hashtagId: string;
  tag: string;
  postCount: number;
  lastUsedAt: string;
}
