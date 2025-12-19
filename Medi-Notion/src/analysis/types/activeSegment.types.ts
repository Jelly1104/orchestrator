/**
 * 활성 회원 패턴 분석을 위한 타입 정의
 * DOMAIN_SCHEMA.md의 레거시 컬럼명을 정확히 반영
 */

// 레거시 USERS 테이블 구조 (DOMAIN_SCHEMA 준수)
export interface UsersLegacyDto {
  U_ID: string;           // VARCHAR(14) PRIMARY KEY
  U_EMAIL: string;        // VARCHAR(120) UNIQUE
  U_NAME: string;         // VARCHAR(256)
  U_KIND: string;         // CHAR(6) - 'DOC001' 등
  U_ALIVE: string;        // CHAR(6) - 'Y'/'N' 등
  U_REG_DATE: Date;       // DATETIME
}

// 레거시 USER_DETAIL 테이블 구조
export interface UserDetailLegacyDto {
  U_ID: string;           // VARCHAR(14) FK
  U_MAJOR_CODE_1: string; // CHAR(6) - 전문과목 1
  U_MAJOR_CODE_2: string; // CHAR(6) - 전문과목 2
  U_WORK_TYPE_1: string;  // CHAR(6) - 근무형태
  U_OFFICE_ZIP: string;   // VARCHAR(10) - 근무지 우편번호
  U_OFFICE_ADDR: string;  // VARCHAR(200) - 근무지 주소
  U_HOSPITAL_NAME: string; // VARCHAR(100) - 병원/의원명
  U_CAREER_YEAR: number;  // INT - 경력 연수
}

// 레거시 CODE_MASTER 테이블 구조
export interface CodeMasterLegacyDto {
  CODE_TYPE: string;      // VARCHAR(20) - 'MAJOR', 'WORK_TYPE' 등
  CODE_VALUE: string;     // CHAR(6) - 코드값
  CODE_NAME: string;      // VARCHAR(100) - 코드명
  CODE_ORDER: number;     // INT - 정렬 순서
  USE_FLAG: string;       // CHAR(1) - 'Y'/'N'
}

// 활성 회원 세그먼트 정의
export interface ActiveMemberSegment {
  U_ID: string;
  U_NAME: string;
  U_MAJOR_CODE_1: string;
  U_WORK_TYPE_1: string;
  U_CAREER_YEAR: number;
  ACTIVITY_SCORE: number;
}

// 분포 분석 결과 타입
export interface DistributionAnalysisResult {
  segment: string;        // 세그먼트명 (예: 'IM' - 내과)
  segmentName: string;    // 세그먼트 표시명 (예: '내과')
  activeCount: number;    // 활성 회원 수
  totalCount: number;     // 전체 회원 수
  activeRate: number;     // 활성 비율 (%)
  totalRate: number;      // 전체 대비 비율 (%)
  difference: number;     // 차이 (percentage point)
  isSignificant: boolean; // 유의성 (5%p 이상)
}

// G1 Use Case Trigger 후보
export interface G1UseCaseTriggerCandidate {
  id: string;
  title: string;
  targetSegment: string;
  description: string;
  expectedImpact: string;
  feasibilityScore: number; // 1-10점
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

// 분석 리포트 종합 타입
export interface ActiveMemberProfileReport {
  totalActiveMembers: number;
  topSegmentsByMajor: DistributionAnalysisResult[];
  topSegmentsByWorkType: DistributionAnalysisResult[];
  keyInsights: string[];
  g1TriggerCandidates: G1UseCaseTriggerCandidate[];
  generatedAt: Date;
}

// SQL 쿼리 결과 타입 (Raw DB Output)
export interface ActiveSegmentQueryResult {
  U_ID: string;
  U_NAME: string;
  U_MAJOR_CODE_1: string | null;
  U_WORK_TYPE_1: string | null;
  U_CAREER_YEAR: number | null;
  MAJOR_NAME: string | null;
  WORK_TYPE_NAME: string | null;
}

// 분석 설정 타입
export interface AnalysisConfig {
  targetActiveMembers: number; // 16,037명 고정
  significanceThreshold: number; // 5%p 기본값
  confidenceLevel: number; // 95% 기본값
  excludeNullProfiles: boolean; // false - NULL도 별도 분석
}

// 분석 진행 상태
export interface AnalysisProgress {
  step: 'INIT' | 'SEGMENT_EXTRACTION' | 'PROFILE_JOIN' | 'DISTRIBUTION_ANALYSIS' | 'REPORT_GENERATION' | 'COMPLETED';
  progress: number; // 0-100
  message: string;
  errors?: string[];
}

export const ANALYSIS_CONSTANTS = {
  TARGET_ACTIVE_MEMBERS: 16037,
  DOCTOR_KIND_CODE: 'DOC001',
  ACTIVE_FLAG: 'Y',
  USE_FLAG: 'Y',
  SIGNIFICANCE_THRESHOLD: 5.0, // 5 percentage points
  CONFIDENCE_LEVEL: 0.95
} as const;