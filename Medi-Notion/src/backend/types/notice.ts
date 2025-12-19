/**
 * 공지사항 타입 정의
 * @see docs/case1-notice-list/SDD.md
 */

export type NoticeType = 'IMPORTANT' | 'NORMAL';

export interface NoticeListItem {
  id: number;
  title: string;
  noticeType: NoticeType;
  readCount: number;
  regDate: string;
}

export interface NoticeDetail {
  id: number;
  title: string;
  content: string;
  noticeType: NoticeType;
  readCount: number;
  regDate: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface NoticeListResponse {
  success: boolean;
  data: {
    items: NoticeListItem[];
    pagination: PaginationInfo;
  };
}

export interface NoticeDetailResponse {
  success: boolean;
  data: NoticeDetail;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}
