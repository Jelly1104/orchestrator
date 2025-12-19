export interface UserPreferences {
  U_ID: string;
  majorCodes: string[]; // MAJOR 코드 (IM, GS 등)
  workTypes: string[]; // WORK_TYPE 코드 (OWN, EMP 등)  
  preferredRegions: string[]; // 지역 코드
  salaryMin: number;
  salaryMax: number;
  updatedAt: Date;
}

export interface JobRecommendation {
  jobId: string; // CBIZ_RECJOB.REC_IDX
  title: string;
  hospital: string;
  location: string;
  salary: number;
  matchScore: number; // 0-100
  matchReasons: string[];
  deadline: string;
  requirements: {
    majorCode: string;
    experienceYears: number;
    workType: string;
  };
}

export interface RecommendationResponse {
  recommendations: JobRecommendation[];
  totalCount: number;
  lastUpdated: string;
  userId: string;
}

export interface MatchingCriteria {
  majorWeight: number; // 40%
  experienceWeight: number; // 25%
  locationWeight: number; // 20%
  salaryWeight: number; // 15%
}

// Legacy DB 매핑용 DTO (컬럼명 변경 금지)
export interface JobPostLegacyDto {
  REC_IDX: number;
  TITLE: string;
  COMPANY_NAME: string;
  SALARY_MIN: number;
  SALARY_MAX: number;
  MAJOR_CODE: string;
  WORK_TYPE_CODE: string;
  LOCATION_CODE: string;
  EXPERIENCE_MIN: number;
  END_DATE: string;
  APPROVAL_FLAG: 'Y' | 'N';
  DISPLAY_FLAG: 'Y' | 'N';
  DEL_FLAG: 'Y' | 'N';
  REG_DATE: string;
}

export interface UserProfileLegacyDto {
  U_ID: string;
  U_NAME: string;
  U_KIND: string;
  U_MAJOR_CODE_1: string;
  U_MAJOR_CODE_2: string;
  U_WORK_TYPE_1: string;
  U_OFFICE_ZIP: string;
  U_CAREER_YEAR: number;
}