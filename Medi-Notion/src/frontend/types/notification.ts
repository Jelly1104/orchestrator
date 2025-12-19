/**
 * 알림 프론트엔드 타입 정의
 * @see docs/case2-notification/SDD.md
 */

export type NotificationType = "NOTICE" | "EVENT" | "SYSTEM";

export interface NotificationListItem {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  regDate: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export interface NotificationListResponse {
  success: true;
  data: {
    items: NotificationListItem[];
    unreadCount: number;
    pagination: PaginationInfo;
  };
}

export interface NotificationReadResponse {
  success: true;
  data: {
    id: number;
    isRead: boolean;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}
