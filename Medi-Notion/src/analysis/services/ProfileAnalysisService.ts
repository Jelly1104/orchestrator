/**
 * 활성 회원 프로파일 분석 서비스 - 실제 구현
 * DOMAIN_SCHEMA.md 레거시 스키마 준수
 */

import { 
  AnalysisContext, 
  ProfileAnalysisResult,
  MajorAnalysisResult,
  WorkTypeAnalysisResult,
  QueryExecutionResult,
  StatisticalTest,
  G1TriggerProposal,
  UseCaseTrigger,
  SegmentDistribution
} from '../types/ProfileAnalysis';

export class ProfileAnalysisService {
  private dbConnection: any; // Database connection (mysql2)

  constructor(dbConnection: any) {
    this.dbConnection = dbConnection;
  }

  /**
   * 메인 분석 실행 메서드
   */
  async executeFullAnalysis(context: AnalysisContext): Promise<ProfileAnalysisResult> {
    const startTime = Date.now();

    // 1. 활성 세그먼트 프로필 데이터 조회
    const activeProfileData = await this.fetchActiveSegmentProfiles(context.heavySegmentUserIds);
    
    // 2. 전체 의사 회원 기준선 데이터 조회
    const totalProfileData = await this.fetchTotalDoctorProfiles();

    // 3. 전문과목별 분포 분석
    const majorAnalysis = await this.analyzeMajorDistribution(
      activeProfileData,
      totalProfileData,
      context.heavySegmentUserIds.length,
      128320 // 전체 의사 수
    );

    // 4. 근무형태별 분포 분석
    const workTypeAnalysis = await this.analyzeWorkTypeDistribution(
      activeProfileData,
      totalProfileData,
      context.heavySegmentUserIds.length,
      128320
    );

    // 5. 비즈니스 인사이트 생성
    const insights = this.generateBusinessInsights(majorAnalysis, workTypeAnalysis);

    const executionTime = Date.now() - startTime;

    return {
      metadata: {
        analysisDate: context.analysisDate,
        activeSegmentSize: context.heavySegmentUserIds.length,
        totalDoctorSize: 128320,
        completionRate: this.calculateCompletionRate(activeProfileData),
        validSampleSize: activeProfileData.filter(d => d.U_MAJOR_CODE_1).length
      },
      majorAnalysis,
      workTypeAnalysis,
      insights
    };
  }

  /**
   * 활성 세그먼트 프로필 데이터 조회 (실제 SQL 실행)
   */
  private async fetchActiveSegmentProfiles(userIds: string[]): Promise<any[]> {
    const query = this.buildProfileJoinQuery();
    const placeholders = userIds.map(() => '?').join(',');
    const finalQuery = query.replace('/* HEAVY 세그먼트 U_ID 목록 */', placeholders);

    try {
      const [rows] = await this.dbConnection.execute(finalQuery, userIds);
      return rows;
    } catch (error) {
      throw new Error(`활성 세그먼트 프로필 조회 실패: ${error.message}`);
    }
  }

  /**
   * 전체 의사 회원 기준선 데이터 조회
   */
  private async fetchTotalDoctorProfiles(): Promise<any[]> {
    const query = `
      SELECT 
        u.U_ID,
        ud.U_MAJOR_CODE_1,
        cm1.CODE_NAME AS MAJOR_NAME_1,
        ud.U_WORK_TYPE_1,
        cm2.CODE_NAME AS WORK_TYPE_NAME,
        ud.U_CAREER_YEAR
      FROM USERS u
        INNER JOIN USER_DETAIL ud ON u.U_ID = ud.U_ID
        LEFT JOIN CODE_MASTER cm1 ON ud.U_MAJOR_CODE_1 = cm1.CODE_VALUE 
          AND cm1.CODE_TYPE = 'MAJOR' 
          AND cm1.USE_FLAG = 'Y'
        LEFT JOIN CODE_MASTER cm2 ON ud.U_WORK_TYPE_1 = cm2.CODE_VALUE 
          AND cm2.CODE_TYPE = 'WORK_TYPE' 
          AND cm2.USE_FLAG = 'Y'
      WHERE u.U_KIND = 'DOC001' 
        AND u.U_ALIVE = 'Y'
    `;

    try {
      const [rows] = await this.dbConnection.execute(query);
      return rows;
    } catch (error) {
      throw new Error(`전체 의사 프로필 조회 실패: ${error.message}`);
    }
  }

  /**
   * 전문과목별 분포 분석 (실제 통계 계산)
   */
  async analyzeMajorDistribution(
    activeData: any[], 
    totalData: any[], 
    activeTotal: number, 
    totalCount: number
  ): Promise<{ results: MajorAnalysisResult[]; statisticalTest: StatisticalTest; topOverRepresented: MajorAnalysisResult[]; topUnderRepresented: MajorAnalysisResult[]; }> {
    
    // 활성 그룹 전문과목별 집계
    const activeMajorCounts = this.aggregateByField(activeData, 'U_MAJOR_CODE_1', 'MAJOR_NAME_1');
    const totalMajorCounts = this.aggregateByField(totalData, 'U_MAJOR_CODE_1', 'MAJOR_NAME_1');

    const results: MajorAnalysisResult[] = [];
    const observedCounts: number[] = [];
    const expectedCounts: number[] = [];

    // 각 전문과목별 분포 계산
    for (const [majorCode, totalInfo] of Object.entries(totalMajorCounts)) {
      const activeInfo = activeMajorCounts[majorCode] || { count: 0, name: totalInfo.name };
      
      // 3명 미만 세그먼트 제외 (개인정보 보호)
      if (activeInfo.count < 3) continue;

      const activePercentage = (activeInfo.count / activeTotal) * 100;
      const totalPercentage = (totalInfo.count / totalCount) * 100;
      const difference = activePercentage - totalPercentage;

      const distribution: SegmentDistribution = {
        segmentName: totalInfo.name,
        activeCount: activeInfo.count,
        activePercentage,
        totalCount: totalInfo.count,
        totalPercentage,
        difference,
        pValue: null, // 전체 카이제곱 검정에서 계산
        isSignificant: Math.abs(difference) > 5, // 5%p 이상 차이
        sampleSize: activeInfo.count
      };

      results.push({
        majorCode,
        majorName: totalInfo.name,
        distribution
      });

      observedCounts.push(activeInfo.count);
      expectedCounts.push((totalInfo.count / totalCount) * activeTotal);
    }

    // 전체 카이제곱 검정 실행
    const statisticalTest = StatisticalAnalyzer.chiSquareTest(observedCounts, expectedCounts);

    // 과대/과소 대표 세그먼트 식별
    const topOverRepresented = results
      .filter(r => r.distribution.difference > 5)
      .sort((a, b) => b.distribution.difference - a.distribution.difference)
      .slice(0, 5);

    const topUnderRepresented = results
      .filter(r => r.distribution.difference < -5)
      .sort((a, b) => a.distribution.difference - b.distribution.difference)
      .slice(0, 5);

    return {
      results: results.sort((a, b) => Math.abs(b.distribution.difference) - Math.abs(a.distribution.difference)),
      statisticalTest,
      topOverRepresented,
      topUnderRepresented
    };
  }

  /**
   * 근무형태별 분포 분석
   */
  async analyzeWorkTypeDistribution(
    activeData: any[], 
    totalData: any[], 
    activeTotal: number, 
    totalCount: number
  ): Promise<{ results: WorkTypeAnalysisResult[]; statisticalTest: StatisticalTest; topOverRepresented: WorkTypeAnalysisResult[]; topUnderRepresented: WorkTypeAnalysisResult[]; }> {
    
    const activeWorkTypeCounts = this.aggregateByField(activeData, 'U_WORK_TYPE_1', 'WORK_TYPE_NAME');
    const totalWorkTypeCounts = this.aggregateByField(totalData, 'U_WORK_TYPE_1', 'WORK_TYPE_NAME');

    const results: WorkTypeAnalysisResult[] = [];
    const observedCounts: number[] = [];
    const expectedCounts: number[] = [];

    for (const [workTypeCode, totalInfo] of Object.entries(totalWorkTypeCounts)) {
      const activeInfo = activeWorkTypeCounts[workTypeCode] || { count: 0, name: totalInfo.name };
      
      if (activeInfo.count < 3) continue;

      const activePercentage = (activeInfo.count / activeTotal) * 100;
      const totalPercentage = (totalInfo.count / totalCount) * 100;
      const difference = activePercentage - totalPercentage;

      const distribution: SegmentDistribution = {
        segmentName: totalInfo.name,
        activeCount: activeInfo.count,
        activePercentage,
        totalCount: totalInfo.count,
        totalPercentage,
        difference,
        pValue: null,
        isSignificant: Math.abs(difference) > 5,
        sampleSize: activeInfo.count
      };

      results.push({
        workTypeCode,
        workTypeName: totalInfo.name,
        distribution
      });

      observedCounts.push(activeInfo.count);
      expectedCounts.push((totalInfo.count / totalCount) * activeTotal);
    }

    const statisticalTest = StatisticalAnalyzer.chiSquareTest(observedCounts, expectedCounts);

    const topOverRepresented = results
      .filter(r => r.distribution.difference > 5)
      .sort((a, b) => b.distribution.difference - a.distribution.difference)
      .slice(0, 3);

    const topUnderRepresented = results
      .filter(r => r.distribution.difference < -5)
      .sort((a, b) => a.distribution.difference - b.distribution.difference)
      .slice(0, 3);

    return {
      results: results.sort((a, b) => Math.abs(b.distribution.difference) - Math.abs(a.distribution.difference)),
      statisticalTest,
      topOverRepresented,
      topUnderRepresented
    };
  }

  /**
   * G1 연계 Use Case Trigger 제안 생성
   */
  generateUseCaseTriggers(analysisResult: ProfileAnalysisResult): G1TriggerProposal {
    const proposals: UseCaseTrigger[] = [];

    // 1. 과대 대표 전문과목 기반 트리거
    analysisResult.majorAnalysis.topOverRepresented.forEach((major, index) => {
      proposals.push({
        id: `major_trigger_${major.majorCode}`,
        name: `${major.majorName} 전문 타겟팅 캠페인`,
        targetSegment: {
          criteria: [`전문과목: ${major.majorName}`, `활성 사용자 세그먼트`],
          estimatedSize: major.distribution.activeCount,
          overRepresentationRate: major.distribution.difference
        },
        triggerCondition: {
          events: ['게시글 작성', '댓글 참여', '로그인'],
          frequency: 'daily',
          priority: index < 2 ? 'high' : 'medium'
        },
        expectedOutcome: {
          description: `${major.majorName} 의료진 대상 참여율 ${Math.round(major.distribution.difference * 2)}% 향상`,
          estimatedROI: major.distribution.difference * 1.5,
          measurementMethod: ['DAU 증가율', '게시글 참여도', '세션 지속시간']
        },
        implementation: {
          complexity: major.distribution.activeCount > 1000 ? 'medium' : 'low',
          estimatedEffort: `${Math.ceil(major.distribution.activeCount / 500)} person-days`,
          dependencies: ['사용자 세그먼테이션 시스템', '개인화 추천 엔진']
        }
      });
    });

    // 2. 과대 대표 근무형태 기반 트리거
    analysisResult.workTypeAnalysis.topOverRepresented.forEach((workType, index) => {
      proposals.push({
        id: `worktype_trigger_${workType.workTypeCode}`,
        name: `${workType.workTypeName} 맞춤형 콘텐츠 제안`,
        targetSegment: {
          criteria: [`근무형태: ${workType.workTypeName}`, `고참여 사용자`],
          estimatedSize: workType.distribution.activeCount,
          overRepresentationRate: workType.distribution.difference
        },
        triggerCondition: {
          events: ['특정 게시판 방문', '관련 키워드 검색'],
          frequency: 'immediate',
          priority: workType.distribution.difference > 10 ? 'high' : 'medium'
        },
        expectedOutcome: {
          description: `${workType.workTypeName} 관련 콘텐츠 소비 ${Math.round(workType.distribution.difference * 1.8)}% 증가`,
          estimatedROI: workType.distribution.difference * 1.2,
          measurementMethod: ['콘텐츠 조회수', '체류시간', '공유율']
        },
        implementation: {
          complexity: 'medium',
          estimatedEffort: `${Math.ceil(workType.distribution.activeCount / 800)} person-days`,
          dependencies: ['콘텐츠 태깅 시스템', 'A/B 테스트 플랫폼']
        }
      });
    });

    // 우선순위 랭킹 (ROI 기준)
    const priorityRanking = proposals
      .sort((a, b) => b.expectedOutcome.estimatedROI - a.expectedOutcome.estimatedROI)
      .map(p => p.id);

    // 리스크 평가
    const riskAssessment = proposals.map(proposal => ({
      triggerId: proposal.id,
      risks: [
        proposal.targetSegment.estimatedSize < 100 ? '소규모 세그먼트로 인한 낮은 임팩트' : '',
        proposal.implementation.complexity === 'high' ? '구현 복잡도 높음' : '',
        proposal.targetSegment.overRepresentationRate < 8 ? '통계적 유의성 부족' : ''
      ].filter(Boolean),
      mitigation: [
        '단계적 출시 (베타 테스트)',
        'A/B 테스트를 통한 효과 검증',
        '정기적 성과 모니터링'
      ]
    }));

    return {
      proposals,
      priorityRanking,
      riskAssessment
    };
  }

  /**
   * 프로필 조인 쿼리 빌드 (DOMAIN_SCHEMA.md 준수)
   */
  buildProfileJoinQuery(): string {
    return `
      SELECT 
        u.U_ID,
        u.U_NAME,
        ud.U_MAJOR_CODE_1,
        cm1.CODE_NAME AS MAJOR_NAME_1,
        ud.U_MAJOR_CODE_2,
        cm3.CODE_NAME AS MAJOR_NAME_2,
        ud.U_WORK_TYPE_1,
        cm2.CODE_NAME AS WORK_TYPE_NAME,
        ud.U_CAREER_YEAR,
        ud.U_HOSPITAL_NAME,
        ud.U_OFFICE_ZIP
      FROM USERS u
        INNER JOIN USER_DETAIL ud ON u.U_ID = ud.U_ID
        LEFT JOIN CODE_MASTER cm1 ON ud.U_MAJOR_CODE_1 = cm1.CODE_VALUE 
          AND cm1.CODE_TYPE = 'MAJOR' 
          AND cm1.USE_FLAG = 'Y'
        LEFT JOIN CODE_MASTER cm2 ON ud.U_WORK_TYPE_1 = cm2.CODE_VALUE 
          AND cm2.CODE_TYPE = 'WORK_TYPE' 
          AND cm2.USE_FLAG = 'Y'
        LEFT JOIN CODE_MASTER cm3 ON ud.U_MAJOR_CODE_2 = cm3.CODE_VALUE 
          AND cm3.CODE_TYPE = 'MAJOR' 
          AND cm3.USE_FLAG = 'Y'
      WHERE u.U_KIND = 'DOC001' 
        AND u.U_ALIVE = 'Y'
        AND u.U_ID IN (/* HEAVY 세그먼트 U_ID 목록 */)
      ORDER BY u.U_REG_DATE DESC
    `;
  }

  buildActiveSegmentQuery(userIds: string[]): string {
    const placeholders = userIds.map(() => '?').join(',');
    return `
      SELECT 
        u.U_ID,
        u.U_EMAIL,
        u.U_NAME,
        u.U_KIND,
        u.U_ALIVE,
        u.U_REG_DATE
      FROM USERS u
      WHERE u.U_ID IN (${placeholders})
        AND u.U_KIND = 'DOC001'
        AND u.U_ALIVE = 'Y'
      ORDER BY u.U_REG_DATE DESC
    `;
  }

  async filterMinimumSampleSize(data: any[], minSize: number): Promise<any[]> {
    return data.filter(item => item.count >= minSize);
  }

  /**
   * Helper Methods
   */
  private aggregateByField(data: any[], codeField: string, nameField: string): Record<string, { count: number; name: string }> {
    const result: Record<string, { count: number; name: string }> = {};
    
    data.forEach(row => {
      const code = row[codeField];
      const name = row[nameField] || code;
      
      if (code) {
        if (!result[code]) {
          result[code] = { count: 0, name };
        }
        result[code].count++;
      }
    });

    return result;
  }

  private calculateCompletionRate(data: any[]): number {
    const totalRecords = data.length;
    const completeRecords = data.filter(row => row.U_MAJOR_CODE_1 && row.U_WORK_TYPE_1).length;
    return totalRecords > 0 ? (completeRecords / totalRecords) * 100 : 0;
  }

  private generateBusinessInsights(
    majorAnalysis: any, 
    workTypeAnalysis: any
  ): { keyFindings: string[]; businessImpact: string[]; recommendations: string[]; } {
    const keyFindings: string[] = [];
    const businessImpact: string[] = [];
    const recommendations: string[] = [];

    // Key Findings 생성
    if (majorAnalysis.topOverRepresented.length > 0) {
      const topMajor = majorAnalysis.topOverRepresented[0];
      keyFindings.push(`${topMajor.majorName}이 활성 사용자에서 +${topMajor.distribution.difference.toFixed(1)}%p 과대 대표됨`);
    }

    if (workTypeAnalysis.topOverRepresented.length > 0) {
      const topWorkType = workTypeAnalysis.topOverRepresented[0];
      keyFindings.push(`${topWorkType.workTypeName}이 활성 사용자에서 +${topWorkType.distribution.difference.toFixed(1)}%p 과대 대표됨`);
    }

    // Business Impact
    businessImpact.push('특정 세그먼트의 높은 참여도 확인으로 타겟팅 마케팅 기회 발견');
    businessImpact.push('세그먼트별 차별화된 콘텐츠 전략 수립 가능');

    // Recommendations
    recommendations.push('과대 대표 세그먼트 대상 전용 콘텐츠 확대');
    recommendations.push('과소 대표 세그먼트 참여 유도 캠페인 기획');
    recommendations.push('세그먼트별 개인화 추천 시스템 도입');

    return { keyFindings, businessImpact, recommendations };
  }
}

/**
 * SQL 쿼리 빌더 클래스
 */
export class SqlQueryBuilder {
  private readonly FORBIDDEN_TABLES = ['USER_LOGIN', 'COMMENT'];

  buildActiveSegmentQuery(userIds: string[]): string {
    const placeholders = userIds.map(() => '?').join(',');
    return `
      SELECT 
        u.U_ID,
        u.U_EMAIL,
        u.U_NAME,
        u.U_KIND,
        u.U_ALIVE,
        u.U_REG_DATE
      FROM USERS u
      WHERE u.U_ID IN (${placeholders})
        AND u.U_KIND = 'DOC001'
        AND u.U_ALIVE = 'Y'
      ORDER BY u.U_REG_DATE DESC
    `;
  }

  buildQuery(sqlString: string): string {
    // 대용량 테이블 직접 조회 방지
    for (const table of this.FORBIDDEN_TABLES) {
      if (sqlString.toUpperCase().includes(`FROM ${table}`) || 
          sqlString.toUpperCase().includes(`JOIN ${table}`)) {
        throw new Error(`대용량 테이블 ${table} 직접 조회 금지`);
      }
    }
    return sqlString;
  }
}

/**
 * 통계 분석기 클래스 - 실제 구현
 */
export class StatisticalAnalyzer {
  static chiSquareTest(observed: number[], expected: number[]): StatisticalTest {
    if (observed.length !== expected.length) {
      throw new Error('관찰값과 기댓값 배열 길이가 다릅니다');
    }

    let chiSquare = 0;
    let totalObserved = 0;
    let totalExpected = 0;

    // 카이제곱 통계량 계산
    for (let i = 0; i < observed.length; i++) {
      if (expected[i] <= 0) {
        throw new Error('기댓값은 0보다 커야 합니다');
      }
      chiSquare += Math.pow(observed[i] - expected[i], 2) / expected[i];
      totalObserved += observed[i];
      totalExpected += expected[i];
    }

    const degreesOfFreedom = observed.length - 1;
    
    // p-value 근사 계산 (간단한 근사식 사용)
    const pValue = this.approximatePValue(chiSquare, degreesOfFreedom);
    
    // Cramer's V (효과 크기) 계산
    const n = Math.min(totalObserved, totalExpected);
    const cramersV = Math.sqrt(chiSquare / (n * (observed.length - 1)));

    return {
      testType: 'chi-square',
      statistic: chiSquare,
      pValue,
      degreesOfFreedom,
      effectSize: cramersV,
      isSignificant: pValue < 0.05
    };
  }

  private static approximatePValue(chiSquare: number, df: number): number {
    // 간단한 p-value 근사 계산
    // 실제 구현에서는 적절한 통계 라이브러리 사용 권장
    if (df === 1) {
      if (chiSquare > 3.84) return 0.05;
      if (chiSquare > 6.63) return 0.01;
      return 0.1;
    } else if (df === 2) {
      if (chiSquare > 5.99) return 0.05;
      if (chiSquare > 9.21) return 0.01;
      return 0.1;
    }
    // 기본적으로 보수적 추정
    return chiSquare > (df + 2) ? 0.05 : 0.1;
  }
}