// Legacy DB 스키마 타입 정의 (DOMAIN_SCHEMA.md 준수)
export interface UserLegacyDto {
  U_ID: string;
  U_EMAIL: string;
  U_NAME: string;
  U_KIND: string; // 'DOC001' 등
  U_ALIVE: 'Y' | 'N';
  U_REG_DATE: Date;
}

export interface BoardLegacyDto {
  BOARD_IDX: number;
  CTG_CODE: string;
  U_ID: string;
  TITLE: string;
  CONTENT: string;
  READ_CNT: number;
  AGREE_CNT: number;
  REG_DATE: Date;
}

export interface CommentLegacyDto {
  COMMENT_IDX: number;
  BOARD_IDX: number;
  SVC_CODE: string;
  U_ID: string;
  CONTENT: string;
  PARENT_IDX?: number;
  REG_DATE: Date;
}

export interface UserLoginLegacyDto {
  LOGIN_IDX: number;
  U_ID: string;
  LOGIN_DATE: Date;
  IP_ADDRESS: string;
}