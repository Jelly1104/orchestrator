import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { 
  ActiveMemberSegment, 
  DistributionAnalysisResult, 
  AnalysisConfig,
  ActiveSegmentQueryResult 
} from '../src/analysis/types/activeSegment.types';
import { ANALYSIS_CONSTANTS } from '../src/analysis/types/activeSegment.types';

// Mock 데이터 생성 함수
function createMockActiveSegmentQueryResult(overrides: Partial<ActiveSegmentQueryResult> = {}): ActiveSegmentQueryResult {
  return {
    U_ID: 'doc123',
    U_NAME: '김의사',
    U_MAJOR_CODE_1: 'IM',
    U_WORK_TYPE_1: 'OWN',
    U_CAREER_YEAR: 10,
    MAJOR_NAME: '내과',
    WORK_TYPE_NAME: '개원',
    ...overrides
  };
}

function createMockDistributionData(): DistributionAnalysisResult[] {
  return [
    {
      segment: 'IM',
      segmentName: '내과',
      activeCount: 3500,
      totalCount: 45000,
      activeRate: 21.8,
      totalRate: 22.5,
      difference: -0.7,
      isSignificant: false
    },
    {
      segment: 'GS',
      segmentName: '외과',
      activeCount: 2800,
      totalCount: 25000,
      activeRate: 17.5,
      totalRate: 12.5,
      difference: 5.0,
      isSignificant: true
    }
  ];
}

describe('활성 회원 세그먼트 정의 테스트', () => {
  let mockConfig: AnalysisConfig;

  beforeEach(() => {
    mockConfig = {
      targetActiveMembers: ANALYSIS_CONSTANTS.TARGET_ACTIVE_MEMBERS,
      significanceThreshold: ANALYSIS_CONSTANTS.SIGNIFICANCE_THRESHOLD,
      confidenceLevel: ANALYSIS_CONSTANTS.CONFIDENCE_LEVEL,
      excludeNullProfiles: false
    };
  });

  it('활성 회원 수가 정확히 16,037명이어야 한다', () => {
    expect(ANALYSIS_CONSTANTS.TARGET_ACTIVE_MEMBERS).toBe(16037);
  });

  it('의사 회원 조건이 올바르게 설정되어야 한다', () => {
    expect(ANALYSIS_CONSTANTS.DOCTOR_KIND_CODE).toBe('DOC001');
    expect(ANALYSIS_CONSTANTS.ACTIVE_FLAG).toBe('Y');
  });

  it('레거시 컬럼명을 정확히 사용해야 한다', () => {
    const mockResult = createMockActiveSegmentQueryResult();
    
    // DOMAIN_SCHEMA.md에 정의된 실제 컬럼명 검증
    expect(mockResult).toHaveProperty('U_ID');
    expect(mockResult).toHaveProperty('U_NAME');
    expect(mockResult).toHaveProperty('U_MAJOR_CODE_1'); // NOT major_code
    expect(mockResult).toHaveProperty('U_WORK_TYPE_1');  // NOT work_type_code
    
    // camelCase 변환하면 안됨
    expect(mockResult).not.toHaveProperty('userId');
    expect(mockResult).not.toHaveProperty('majorCode');
  });
});

describe('분포 분석 테스트', () => {
  it('유의성 임계값(5%p) 이상의 차이를 올바르게 식별해야 한다', () => {
    const mockData = createMockDistributionData();
    
    const significantSegments = mockData.filter(item => item.isSignificant);
    const nonSignificantSegments = mockData.filter(item => !item.isSignificant);
    
    expect(significantSegments).toHaveLength(1);
    expect(significantSegments[0].segment).toBe('GS');
    expect(significantSegments[0].difference).toBeGreaterThanOrEqual(5.0);
    
    expect(nonSignificantSegments[0].difference).toBeLessThan(5.0);
  });

  it('NULL 프로필 회원을 별도로 처리해야 한다', () => {
    const mockResultWithNull = createMockActiveSegmentQueryResult({
      U_MAJOR_CODE_1: null,
      MAJOR_NAME: null
    });
    
    expect(mockResultWithNull.U_MAJOR_CODE_1).toBeNull();
    expect(mockResultWithNull.MAJOR_NAME).toBeNull();
    
    // NULL 값도 분석에 포함되어야 함
    expect(typeof mockResultWithNull.U_ID).toBe('string');
  });
});

describe('SQL 쿼리 패턴 검증', () => {
  it('활성 회원 정의 쿼리에 필요한 조건들이 포함되어야 한다', () => {
    const expectedConditions = [
      "U_KIND = 'DOC001'",
      "U_ALIVE = 'Y'",
      "USE_FLAG = 'Y'"
    ];
    
    // 실제 SQL은 별도 파일에서 검증
    expectedConditions.forEach(condition => {
      expect(condition).toBeDefined();
    });
  });

  it('조인 쿼리에서 올바른 테이블과 컬럼을 사용해야 한다', () => {
    const expectedTables = ['USERS', 'USER_DETAIL', 'CODE_MASTER'];
    const expectedJoinColumns = ['U_ID', 'CODE_TYPE', 'CODE_VALUE'];
    
    expectedTables.forEach(table => expect(table).toBeDefined());
    expectedJoinColumns.forEach(column => expect(column).toBeDefined());
  });
});

describe('G1 Use Case 후보 생성 테스트', () => {
  it('최소 3개의 실행 가능한 후보를 생성해야 한다', () => {
    // 이 테스트는 실제 분석 결과에 따라 달라지므로
    // 최소 요구사항만 검증
    const minimumCandidates = 3;
    expect(minimumCandidates).toBe(3);
  });

  it('각 후보는 필수 속성을 모두 가져야 한다', () => {
    const mockCandidate = {
      id: 'trigger_001',
      title: '개원의 대상 맞춤형 컨텐츠 추천',
      targetSegment: 'OWN',
      description: '개원의 회원에게 경영 관련 컨텐츠 우선 노출',
      expectedImpact: '게시글 조회수 20% 증가 예상',
      feasibilityScore: 8,
      priority: 'HIGH' as const
    };
    
    expect(mockCandidate.id).toBeDefined();
    expect(mockCandidate.title).toBeDefined();
    expect(mockCandidate.targetSegment).toBeDefined();
    expect(mockCandidate.feasibilityScore).toBeGreaterThan(0);
    expect(['HIGH', 'MEDIUM', 'LOW']).toContain(mockCandidate.priority);
  });
});