/**
 * 활성 회원 프로파일 분석 타입 정의
 * DOMAIN_SCHEMA.md 레거시 컬럼명 준수
 */

// 레거시 사용자 데이터 구조 (DOMAIN_SCHEMA.md 준수)
export interface UserLegacyDto {
  U_ID: string;
  U_EMAIL: string;
  U_NAME: string;
  U_KIND: string; // 'DOC001' 등 6자리 코드
  U_ALIVE: 'Y' | 'N'; // CHAR(6) 타입
  U_REG_DATE: Date;
}

export interface UserDetailLegacyDto {
  U_ID: string;
  U_MAJOR_CODE_1: string; // 전문과목 1 (CODE_MASTER 참조)
  U_MAJOR_CODE_2: string | null; // 전문과목 2
  U_WORK_TYPE_1: string; // 근무형태 (개원/봉직/전공의 등)
  U_OFFICE_ZIP: string | null;
  U_OFFICE_ADDR: string | null;
  U_HOSPITAL_NAME: string | null;
  U_CAREER_YEAR: number | null;
}

export interface CodeMasterDto {
  CODE_TYPE: string;
  CODE_VALUE: string;
  CODE_NAME: string;
  CODE_ORDER: number;
  USE_FLAG: 'Y' | 'N';
}

// 분석 결과 구조체
export interface SegmentDistribution {
  segmentName: string;
  activeCount: number;
  activePercentage: number;
  totalCount: number;
  totalPercentage: number;
  difference: number; // 활성 - 전체 (percentage point)
  pValue: number | null; // 통계적 유의성
  isSignificant: boolean;
  sampleSize: number;
}

export interface MajorAnalysisResult {
  majorCode: string;
  majorName: string;
  distribution: SegmentDistribution;
}

export interface WorkTypeAnalysisResult {
  workTypeCode: string;
  workTypeName: string;
  distribution: SegmentDistribution;
}

export interface StatisticalTest {
  testType: 'chi-square' | 't-test';
  statistic: number;
  pValue: number;
  degreesOfFreedom: number;
  effectSize: number; // Cramer's V or Cohen's d
  isSignificant: boolean;
}

export interface ProfileAnalysisResult {
  metadata: {
    analysisDate: Date;
    activeSegmentSize: number; // 16,037명
    totalDoctorSize: number; // 128,320명
    completionRate: number; // 분석 완료율
    validSampleSize: number;
  };
  majorAnalysis: {
    results: MajorAnalysisResult[];
    statisticalTest: StatisticalTest;
    topOverRepresented: MajorAnalysisResult[]; // +5%p 이상
    topUnderRepresented: MajorAnalysisResult[]; // -5%p 이하
  };
  workTypeAnalysis: {
    results: WorkTypeAnalysisResult[];
    statisticalTest: StatisticalTest;
    topOverRepresented: WorkTypeAnalysisResult[];
    topUnderRepresented: WorkTypeAnalysisResult[];
  };
  insights: {
    keyFindings: string[];
    businessImpact: string[];
    recommendations: string[];
  };
}

// Use Case Trigger 제안 구조체
export interface UseCaseTrigger {
  id: string;
  name: string;
  targetSegment: {
    criteria: string[];
    estimatedSize: number;
    overRepresentationRate: number; // +X%p
  };
  triggerCondition: {
    events: string[];
    frequency: 'immediate' | 'daily' | 'weekly';
    priority: 'high' | 'medium' | 'low';
  };
  expectedOutcome: {
    description: string;
    estimatedROI: number; // % improvement expected
    measurementMethod: string[];
  };
  implementation: {
    complexity: 'low' | 'medium' | 'high';
    estimatedEffort: string; // person-days
    dependencies: string[];
  };
}

export interface G1TriggerProposal {
  proposals: UseCaseTrigger[];
  priorityRanking: string[]; // trigger IDs in priority order
  riskAssessment: {
    triggerId: string;
    risks: string[];
    mitigation: string[];
  }[];
}

// 쿼리 실행 결과 타입
export interface QueryExecutionResult<T> {
  success: boolean;
  data: T[];
  executionTime: number; // milliseconds
  rowCount: number;
  error?: string;
}

// 분석 컨텍스트 (입력)
export interface AnalysisContext {
  heavySegmentUserIds: string[]; // 16,037명 U_ID 목록
  analysisDate: Date;
  constraints: {
    maxQueryTime: number; // 5분 = 300,000ms
    maxMemoryUsage: number; // 2GB in bytes
    minSampleSize: number; // 3명 이상
  };
}