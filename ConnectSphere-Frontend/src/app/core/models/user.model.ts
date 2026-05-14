export interface User {
  userId: string;
  username: string;
  email: string;
  fullName?: string;
  bio?: string;
  profilePicUrl?: string;
  website?: string;
  role: 'GUEST' | 'USER' | 'ADMIN';
  provider: 'LOCAL' | 'GOOGLE';
  isActive: boolean;
  isVerified?: boolean;
  verificationPending?: boolean;
  verificationDeniedUntil?: string | null;
  createdAt: string;

  followersCount?: number;
  followingCount?: number;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  username?: string;
  fullName?: string;
  bio?: string;
  website?: string;
  profilePicUrl?: string;
}
