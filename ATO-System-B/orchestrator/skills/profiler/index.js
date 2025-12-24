/**
 * ProfilerSkill - 회원 프로필 분석 및 세그먼트 도출
 *
 * QuerySkill을 활용하여 세그먼트별 프로필 데이터를 분석
 *
 * @version 1.2.0
 * @since 2025-12-19
 * @updated 2025-12-24 - 네이밍 리팩토링 (ProfileAgent → ProfilerSkill)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { QuerySkill } from '../query/index.js';
import { SkillLoader } from '../skill-loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 기본 세그먼트 정의
const DEFAULT_SEGMENTS = {
  member_type: {
    name: '회원 유형',
    column: 'U_KIND',
    values: ['DR', 'NS', 'PH', 'MT', 'NU']
  },
  activity_level: {
    name: '활동 수준',
    query: `
      SELECT
        CASE
          WHEN login_count >= 30 THEN 'heavy'
          WHEN login_count >= 10 THEN 'medium'
          ELSE 'light'
        END as activity_level,
        COUNT(*) as count
      FROM (
        SELECT U_ID, COUNT(*) as login_count
        FROM USER_LOGIN
        WHERE LOGIN_DATE >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY U_ID
      ) t
      GROUP BY activity_level
    `
  },
  region: {
    name: '지역',
    column: 'SIDO'
  }
};

export class ProfilerSkill {
  constructor(config = {}) {
    this.projectRoot = config.projectRoot || process.cwd();

    // QuerySkill 인스턴스
    this.querySkill = new QuerySkill({
      projectRoot: this.projectRoot,
      ...config
    });

    // SkillLoader로 SKILL.md 로드
    this.skillLoader = new SkillLoader(path.join(__dirname, '..'));
    this.skill = null;
  }

  /**
   * 초기화
   */
  async initialize() {
    this.skill = await this.skillLoader.loadSkill('profiler');
    await this.querySkill.initialize();
    console.log('[ProfilerSkill] Initialized with SKILL.md');
    return this;
  }

  /**
   * 세그먼트별 프로필 분석
   *
   * @param {Object} input - 분석 입력
   * @param {string[]} input.segments - 분석할 세그먼트 목록
   * @param {Object} input.analysisGoals - 분석 관점
   * @param {Object} input.timeRange - 분석 기간
   * @returns {Promise<Object>} 프로필 분석 결과
   */
  async analyzeProfiles(input) {
    const { segments = ['member_type'], analysisGoals, timeRange } = input;

    console.log('[ProfilerSkill] Starting profile analysis');
    console.log(`  Segments: ${segments.join(', ')}`);

    const results = {
      segments: {},
      demographics: {},
      behaviors: {},
      personas: [],
      summary: ''
    };

    // 각 세그먼트별 분석
    for (const segmentKey of segments) {
      const segmentDef = DEFAULT_SEGMENTS[segmentKey] || { name: segmentKey };

      try {
        const segmentData = await this._analyzeSegment(segmentKey, segmentDef, timeRange);
        results.segments[segmentKey] = segmentData;
      } catch (error) {
        console.error(`[ProfilerSkill] Segment ${segmentKey} analysis failed: ${error.message}`);
        results.segments[segmentKey] = { error: error.message };
      }
    }

    // 인구통계 분석
    results.demographics = await this._analyzeDemographics(timeRange);

    // 행동 패턴 분석
    results.behaviors = await this._analyzeBehaviors(timeRange);

    // 페르소나 자동 생성
    results.personas = this._generatePersonas(results);

    // 요약 생성
    results.summary = this._generateSummary(results);

    return results;
  }

  /**
   * 단일 세그먼트 분석
   */
  async _analyzeSegment(segmentKey, segmentDef, timeRange) {
    let sql;

    if (segmentDef.query) {
      sql = segmentDef.query;
    } else if (segmentDef.column) {
      sql = `
        SELECT ${segmentDef.column} as segment_value, COUNT(*) as count
        FROM USERS u
        LEFT JOIN USER_DETAIL ud ON u.U_ID = ud.U_ID
        LEFT JOIN CODE_LOC cl ON ud.U_OFFICE_ZIP = cl.ZIP_CODE
        WHERE u.U_ALIVE = 'Y'
        GROUP BY ${segmentDef.column}
        ORDER BY count DESC
        LIMIT 20
      `;
    } else {
      throw new Error(`Invalid segment definition: ${segmentKey}`);
    }

    const result = await this.querySkill.executeQuery(sql, `Segment: ${segmentDef.name}`);

    return {
      name: segmentDef.name,
      data: result.data,
      total: result.data.reduce((sum, row) => sum + (row.count || 0), 0)
    };
  }

  /**
   * 인구통계 분석
   */
  async _analyzeDemographics(timeRange) {
    const sql = `
      SELECT
        u.U_KIND as member_type,
        COUNT(*) as total_count,
        AVG(ud.U_CAREER_YEAR) as avg_career_year,
        COUNT(DISTINCT cl.SIDO) as region_count
      FROM USERS u
      LEFT JOIN USER_DETAIL ud ON u.U_ID = ud.U_ID
      LEFT JOIN CODE_LOC cl ON ud.U_OFFICE_ZIP = cl.ZIP_CODE
      WHERE u.U_ALIVE = 'Y'
      GROUP BY u.U_KIND
      ORDER BY total_count DESC
      LIMIT 10
    `;

    const result = await this.querySkill.executeQuery(sql, 'Demographics Analysis');
    return result.data;
  }

  /**
   * 행동 패턴 분석
   */
  async _analyzeBehaviors(timeRange) {
    // 최근 30일 기준 간단한 행동 분석
    const sql = `
      SELECT
        u.U_KIND as member_type,
        COUNT(DISTINCT ul.U_ID) as active_users,
        COUNT(*) as total_logins,
        ROUND(COUNT(*) / COUNT(DISTINCT ul.U_ID), 1) as avg_logins
      FROM USER_LOGIN ul
      JOIN USERS u ON ul.U_ID = u.U_ID
      WHERE ul.LOGIN_DATE >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY u.U_KIND
      ORDER BY active_users DESC
      LIMIT 10
    `;

    const result = await this.querySkill.executeQuery(sql, 'Behavior Analysis');
    return result.data;
  }

  /**
   * 페르소나 자동 생성
   */
  _generatePersonas(results) {
    const personas = [];

    // 세그먼트 데이터 기반 페르소나 생성
    const memberTypes = results.segments.member_type?.data || [];

    for (const segment of memberTypes.slice(0, 3)) {
      const behavior = (results.behaviors || []).find(b => b.member_type === segment.segment_value);

      personas.push({
        type: segment.segment_value,
        name: this._getMemberTypeName(segment.segment_value),
        count: segment.count,
        characteristics: [
          `전체 회원 중 ${Math.round(segment.count / (results.segments.member_type?.total || 1) * 100)}%`,
          behavior ? `월 평균 ${behavior.avg_logins || 0}회 로그인` : '로그인 데이터 없음'
        ],
        engagement: behavior?.avg_logins > 10 ? 'High' : behavior?.avg_logins > 3 ? 'Medium' : 'Low'
      });
    }

    return personas;
  }

  /**
   * 회원 유형명 변환
   */
  _getMemberTypeName(code) {
    const names = {
      'DR': '의사',
      'NS': '간호사',
      'PH': '약사',
      'MT': '의료기사',
      'NU': '영양사'
    };
    return names[code] || code;
  }

  /**
   * 요약 생성
   */
  _generateSummary(results) {
    const totalMembers = results.segments.member_type?.total || 0;
    const personaCount = results.personas.length;
    const topPersona = results.personas[0];

    return `총 ${totalMembers.toLocaleString()}명의 활성 회원 분석 완료. ` +
           `${personaCount}개의 주요 페르소나 도출. ` +
           `최대 세그먼트: ${topPersona?.name || 'N/A'} (${topPersona?.count?.toLocaleString() || 0}명)`;
  }
}

export default {
  create: (config = {}) => new ProfilerSkill(config),
  meta: {
    name: 'profiler',
    version: '1.2.0',
    description: '회원 프로필 분석 및 세그먼트 도출',
    category: 'analyst',
    dependencies: ['SkillLoader', 'QuerySkill'],
    status: 'active'
  }
};

export { ProfilerSkill };
