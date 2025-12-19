/**
 * 활성 회원 프로파일 분석 테스트
 * TDD Red-Green-Refactor 사이클 적용
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  ProfileAnalysisService, 
  SqlQueryBuilder,
  StatisticalAnalyzer 
} from '../analysis/services/ProfileAnalysisService';
import { 
  AnalysisContext, 
  ProfileAnalysisResult,
  MajorAnalysisResult,
  WorkTypeAnalysisResult,
  QueryExecutionResult,
  UserLegacyDto,
  UserDetailLegacyDto
} from '../analysis/types/ProfileAnalysis';

describe('ProfileAnalysisService', () => {
  let analysisService: ProfileAnalysisService;
  let mockContext: AnalysisContext;

  beforeEach(() => {
    analysisService = new ProfileAnalysisService();
    mockContext = {
      heavySegmentUserIds: ['DOC_001', 'DOC_002', 'DOC_003'], // 테스트용 3명
      analysisDate: new Date('2025-12-17'),
      constraints: {
        maxQueryTime: 300000, // 5분
        maxMemoryUsage: 2 * 1024 * 1024 * 1024, // 2GB
        minSampleSize: 3
      }
    };
  });

  describe('Red Phase - 실패하는 테스트', () => {
    it('활성 회원 세그먼트 정의 쿼리가 올바른 컬럼명을 사용해야 한다', async () => {
      // Arrange - DOMAIN_SCHEMA.md 준수 확인
      const expectedColumns = ['U_ID', 'U_KIND', 'U_ALIVE', 'U_REG_DATE'];
      
      // Act
      const query = analysisService.buildActiveSegmentQuery(mockContext.heavySegmentUserIds);
      
      // Assert - 실제 레거시 컬럼명 사용 확인
      expect(query).toContain('U_KIND = \'DOC001\''); // NOT userId
      expect(query).toContain('U_ALIVE = \'Y\''); // CHAR(6) 타입
      expectedColumns.forEach(col => {
        expect(query).toContain(col);
      });
    });

    it('프로필 조인 쿼리가 USER_DETAIL과 CODE_MASTER를 올바르게 조인해야 한다', () => {
      // Act
      const query = analysisService.buildProfileJoinQuery();
      
      // Assert - DOMAIN_SCHEMA.md의 실제 테이블/컬럼명
      expect(query).toContain('USERS u');
      expect(query).toContain('USER_DETAIL ud ON u.U_ID = ud.U_ID');
      expect(query).toContain('CODE_MASTER cm1 ON ud.U_MAJOR_CODE_1 = cm1.CODE_VALUE');
      expect(query).toContain('CODE_MASTER cm2 ON ud.U_WORK_TYPE_1 = cm2.CODE_VALUE');
      expect(query).toContain('cm1.CODE_TYPE = \'MAJOR\'');
      expect(query).toContain('cm2.CODE_TYPE = \'WORK_TYPE\'');
    });

    it('전문과목별 분포 분석이 +5%p 이상 차이 세그먼트를 식별해야 한다', async () => {
      // Arrange - Mock 데이터 (내과가 과대 대표)
      const mockActiveData = [
        { majorCode: 'IM', majorName: '내과', count: 500 }, // 50%
        { majorCode: 'GS', majorName: '외과', count: 300 }  // 30%
      ];
      const mockTotalData = [
        { majorCode: 'IM', majorName: '내과', count: 4000 }, // 40%
        { majorCode: 'GS', majorName: '외과', count: 3500 }  // 35%
      ];

      // Act
      const result = await analysisService.analyzeMajorDistribution(
        mockActiveData, 
        mockTotalData, 
        1000, 10000
      );

      // Assert - 내과가 +10%p 차이로 감지되어야 함
      expect(result.results).toHaveLength(2);
      const imResult = result.results.find(r => r.majorCode === 'IM');
      expect(imResult?.distribution.difference).toBeGreaterThan(5); // +10%p
      expect(result.topOverRepresented).toContain(imResult);
    });

    it('통계적 유의성 검정이 올바른 p-value를 계산해야 한다', () => {
      // Arrange - 카이제곱 검정용 데이터
      const observed = [500, 300, 200]; // 활성 회원 분포
      const expected = [400, 350, 250]; // 전체 회원 기반 예상 분포

      // Act
      const result = StatisticalAnalyzer.chiSquareTest(observed, expected);

      // Assert
      expect(result.testType).toBe('chi-square');
      expect(result.pValue).toBeTypeOf('number');
      expect(result.statistic).toBeGreaterThan(0);
      expect(result.degreesOfFreedom).toBe(2); // k-1
      expect(result.isSignificant).toBe(result.pValue < 0.05);
    });

    it('개인정보 보호를 위해 3명 미만 세그먼트를 제외해야 한다', async () => {
      // Arrange - 소규모 세그먼트 포함 데이터
      const mockData = [
        { majorCode: 'IM', count: 500 },
        { majorCode: 'RARE', count: 2 }, // 3명 미만
        { majorCode: 'GS', count: 300 }
      ];

      // Act
      const result = await analysisService.filterMinimumSampleSize(mockData, 3);

      // Assert - RARE 세그먼트 제외
      expect(result).toHaveLength(2);
      expect(result.find(r => r.majorCode === 'RARE')).toBeUndefined();
    });
  });
});

describe('SqlQueryBuilder', () => {
  let queryBuilder: SqlQueryBuilder;

  beforeEach(() => {
    queryBuilder = new SqlQueryBuilder();
  });

  it('활성 회원 세그먼트 쿼리가 인덱스를 활용해야 한다', () => {
    // Arrange
    const userIds = ['U001', 'U002'];

    // Act
    const query = queryBuilder.buildActiveSegmentQuery(userIds);

    // Assert - 인덱스 활용 확인
    expect(query).toContain('WHERE u.U_ID IN ('); // PRIMARY KEY 활용
    expect(query).toContain('AND u.U_KIND = \'DOC001\''); // 인덱스 컬럼
    expect(query).toContain('AND u.U_ALIVE = \'Y\'');
  });

  it('대용량 테이블 조회를 방지해야 한다', () => {
    // Act & Assert - 금지된 테이블 접근 시 에러
    expect(() => {
      queryBuilder.buildQuery('SELECT * FROM USER_LOGIN'); // 2,267만 행
    }).toThrow('대용량 테이블 USER_LOGIN 직접 조회 금지');

    expect(() => {
      queryBuilder.buildQuery('SELECT * FROM COMMENT'); // 1,826만 행
    }).toThrow('대용량 테이블 COMMENT 직접 조회 금지');
  });
});

describe('Use Case Trigger 제안', () => {
  let analysisService: ProfileAnalysisService;

  beforeEach(() => {
    analysisService = new ProfileAnalysisService();
  });

  it('G1 목표와 연결된 실행 가능한 트리거를 제안해야 한다', () => {
    // Arrange - 과대 대표 세그먼트 (내과 +10%p)
    const mockAnalysisResult = {
      majorAnalysis: {
        topOverRepresented: [{
          majorCode: 'IM',
          majorName: '내과',
          distribution: { difference: 10, activeCount: 500, totalCount: 4000 }
        }]
      }
    } as ProfileAnalysisResult;

    // Act
    const triggers = analysisService.generateUseCaseTriggers(mockAnalysisResult);

    // Assert
    expect(triggers.proposals).toHaveLength.greaterThan(0);
    const firstTrigger = triggers.proposals[0];
    expect(firstTrigger.targetSegment.overRepresentationRate).toBeGreaterThan(5);
    expect(firstTrigger.expectedOutcome.estimatedROI).toBeGreaterThan(0);
    expect(firstTrigger.implementation.complexity).toBeDefined();
  });
});