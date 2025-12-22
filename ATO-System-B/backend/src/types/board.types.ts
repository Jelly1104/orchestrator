// board.types.ts - 게시글 관련 타입 정의
// DOMAIN_SCHEMA.md의 레거시 스키마 준수

export interface BoardLegacyDto {
  BOARD_IDX: number;
  CTG_CODE: string;
  U_ID: string;
  TITLE: string;
  CONTENT: string;
  READ_CNT: number;
  AGREE_CNT: number;
  REG_DATE: Date;
  UPT_DATE?: Date;
  DEL_FLAG: 'Y' | 'N';
}

export interface UserLegacyDto {
  U_ID: string;
  U_NAME: string;
  U_ALIVE: 'Y' | 'N';
}

export interface BoardListQuery {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}

export interface BoardItem {
  BOARD_IDX: number;
  TITLE: string;
  U_NAME: string;
  READ_CNT: number;
  REG_DATE: string;
  CTG_CODE: string;
}

export interface BoardDetail extends BoardItem {
  CONTENT: string;
  AGREE_CNT: number;
  UPT_DATE?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
}

export interface BoardListResponse {
  success: boolean;
  data: {
    boards: BoardItem[];
    pagination: PaginationInfo;
  };
}

export interface BoardDetailResponse {
  success: boolean;
  data: BoardDetail;
}

// 상수 정의
export const BOARD_CONSTANTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MAX_SEARCH_LENGTH: 100,
} as const;