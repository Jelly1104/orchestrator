// 채용추천 Agent 타입 정의
export interface UserProfile {
  U_ID: string;
  U_MAJOR_CODE_1?: string;
  U_WORK_TYPE_1?: string;
  U_OFFICE_ZIP?: string;
  U_NAME?: string;
}

export interface JobPosting {
  RECRUIT_IDX: number;
  TITLE: string;
  HOSPITAL_NAME?: string;
  MAJOR_CODE?: string;
  INVITE_TYPE?: string;
  WORK_AREA_CODE?: string;
  SALARY_MIN?: number;
  SALARY_MAX?: number;
  POST_DATE: Date;
  END_DATE: Date;
  APPROVAL_FLAG: 'Y' | 'N';
  DEL_FLAG: 'Y' | 'N';
}

export interface MatchReason {
  type: 'major_match' | 'work_type_match' | 'location_match' | 'new_post';
  description: string;
  score: number;
}

export interface RecommendedJob {
  recruit_idx: number;
  title: string;
  hospital_name?: string;
  match_score: number;
  match_reasons: MatchReason[];
  salary_min?: number;
  area_name?: string;
  post_date: Date;
}

export interface RecommendationResponse {
  recommendations: RecommendedJob[];
}

export interface RecommendationSettings {
  U_ID: string;
  PREFERRED_MAJOR_CODES: string[];
  PREFERRED_WORK_TYPES: string[];
  PREFERRED_AREAS: string[];
  SALARY_MIN: number;
  SALARY_MAX: number;
  NOTIFICATION_ENABLED: 'Y' | 'N';
  NOTIFICATION_TYPE: string;
}

export interface FeedbackRequest {
  recruit_idx: number;
  feedback_type: 'helpful' | 'not_helpful' | 'comment';
  comment?: string;
}

export interface RecommendationLog {
  LOG_IDX?: number;
  U_ID: string;
  RECRUIT_IDX: number;
  MATCH_SCORE?: number;
  RECOMMENDED_AT: Date;
  CLICKED_AT?: Date;
  APPLIED_AT?: Date;
  FEEDBACK?: string;
}