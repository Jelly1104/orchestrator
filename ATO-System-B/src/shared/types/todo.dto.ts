// 공통 타입 정의 - Frontend와 Backend 공유
export interface TodoCreateRequest {
  content: string;
}

export interface TodoResponse {
  todo_id: number;
  content: string;
  reg_date: string;
  u_id?: string; // 선택적 (보안상 클라이언트에 노출하지 않을 수 있음)
}

export interface TodoDeleteResponse {
  message: string;
}

export interface ApiErrorResponse {
  error: string;
  message?: string;
}

// Legacy DB 매핑용 (Backend 전용)
export interface TodoLegacyDto {
  TODO_ID: number;
  U_ID: string;
  CONTENT: string;
  REG_DATE: Date;
  DEL_FLAG: 'Y' | 'N';
}