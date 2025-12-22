/**
 * ProfileAgent - 회원 프로필 분석 전문 에이전트
 *
 * Phase 6-1: Analysis Pipeline 분리
 *
 * 역할:
 * - 회원 세그먼트 분석
 * - 프로필 기반 인사이트 도출
 * - 휴면 위험도 산출
 * - AI Agent 타겟 후보 추출
 *
 * 관련 테이블:
 * - USERS, USER_DETAIL, USER_LOGIN, CODE_MASTER
 *
 * @version 1.0.0
 * @since 2025-12-22
 */

import { ProviderFactory } from '../providers/index.js';
import { QueryAgent } from './query-agent.js';

// ========== 세그먼트 정의 ==========
const SEGMENTS = {
  ACTIVE_HEAVY: {
    name: '활성-Heavy',
    description: '최근 30일 내 7회 이상 로그인',
    criteria: { loginDays: 7, period: 30 },
  },
  ACTIVE_MEDIUM: {
    name: '활성-Medium',
    description: '최근 30일 내 3~6회 로그인',
    criteria: { loginDays: [3, 6], period: 30 },
  },
  ACTIVE_LIGHT: {
    name: '활성-Light',
    description: '최근 30일 내 1~2회 로그인',
    criteria: { loginDays: [1, 2], period: 30 },
  },
  DORMANT_RISK: {
    name: '휴면위험',
    description: '최근 30일 내 로그인 없음, 60일 내 있음',
    criteria: { noLogin: 30, hasLogin: 60 },
  },
  DORMANT: {
    name: '휴면',
    description: '최근 90일 내 로그인 없음',
    criteria: { noLogin: 90 },
  },
};

// ========== 프로필 차원 ==========
const PROFILE_DIMENSIONS = {
  MAJOR: {
    table: 'USER_DETAIL',
    column: 'U_MAJOR_CODE_1',
    codeKbn: 'SPC',
    name: '전문과목',
  },
  WORK_TYPE: {
    table: 'USER_DETAIL',
    column: 'U_WORK_TYPE_1',
    codeKbn: 'WTP',
    name: '근무형태',
  },
  USER_KIND: {
    table: 'USERS',
    column: 'U_KIND',
    codeKbn: 'UKD',
    name: '회원유형',
  },
  LOCATION: {
    table: 'USER_DETAIL',
    column: 'U_OFFICE_ZIP',
    join: 'CODE_LOC',
    name: '지역',
  },
};

export class ProfileAgent {
  constructor(config = {}) {
    this.projectRoot = config.projectRoot || process.cwd();
    this.maxTokens = config.maxTokens || 8192;

    // QueryAgent 인스턴스 (쿼리 실행 위임)
    this.queryAgent = new QueryAgent(config);

    // Multi-LLM Provider 설정
    this.providerName = config.provider || 'anthropic';
    this.providerConfig = config.providerConfig || {};
    this.fallbackOrder = config.fallbackOrder || ['anthropic', 'openai', 'gemini'];
    this.useFallback = config.useFallback !== false;

    this._initProvider();
  }

  /**
   * Provider 초기화
   */
  _initProvider() {
    try {
      this.provider = ProviderFactory.create(this.providerName, {
        ...this.providerConfig,
        maxTokens: this.maxTokens
      });

      if (!this.provider.isAvailable()) {
        if (this.useFallback) {
          this.provider = ProviderFactory.getFirstAvailable(this.fallbackOrder, {
            [this.providerName]: this.providerConfig
          });
        }
      }

      if (this.provider) {
        console.log(`[ProfileAgent] Using provider: ${this.provider.getName()}`);
      }
    } catch (error) {
      console.error(`[ProfileAgent] Provider initialization failed: ${error.message}`);
      this.provider = null;
    }
  }

  async _sendMessage(systemPrompt, userMessage) {
    if (!this.provider) {
      throw new Error('[ProfileAgent] No available provider');
    }

    if (this.useFallback) {
      return await ProviderFactory.sendWithFallback(
        systemPrompt,
        userMessage,
        this.fallbackOrder,
        { [this.providerName]: this.providerConfig }
      );
    }

    const result = await this.provider.sendMessage(systemPrompt, userMessage);
    return { ...result, provider: this.provider.getName() };
  }

  // ========== 세그먼트 분석 ==========

  /**
   * 회원 세그먼트 분석
   * @param {Object} options - { userKind, period }
   * @returns {Object} - 세그먼트별 회원 수 및 비율
   */
  async analyzeSegments(options = {}) {
    console.log('[ProfileAgent] 세그먼트 분석 시작...');

    const userKind = options.userKind || 'UKD001'; // 기본: 의사회원
    const period = options.period || 30;

    const queries = [
      {
        name: 'segment_active_heavy',
        description: '활성-Heavy 회원 수',
        sql: `
          SELECT COUNT(DISTINCT ul.U_ID) as cnt
          FROM USER_LOGIN ul
          JOIN USERS u ON u.U_ID = ul.U_ID
          WHERE u.U_KIND = '${userKind}'
            AND u.U_ALIVE = 'UST001'
            AND ul.LOGIN_DATE >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL ${period} DAY), '%Y%m%d')
          GROUP BY ul.U_ID
          HAVING COUNT(DISTINCT ul.LOGIN_DATE) >= 7
        `.trim(),
      },
      {
        name: 'segment_active_medium',
        description: '활성-Medium 회원 수',
        sql: `
          SELECT COUNT(*) as cnt FROM (
            SELECT ul.U_ID
            FROM USER_LOGIN ul
            JOIN USERS u ON u.U_ID = ul.U_ID
            WHERE u.U_KIND = '${userKind}'
              AND u.U_ALIVE = 'UST001'
              AND ul.LOGIN_DATE >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL ${period} DAY), '%Y%m%d')
            GROUP BY ul.U_ID
            HAVING COUNT(DISTINCT ul.LOGIN_DATE) BETWEEN 3 AND 6
          ) sub
        `.trim(),
      },
      {
        name: 'segment_dormant_risk',
        description: '휴면위험 회원 수',
        sql: `
          SELECT COUNT(DISTINCT u.U_ID) as cnt
          FROM USERS u
          LEFT JOIN USER_LOGIN ul ON u.U_ID = ul.U_ID
            AND ul.LOGIN_DATE >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL ${period} DAY), '%Y%m%d')
          WHERE u.U_KIND = '${userKind}'
            AND u.U_ALIVE = 'UST001'
            AND ul.U_ID IS NULL
          LIMIT 10000
        `.trim(),
      },
    ];

    const results = await this.queryAgent.executeQueries(queries);

    return {
      segments: results.map(r => ({
        name: r.name.replace('segment_', ''),
        count: r.success ? parseInt(r.data[0]?.cnt || 0) : 0,
        error: r.success ? null : r.error,
      })),
      period,
      userKind,
      timestamp: new Date().toISOString(),
    };
  }

  // ========== 프로필 분포 분석 ==========

  /**
   * 프로필 차원별 분포 분석
   * @param {string} dimension - 'MAJOR' | 'WORK_TYPE' | 'USER_KIND' | 'LOCATION'
   * @param {Object} options - { userKind, segmentFilter }
   * @returns {Object} - 분포 데이터
   */
  async analyzeProfileDistribution(dimension, options = {}) {
    console.log(`[ProfileAgent] ${dimension} 분포 분석...`);

    const dim = PROFILE_DIMENSIONS[dimension];
    if (!dim) {
      throw new Error(`Unknown dimension: ${dimension}`);
    }

    const userKind = options.userKind || 'UKD001';
    const limit = options.limit || 20;

    const query = {
      name: `distribution_${dimension.toLowerCase()}`,
      description: `${dim.name}별 분포`,
      sql: `
        SELECT
          ${dim.column} as code,
          cm.CODE_NAME as name,
          COUNT(*) as cnt,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM USERS WHERE U_KIND = '${userKind}' AND U_ALIVE = 'UST001'), 2) as pct
        FROM ${dim.table} ud
        JOIN USERS u ON u.U_ID = ud.U_ID
        LEFT JOIN CODE_MASTER cm ON cm.KBN = '${dim.codeKbn}' AND cm.CODE = ud.${dim.column}
        WHERE u.U_KIND = '${userKind}'
          AND u.U_ALIVE = 'UST001'
        GROUP BY ${dim.column}, cm.CODE_NAME
        ORDER BY cnt DESC
        LIMIT ${limit}
      `.trim(),
    };

    const results = await this.queryAgent.executeQueries([query]);

    return {
      dimension: dim.name,
      distribution: results[0]?.success ? results[0].data : [],
      error: results[0]?.success ? null : results[0]?.error,
      timestamp: new Date().toISOString(),
    };
  }

  // ========== 휴면 위험도 분석 ==========

  /**
   * 휴면 위험도 산출
   * @param {Object} options - { userKind, threshold }
   * @returns {Object} - 휴면 위험 회원 목록 및 점수
   */
  async analyzeDormancyRisk(options = {}) {
    console.log('[ProfileAgent] 휴면 위험도 분석...');

    const userKind = options.userKind || 'UKD001';
    const threshold = options.threshold || 30; // 기본 30일

    const query = {
      name: 'dormancy_risk_score',
      description: '휴면 위험 점수',
      sql: `
        SELECT
          u.U_ID,
          DATEDIFF(NOW(), MAX(ul.LOGIN_DATE)) as days_since_login,
          COUNT(DISTINCT ul.LOGIN_DATE) as login_count_90d,
          CASE
            WHEN DATEDIFF(NOW(), MAX(ul.LOGIN_DATE)) > 90 THEN 100
            WHEN DATEDIFF(NOW(), MAX(ul.LOGIN_DATE)) > 60 THEN 80
            WHEN DATEDIFF(NOW(), MAX(ul.LOGIN_DATE)) > 30 THEN 60
            ELSE 30
          END as risk_score
        FROM USERS u
        JOIN USER_LOGIN ul ON u.U_ID = ul.U_ID
          AND ul.LOGIN_DATE >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 90 DAY), '%Y%m%d')
        WHERE u.U_KIND = '${userKind}'
          AND u.U_ALIVE = 'UST001'
        GROUP BY u.U_ID
        HAVING days_since_login >= ${threshold}
        ORDER BY risk_score DESC, days_since_login DESC
        LIMIT 1000
      `.trim(),
    };

    const results = await this.queryAgent.executeQueries([query]);

    if (!results[0]?.success) {
      return {
        riskMembers: [],
        error: results[0]?.error,
        timestamp: new Date().toISOString(),
      };
    }

    const data = results[0].data;

    // 위험도 통계
    const stats = {
      highRisk: data.filter(r => parseInt(r.risk_score) >= 80).length,
      mediumRisk: data.filter(r => parseInt(r.risk_score) >= 60 && parseInt(r.risk_score) < 80).length,
      lowRisk: data.filter(r => parseInt(r.risk_score) < 60).length,
      total: data.length,
    };

    return {
      riskMembers: data.slice(0, 100), // 상위 100명만
      stats,
      timestamp: new Date().toISOString(),
    };
  }

  // ========== AI Agent 타겟 추출 ==========

  /**
   * AI Agent 우선 타겟 회원 추출
   * @param {Object} criteria - { segment, major, workType, minLoginCount }
   * @returns {Object} - 타겟 회원 목록
   */
  async extractAgentTargets(criteria = {}) {
    console.log('[ProfileAgent] AI Agent 타겟 추출...');

    const segment = criteria.segment || 'active';
    const major = criteria.major || null;
    const workType = criteria.workType || null;
    const minLoginCount = criteria.minLoginCount || 3;
    const limit = criteria.limit || 500;

    let whereClause = `
      u.U_KIND = 'UKD001'
      AND u.U_ALIVE = 'UST001'
    `;

    if (major) {
      whereClause += ` AND ud.U_MAJOR_CODE_1 = '${major}'`;
    }
    if (workType) {
      whereClause += ` AND ud.U_WORK_TYPE_1 = '${workType}'`;
    }

    const query = {
      name: 'agent_target_extraction',
      description: 'AI Agent 타겟 회원',
      sql: `
        SELECT
          u.U_ID,
          ud.U_MAJOR_CODE_1 as major,
          cm1.CODE_NAME as major_name,
          ud.U_WORK_TYPE_1 as work_type,
          cm2.CODE_NAME as work_type_name,
          ud.U_HOSPITAL_NAME as hospital,
          COUNT(DISTINCT ul.LOGIN_DATE) as login_count_30d
        FROM USERS u
        JOIN USER_DETAIL ud ON u.U_ID = ud.U_ID
        LEFT JOIN CODE_MASTER cm1 ON cm1.KBN = 'SPC' AND cm1.CODE = ud.U_MAJOR_CODE_1
        LEFT JOIN CODE_MASTER cm2 ON cm2.KBN = 'WTP' AND cm2.CODE = ud.U_WORK_TYPE_1
        JOIN USER_LOGIN ul ON u.U_ID = ul.U_ID
          AND ul.LOGIN_DATE >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 30 DAY), '%Y%m%d')
        WHERE ${whereClause}
        GROUP BY u.U_ID, ud.U_MAJOR_CODE_1, cm1.CODE_NAME,
                 ud.U_WORK_TYPE_1, cm2.CODE_NAME, ud.U_HOSPITAL_NAME
        HAVING login_count_30d >= ${minLoginCount}
        ORDER BY login_count_30d DESC
        LIMIT ${limit}
      `.trim(),
    };

    const results = await this.queryAgent.executeQueries([query]);

    return {
      targets: results[0]?.success ? results[0].data : [],
      count: results[0]?.success ? results[0].data.length : 0,
      criteria,
      error: results[0]?.success ? null : results[0]?.error,
      timestamp: new Date().toISOString(),
    };
  }

  // ========== 인사이트 도출 ==========

  /**
   * 분석 결과에서 인사이트 도출
   * @param {Object} analysisResults - 분석 결과
   * @returns {Object} - 인사이트 및 제안
   */
  async deriveInsights(analysisResults) {
    console.log('[ProfileAgent] 인사이트 도출...');

    const systemPrompt = `당신은 의료 서비스 데이터 분석 전문가입니다.

## 역할
- 회원 프로필 분석 결과에서 비즈니스 인사이트를 도출합니다.
- 실행 가능한 Use Case를 제안합니다.

## 출력 형식
\`\`\`json
{
  "keyFindings": [
    { "finding": "발견 내용", "impact": "high|medium|low" }
  ],
  "useCases": [
    { "name": "Use Case 명", "target": "타겟 세그먼트", "action": "권장 액션", "expectedOutcome": "예상 효과" }
  ],
  "recommendations": [
    { "priority": "P0|P1|P2", "action": "권장 사항" }
  ]
}
\`\`\``;

    const userMessage = `## 분석 결과

${JSON.stringify(analysisResults, null, 2)}

위 결과를 바탕으로 인사이트와 Use Case를 도출해주세요.`;

    try {
      const response = await this._sendMessage(systemPrompt, userMessage);
      const jsonMatch = response.content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      return { keyFindings: [], useCases: [], recommendations: [] };
    } catch (error) {
      console.error('[ProfileAgent] 인사이트 도출 실패:', error.message);
      return { keyFindings: [], useCases: [], recommendations: [] };
    }
  }

  // ========== 종합 분석 ==========

  /**
   * 종합 프로필 분석 실행
   * @param {Object} options - 분석 옵션
   * @returns {Object} - 종합 분석 결과
   */
  async runFullAnalysis(options = {}) {
    console.log('\n[ProfileAgent] ========== 종합 프로필 분석 ==========');

    const results = {
      segments: null,
      majorDistribution: null,
      workTypeDistribution: null,
      dormancyRisk: null,
      agentTargets: null,
      insights: null,
      errors: [],
      timestamp: new Date().toISOString(),
    };

    try {
      // 1. 세그먼트 분석
      results.segments = await this.analyzeSegments(options);
      console.log(`  ✓ 세그먼트 분석 완료`);

      // 2. 전문과목 분포
      results.majorDistribution = await this.analyzeProfileDistribution('MAJOR', options);
      console.log(`  ✓ 전문과목 분포 분석 완료`);

      // 3. 근무형태 분포
      results.workTypeDistribution = await this.analyzeProfileDistribution('WORK_TYPE', options);
      console.log(`  ✓ 근무형태 분포 분석 완료`);

      // 4. 휴면 위험도
      results.dormancyRisk = await this.analyzeDormancyRisk(options);
      console.log(`  ✓ 휴면 위험도 분석 완료`);

      // 5. AI Agent 타겟
      results.agentTargets = await this.extractAgentTargets(options);
      console.log(`  ✓ AI Agent 타겟 추출 완료`);

      // 6. 인사이트 도출
      results.insights = await this.deriveInsights(results);
      console.log(`  ✓ 인사이트 도출 완료`);

    } catch (error) {
      console.error(`[ProfileAgent] 분석 오류: ${error.message}`);
      results.errors.push(error.message);
    }

    console.log('\n[ProfileAgent] ========== 분석 완료 ==========\n');
    return results;
  }
}

export default ProfileAgent;
