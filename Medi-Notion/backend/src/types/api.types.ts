// API 응답 타입
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  todayPosts: number;
  totalComments: number;
  todayComments: number;
}

export interface MemberListItem {
  uId: string;
  email: string;
  name: string;
  kind: string;
  status: 'active' | 'inactive';
  regDate: string;
  lastLogin?: string;
}

export interface BoardListItem {
  boardIdx: number;
  title: string;
  author: string;
  readCount: number;
  agreeCount: number;
  commentCount: number;
  regDate: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}