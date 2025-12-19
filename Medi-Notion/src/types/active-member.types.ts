/**
 * 활성 회원 분석을 위한 타입 정의
 * DOMAIN_SCHEMA.md의 레거시 컬럼명을 준수합니다.
 */

// 레거시 DB 컬럼 매핑
export interface UserLegacyDto {
  U_ID: string;
  U_EMAIL: string;
  U_NAME: string;
  U_KIND: 'DOC001' | 'PHA001' | 'NUR001'; // 의사/약사/간호사
  U_ALIVE: 'Y' | 'N';
  U_REG_DATE: Date;
}

export interface UserDetailLegacyDto {
  U_ID: string;
  U_MAJOR_CODE_1: string; // 주전공
  U_MAJOR_CODE_2?: string; // 복수전공
  U_WORK_TYPE_1: string; // 근무형태
  U_OFFICE_ZIP?: string;
  U_OFFICE_ADDR?: string;
  U_HOSPITAL_NAME?: string;
  U_CAREER_YEAR?: number;
}

export interface CodeMasterDto {
  CODE_TYPE: string;
  CODE_VALUE: string;
  CODE_NAME: string;
  CODE_ORDER: number;
  USE_FLAG: 'Y' | 'N';
}

// 분석 결과 타입
export interface MemberSegment {
  major: string;
  majorName: string;
  count: number;
  percentage: number;
}

export interface WorkTypeSegment {
  workType: string;
  workTypeName: string;
  count: number;
  percentage: number;
}

export interface DistributionComparison {
  category: string;
  categoryName: string;
  activeCount: number;
  activePercentage: number;
  totalCount: number;
  totalPercentage: number;
  variance: number; // (active% - total%) / total% * 100
  representation: 'OVER_REP' | 'UNDER_REP' | 'NORMAL';
}

export interface ActiveMemberReport {
  metadata: {
    reportDate: Date;
    totalActiveMembers: number;
    totalMembers: number;
    activeRate: number;
    analysisWindow: string; // "30 days"
  };
  segments: {
    majorDistribution: MemberSegment[];
    workTypeDistribution: WorkTypeSegment[];
  };
  comparisons: {
    majorComparison: DistributionComparison[];
    workTypeComparison: DistributionComparison[];
  };
  insights: {
    topActiveMajors: string[];
    underRepresentedMajors: string[];
    riskSegments: string[];
  };
}

export interface G1UseCaseTrigger {
  triggerType: 'JOB_SEEKING' | 'CAREER_CHANGE' | 'LOCATION_MOVE';
  targetSegment: {
    majors: string[];
    workTypes: string[];
    estimatedCount: number;
  };
  reasoning: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

// SQL 쿼리 결과 타입들
export interface ActiveMemberQueryResult {
  U_ID: string;
  U_KIND: string;
  U_MAJOR_CODE_1: string;
  U_WORK_TYPE_1: string;
  LAST_LOGIN_DATE: Date;
  LOGIN_COUNT_30D: number;
}

export interface MajorDistributionQueryResult {
  MAJOR_CODE: string;
  MAJOR_NAME: string;
  MEMBER_COUNT: number;
}

export interface WorkTypeDistributionQueryResult {
  WORK_TYPE_CODE: string;
  WORK_TYPE_NAME: string;
  MEMBER_COUNT: number;
}