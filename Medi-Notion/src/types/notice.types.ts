// 공지사항 시스템 타입 정의 (DOMAIN_SCHEMA.md 준수)

export interface NoticeLegacyDto {
  BOARD_IDX: number;
  CTG_CODE: string;
  TARGET_MAJOR: string; // JSON 문자열: ["IM","GS"]
  TARGET_WORK: string;  // JSON 문자열: ["OWN","EMP"] 
  TITLE: string;
  CONTENT: string;
  IMPORTANCE: number;   // 1-5
  U_ID: string;
  REG_DATE: string;
  DISPLAY_FLAG: 'Y' | 'N';
  DEL_FLAG: 'Y' | 'N';
}

export interface UserProfileDto {
  U_ID: string;
  U_MAJOR_CODE_1: string; // 전문과목 코드
  U_WORK_TYPE_1: string;  // 근무형태 코드
  U_CAREER_YEAR: number;
}

export interface NoticeWithScore {
  BOARD_IDX: number;
  TITLE: string;
  CONTENT: string;
  IMPORTANCE: number;
  REG_DATE: string;
  RELEVANCE_SCORE: number;      // 개인화 추천 점수 (0-1)
  MATCH_REASONS: string[];      // 매칭된 이유들
}

export interface NoticeListRequest {
  page?: number;
  limit?: number;
  category?: string;
  userId: string; // 개인화를 위한 사용자 ID
}

export interface NoticeListResponse {
  success: boolean;
  data: {
    notices: NoticeWithScore[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  error?: string;
}

export interface RelevanceCalculatorInput {
  notice: NoticeLegacyDto;
  userProfile: UserProfileDto;
}