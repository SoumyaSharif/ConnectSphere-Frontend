/**
 * Admin-specific TypeScript models.
 * These match the backend DTOs in auth-user-service exactly.
 */

export interface AdminDashboardStats {
  // User stats (always present)
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  adminCount: number;
  verifiedUsers: number;
  localUsers: number;
  googleUsers: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  // Social stats from sibling services (null if service unreachable)
  totalPosts: number | null;
  totalComments: number | null;
  totalLikes: number | null;
  totalFollows: number | null;
}

export interface AdminUserSummary {
  userId: string;
  username: string;
  email: string;
  fullName?: string;
  profilePicUrl?: string;
  role: 'GUEST' | 'USER' | 'ADMIN';
  provider: 'LOCAL' | 'GOOGLE';
  isActive: boolean;
  isVerified: boolean;
  verificationPending: boolean;
  verificationDeniedUntil?: string | null;
  createdAt: string;
}

export interface AdminUserDetail extends AdminUserSummary {
  bio?: string;
  updatedAt?: string;
}

export interface AdminUserListResponse {
  content: AdminUserSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface AdminUpdateRoleRequest {
  role: 'GUEST' | 'USER' | 'ADMIN';
}

export interface AdminUpdateStatusRequest {
  active: boolean;
}

export interface AdminUserFilters {
  query?: string;
  role?: 'GUEST' | 'USER' | 'ADMIN' | '';
  provider?: 'LOCAL' | 'GOOGLE' | '';
  active?: boolean | '';
  verified?: boolean | '';
  page: number;
  size: number;
  sort: string;
}
