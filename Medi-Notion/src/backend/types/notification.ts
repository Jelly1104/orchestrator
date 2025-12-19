/**
 * 알림 타입 정의
 * @see docs/case2-notification/SDD.md
 */

// 알림 유형 (DOMAIN_SCHEMA 준수)
export type NotificationType = "NOTICE" | "EVENT" | "SYSTEM";

// 알림 목록 아이템
export interface NotificationListItem {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  regDate: string;
}

// 페이지네이션 정보
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

// 알림 목록 응답
export interface NotificationListResponse {
  success: true;
  data: {
    items: NotificationListItem[];
    unreadCount: number;
    pagination: PaginationInfo;
  };
}

// 알림 읽음 처리 응답
export interface NotificationReadResponse {
  success: true;
  data: {
    id: number;
    isRead: boolean;
  };
}

// 관리자 알림 발송 요청
export interface AdminSendNotificationRequest {
  target: "ALL" | "SPECIFIC";
  targetUserIds?: string[];
  type: NotificationType;
  title: string;
  message: string;
}

// 관리자 알림 발송 응답
export interface AdminSendNotificationResponse {
  success: true;
  data: {
    sentCount: number;
    message: string;
  };
}

// 에러 응답
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// Mock 데이터용 내부 타입 (DOMAIN_SCHEMA 컬럼명 준수)
export interface NotificationRecord {
  NOTI_IDX: number;
  U_ID: string;
  NOTI_TYPE: NotificationType;
  TITLE: string;
  MESSAGE: string;
  READ_FLAG: "Y" | "N";
  DEL_FLAG: "Y" | "N";
  REG_DATE: string;
  READ_DATE: string | null;
}
