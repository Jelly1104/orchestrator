// 회원 분석을 위한 타입 정의 (DOMAIN_SCHEMA.md 엄격 준수)

// USERS 테이블의 실제 컬럼만 사용
export interface UserLegacyDto {
  U_ID: string;
  U_EMAIL: string;
  U_NAME: string;
  U_KIND: string;
  U_ALIVE: 'Y' | 'N';
  U_REG_DATE: Date;
}

// 기본 회원 유형별 분포 분석
export interface MemberTypeDistribution {
  memberType: string;
  memberTypeName: string;
  totalCount: number;
  percentage: number;
}

// 가입 시기 트렌드 분석
export interface RegistrationTrend {
  month: string;
  newMembers: number;
}

// 단순화된 분석 결과
export interface BasicAnalysisResult {
  totalMembers: number;
  activeMembersByType: MemberTypeDistribution[];
  registrationTrend: RegistrationTrend[];
  basicInsights: string[];
  simpleRecommendations: string[];
}

// 기본 Use Case Trigger (실현 가능한 범위)
export interface BasicTrigger {
  triggerName: string;
  targetSegment: string;
  condition: string;
  expectedAction: string;
  estimatedReach: number;
}