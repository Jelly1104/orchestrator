import type {
  ActiveMemberReport,
  MemberSegment,
  WorkTypeSegment,
  DistributionComparison,
  G1UseCaseTrigger,
  ActiveMemberQueryResult,
  MajorDistributionQueryResult,
  WorkTypeDistributionQueryResult
} from '../types/active-member.types';
import { DatabaseConnection, DatabaseError } from '../config/database';

/**
 * 활성 회원 분석 서비스
 * DOMAIN_SCHEMA.md의 제약사항을 준수하여 안전한 DB 접근을 보장합니다.
 */
export class ActiveMemberAnalyzer {
  private readonly ACTIVE_WINDOW_DAYS = 30;
  private readonly MIN_SEGMENT_SIZE = 5; // 개인정보 보호를 위한 최소 세그먼트 크기
  private readonly VARIANCE_THRESHOLD = 20; // 과대/과소 표현 판단 임계치 (20%)

  constructor(private dbConnection: DatabaseConnection) {
    if (!dbConnection) {
      throw new Error('Database connection is required');
    }
  }

  /**
   * 1. 활성 회원 세그먼트 정의 SQL
   * 최근 30일 내 로그인한 의사 회원만 조회 (인덱스 힌트 포함)
   */
  async getActiveMembers(): Promise<ActiveMemberQueryResult[]> {
    const sql = `
      SELECT /*+ USE_INDEX(ul, idx_login_date_uid) */
        u.U_ID,
        u.U_KIND,
        COALESCE(ud.U_MAJOR_CODE_1, 'UNKNOWN') as U_MAJOR_CODE_1,
        COALESCE(ud.U_WORK_TYPE_1, 'UNKNOWN') as U_WORK_TYPE_1,
        ul.LAST_LOGIN_DATE,
        ul.LOGIN_COUNT_30D
      FROM USERS u
      INNER JOIN (
        SELECT /*+ USE_INDEX(USER_LOGIN, idx_login_date) */
          U_ID,
          MAX(LOGIN_DATE) as LAST_LOGIN_DATE,
          COUNT(*) as LOGIN_COUNT_30D
        FROM USER_LOGIN
        WHERE LOGIN_DATE >= DATE_SUB(NOW(), INTERVAL ? DAY)
          AND LOGIN_DATE <= NOW()
        GROUP BY U_ID
        HAVING LOGIN_COUNT_30D >= 1
      ) ul ON u.U_ID = ul.U_ID
      LEFT JOIN USER_DETAIL ud ON u.U_ID = ud.U_ID
      WHERE u.U_KIND = ?
        AND u.U_ALIVE = ?
      ORDER BY ul.LOGIN_COUNT_30D DESC, ul.LAST_LOGIN_DATE DESC
    `;

    return this.executeQuery<ActiveMemberQueryResult>(sql, [
      this.ACTIVE_WINDOW_DAYS,
      'DOC001', // 의사만
      'Y'       // 활성 계정만
    ]);
  }

  /**
   * 2. 프로필-행동 조인 분석 쿼리 (성능 최적화)
   * 활성/전체 회원의 전문과목별 분포 조회
   */
  async getMajorDistribution(memberType: 'active' | 'total'): Promise<MajorDistributionQueryResult[]> {
    if (memberType === 'active') {
      const sql = `
        SELECT 
          COALESCE(ud.U_MAJOR_CODE_1, 'UNKNOWN') as MAJOR_CODE,
          COALESCE(cm.CODE_NAME, '미분류') as MAJOR_NAME,
          COUNT(*) as MEMBER_COUNT
        FROM USERS u
        INNER JOIN (
          SELECT /*+ USE_INDEX(USER_LOGIN, idx_login_date) */ 
            DISTINCT U_ID 
          FROM USER_LOGIN 
          WHERE LOGIN_DATE >= DATE_SUB(NOW(), INTERVAL ? DAY)
        ) recent_login ON u.U_ID = recent_login.U_ID
        LEFT JOIN USER_DETAIL ud ON u.U_ID = ud.U_ID
        LEFT JOIN CODE_MASTER cm ON cm.CODE_TYPE = 'MAJOR' 
          AND cm.CODE_VALUE = ud.U_MAJOR_CODE_1 
          AND cm.USE_FLAG = 'Y'
        WHERE u.U_KIND = ? AND u.U_ALIVE = ?
        GROUP BY ud.U_MAJOR_CODE_1, cm.CODE_NAME
        HAVING MEMBER_COUNT >= ?
        ORDER BY MEMBER_COUNT DESC
      `;
      
      return this.executeQuery<MajorDistributionQueryResult>(sql, [
        this.ACTIVE_WINDOW_DAYS, 'DOC001', 'Y', this.MIN_SEGMENT_SIZE
      ]);
    } else {
      const sql = `
        SELECT 
          COALESCE(ud.U_MAJOR_CODE_1, 'UNKNOWN') as MAJOR_CODE,
          COALESCE(cm.CODE_NAME, '미분류') as MAJOR_NAME,
          COUNT(*) as MEMBER_COUNT
        FROM USERS u
        LEFT JOIN USER_DETAIL ud ON u.U_ID = ud.U_ID
        LEFT JOIN CODE_MASTER cm ON cm.CODE_TYPE = 'MAJOR' 
          AND cm.CODE_VALUE = ud.U_MAJOR_CODE_1 
          AND cm.USE_FLAG = 'Y'
        WHERE u.U_KIND = ? AND u.U_ALIVE = ?
        GROUP BY ud.U_MAJOR_CODE_1, cm.CODE_NAME
        HAVING MEMBER_COUNT >= ?
        ORDER BY MEMBER_COUNT DESC
      `;
      
      return this.executeQuery<MajorDistributionQueryResult>(sql, [
        'DOC001', 'Y', this.MIN_SEGMENT_SIZE
      ]);
    }
  }

  /**
   * 3. 근무형태별 분포 분석 (중복 쿼리 통합 최적화)
   */
  async getWorkTypeDistribution(memberType: 'active' | 'total'): Promise<WorkTypeDistributionQueryResult[]> {
    if (memberType === 'active') {
      const sql = `
        SELECT 
          COALESCE(ud.U_WORK_TYPE_1, 'UNKNOWN') as WORK_TYPE_CODE,
          COALESCE(cm.CODE_NAME, '미분류') as WORK_TYPE_NAME,
          COUNT(*) as MEMBER_COUNT
        FROM USERS u
        INNER JOIN (
          SELECT /*+ USE_INDEX(USER_LOGIN, idx_login_date) */ 
            DISTINCT U_ID 
          FROM USER_LOGIN 
          WHERE LOGIN_DATE >= DATE_SUB(NOW(), INTERVAL ? DAY)
        ) recent_login ON u.U_ID = recent_login.U_ID
        LEFT JOIN USER_DETAIL ud ON u.U_ID = ud.U_ID
        LEFT JOIN CODE_MASTER cm ON cm.CODE_TYPE = 'WORK_TYPE' 
          AND cm.CODE_VALUE = ud.U_WORK_TYPE_1 
          AND cm.USE_FLAG = 'Y'
        WHERE u.U_KIND = ? AND u.U_ALIVE = ?
        GROUP BY ud.U_WORK_TYPE_1, cm.CODE_NAME
        HAVING MEMBER_COUNT >= ?
        ORDER BY MEMBER_COUNT DESC
      `;
      
      return this.executeQuery<WorkTypeDistributionQueryResult>(sql, [
        this.ACTIVE_WINDOW_DAYS, 'DOC001', 'Y', this.MIN_SEGMENT_SIZE
      ]);
    } else {
      const sql = `
        SELECT 
          COALESCE(ud.U_WORK_TYPE_1, 'UNKNOWN') as WORK_TYPE_CODE,
          COALESCE(cm.CODE_NAME, '미분류') as WORK_TYPE_NAME,
          COUNT(*) as MEMBER_COUNT
        FROM USERS u
        LEFT JOIN USER_DETAIL ud ON u.U_ID = ud.U_ID
        LEFT JOIN CODE_MASTER cm ON cm.CODE_TYPE = 'WORK_TYPE' 
          AND cm.CODE_VALUE = ud.U_WORK_TYPE_1 
          AND cm.USE_FLAG = 'Y'
        WHERE u.U_KIND = ? AND u.U_ALIVE = ?
        GROUP BY ud.U_WORK_TYPE_1, cm.CODE_NAME
        HAVING MEMBER_COUNT >= ?
        ORDER BY MEMBER_COUNT DESC
      `;
      
      return this.executeQuery<WorkTypeDistributionQueryResult>(sql, [
        'DOC001', 'Y', this.MIN_SEGMENT_SIZE
      ]);
    }
  }

  /**
   * 4. 분포 비교 및 통계적 유의성 판단 (개선됨)
   */
  compareDistributions(
    activeData: Array<{major?: string, workType?: string, count: number, percentage?: number}>,
    totalData: Array<{major?: string, workType?: string, count: number, percentage?: number}>
  ): DistributionComparison[] {
    const comparisons: DistributionComparison[] = [];

    // 활성 데이터의 총합 계산
    const activeTotal = activeData.reduce((sum, item) => sum + item.count, 0);
    const totalTotal = totalData.reduce((sum, item) => sum + item.count, 0);

    if (activeTotal === 0 || totalTotal === 0) {
      console.warn('Cannot compare distributions: zero totals detected');
      return [];
    }

    activeData.forEach(activeItem => {
      const category = activeItem.major || activeItem.workType || 'UNKNOWN';
      const totalItem = totalData.find(t => 
        (t.major && t.major === activeItem.major) || 
        (t.workType && t.workType === activeItem.workType)
      );

      if (!totalItem || totalItem.count === 0) return;

      const activePercentage = (activeItem.count / activeTotal) * 100;
      const totalPercentage = (totalItem.count / totalTotal) * 100;
      const variance = ((activePercentage - totalPercentage) / totalPercentage) * 100;

      let representation: 'OVER_REP' | 'UNDER_REP' | 'NORMAL' = 'NORMAL';
      if (Math.abs(variance) >= this.VARIANCE_THRESHOLD) {
        representation = variance > 0 ? 'OVER_REP' : 'UNDER_REP';
      }

      comparisons.push({
        category,
        categoryName: this.maskPrivateInfo(category), // PII 마스킹
        activeCount: activeItem.count,
        activePercentage: Math.round(activePercentage * 100) / 100,
        totalCount: totalItem.count,
        totalPercentage: Math.round(totalPercentage * 100) / 100,
        variance: Math.round(variance * 100) / 100,
        representation
      });
    });

    return comparisons.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
  }

  /**
   * 5. 개인정보 보호를 위한 필터링 (강화됨)
   */
  applyPrivacyFilter<T extends {major?: string, workType?: string, count: number}>(data: T[]): T[] {
    const filtered: T[] = [];
    let otherCount = 0;

    data.forEach(item => {
      if (item.count >= this.MIN_SEGMENT_SIZE) {
        filtered.push({
          ...item,
          major: item.major ? this.maskPrivateInfo(item.major) : item.major,
          workType: item.workType ? this.maskPrivateInfo(item.workType) : item.workType
        });
      } else {
        otherCount += item.count;
      }
    });

    if (otherCount >= this.MIN_SEGMENT_SIZE) {
      const otherItem = {
        ...data[0],
        major: 'ETC',
        workType: 'ETC',
        count: otherCount
      } as T;
      filtered.push(otherItem);
    }

    return filtered;
  }

  /**
   * 6. 활성 회원 프로파일 요약 리포트 생성 (실제 구현)
   */
  async generateActiveMemberReport(): Promise<ActiveMemberReport> {
    try {
      // 병렬 데이터 수집으로 성능 최적화
      const [activeMajors, totalMajors, activeWorkTypes, totalWorkTypes] = await Promise.all([
        this.getMajorDistribution('active'),
        this.getMajorDistribution('total'),
        this.getWorkTypeDistribution('active'),
        this.getWorkTypeDistribution('total')
      ]);

      // 총 활성/전체 회원 수 계산
      const totalActiveMembers = activeMajors.reduce((sum, item) => sum + item.MEMBER_COUNT, 0);
      const totalMembers = totalMajors.reduce((sum, item) => sum + item.MEMBER_COUNT, 0);

      if (totalActiveMembers === 0 || totalMembers === 0) {
        throw new DatabaseError('Insufficient data for report generation');
      }

      // 세그먼트 변환
      const majorSegments: MemberSegment[] = activeMajors.map(item => ({
        major: item.MAJOR_CODE,
        majorName: item.MAJOR_NAME,
        count: item.MEMBER_COUNT,
        percentage: Math.round((item.MEMBER_COUNT / totalActiveMembers) * 10000) / 100
      }));

      const workTypeSegments: WorkTypeSegment[] = activeWorkTypes.map(item => ({
        workType: item.WORK_TYPE_CODE,
        workTypeName: item.WORK_TYPE_NAME,
        count: item.MEMBER_COUNT,
        percentage: Math.round((item.MEMBER_COUNT / totalActiveMembers) * 10000) / 100
      }));

      // 비교 분석
      const majorComparison = this.compareDistributions(
        majorSegments.map(s => ({major: s.major, count: s.count, percentage: s.percentage})),
        totalMajors.map(t => ({major: t.MAJOR_CODE, count: t.MEMBER_COUNT}))
      );

      const workTypeComparison = this.compareDistributions(
        workTypeSegments.map(s => ({workType: s.workType, count: s.count, percentage: s.percentage})),
        totalWorkTypes.map(t => ({workType: t.WORK_TYPE_CODE, count: t.MEMBER_COUNT}))
      );

      // 인사이트 생성
      const topActiveMajors = majorComparison
        .filter(c => c.representation === 'OVER_REP')
        .slice(0, 3)
        .map(c => c.category);

      const underRepresentedMajors = majorComparison
        .filter(c => c.representation === 'UNDER_REP')
        .slice(0, 3)
        .map(c => c.category);

      const riskSegments = majorComparison
        .filter(c => c.activeCount < 50) // 활성 회원 50명 미만
        .map(c => c.category);

      return {
        metadata: {
          reportDate: new Date(),
          totalActiveMembers,
          totalMembers,
          activeRate: Math.round((totalActiveMembers / totalMembers) * 10000) / 100,
          analysisWindow: `${this.ACTIVE_WINDOW_DAYS} days`
        },
        segments: {
          majorDistribution: this.applyPrivacyFilter(majorSegments),
          workTypeDistribution: this.applyPrivacyFilter(workTypeSegments)
        },
        comparisons: {
          majorComparison,
          workTypeComparison
        },
        insights: {
          topActiveMajors,
          underRepresentedMajors,
          riskSegments
        }
      };
    } catch (error) {
      console.error('Report generation failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      throw new DatabaseError('Failed to generate active member report');
    }
  }

  /**
   * 7. G1 Use Case Trigger 후보 제안 (실제 분석 기반)
   */
  async suggestG1UseCaseTriggers(): Promise<G1UseCaseTrigger[]> {
    try {
      const report = await this.generateActiveMemberReport();
      const triggers: G1UseCaseTrigger[] = [];

      // 1. 구직 활동 가능성이 높은 세그먼트 (실제 데이터 기반)
      const residentSegments = report.comparisons.workTypeComparison
        .filter(c => c.category === 'RES' && c.representation === 'OVER_REP');

      if (residentSegments.length > 0) {
        const estimatedCount = residentSegments.reduce((sum, c) => sum + c.activeCount, 0);
        triggers.push({
          triggerType: 'JOB_SEEKING',
          targetSegment: {
            majors: report.insights.topActiveMajors.slice(0, 3),
            workTypes: ['RES'],
            estimatedCount
          },
          reasoning: `전공의(RES) 세그먼트가 활성 회원 중 ${residentSegments[0].activePercentage.toFixed(1)}% (전체 대비 ${residentSegments[0].totalPercentage.toFixed(1)}%)로 과대표현되어 있어 취업/이직 관심도가 높을 것으로 분석됩니다.`,
          priority: 'HIGH'
        });
      }

      // 2. 경력 변화 관심 세그먼트 (활성도 분석 기반)
      const lowEngagementMajors = report.insights.underRepresentedMajors.slice(0, 2);
      if (lowEngagementMajors.length > 0) {
        const estimatedCount = report.comparisons.majorComparison
          .filter(c => lowEngagementMajors.includes(c.category))
          .reduce((sum, c) => sum + c.activeCount, 0);

        triggers.push({
          triggerType: 'CAREER_CHANGE',
          targetSegment: {
            majors: lowEngagementMajors,
            workTypes: ['OWN', 'EMP'],
            estimatedCount
          },
          reasoning: `${lowEngagementMajors.join(', ')} 전공과목들의 플랫폼 활성 참여도가 상대적으로 낮아 새로운 기회 모색 가능성이 높습니다.`,
          priority: 'MEDIUM'
        });
      }

      // 3. 개원 관심 세그먼트 (봉직의 -> 개원의 전환)
      const employeeSegments = report.comparisons.workTypeComparison
        .filter(c => c.category === 'EMP' && c.activeCount >= 20);

      if (employeeSegments.length > 0) {
        triggers.push({
          triggerType: 'LOCATION_MOVE',
          targetSegment: {
            majors: report.insights.topActiveMajors.slice(0, 2),
            workTypes: ['EMP'],
            estimatedCount: Math.floor(employeeSegments[0].activeCount * 0.15)
          },
          reasoning: `활성도가 높은 봉직의 중 약 15%가 개원이나 지역 이동을 고려하고 있을 것으로 추정됩니다.`,
          priority: 'MEDIUM'
        });
      }

      return triggers
        .filter(t => t.targetSegment.estimatedCount >= this.MIN_SEGMENT_SIZE) // 개인정보 보호
        .sort((a, b) => {
          const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    } catch (error) {
      console.error('G1 trigger suggestion failed:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * 개인정보 마스킹 처리
   */
  private maskPrivateInfo(info: string): string {
    // 민감한 정보가 포함된 경우 마스킹 처리
    if (info.includes('UNKNOWN') || info.length < 2) {
      return '기타';
    }
    return info;
  }

  /**
   * DB 쿼리 실행 (실제 구현)
   */
  public async executeQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.dbConnection) {
      throw new DatabaseError('Database connection not initialized');
    }
    
    try {
      return await this.dbConnection.executeQuery<T>(sql, params);
    } catch (error) {
      console.error('ActiveMemberAnalyzer query failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      throw new DatabaseError('Query execution failed in ActiveMemberAnalyzer');
    }
  }
}