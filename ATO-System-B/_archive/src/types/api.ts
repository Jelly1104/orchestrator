// API 관련 타입 정의
export interface ApiResponse {
  message: string;
  timestamp: string;
  version: string;
}

export interface ApiError {
  message: string;
  status: number;
}