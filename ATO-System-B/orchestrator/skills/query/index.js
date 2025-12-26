/**
 * QuerySkill - SQL 쿼리 생성 및 데이터 분석 전담
 *
 * AnalysisAgent의 쿼리 생성 기능을 활용하는 전문화된 Skill
 *
 * @version 2.0.0
 * @since 2025-12-19
 * @updated 2025-12-24 - 네이밍 리팩토링 (QueryAgent → QuerySkill)
 * @updated 2025-12-26 - BaseSkill 상속으로 아키텍처 표준화 (Milestone 4)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { AnalysisAgent } from '../../agents/analysis-agent.js';
import { BaseSkill } from '../base/BaseSkill.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class QuerySkill extends BaseSkill {
  constructor(config = {}) {
    // BaseSkill 초기화
    super({
      name: 'QuerySkill',
      version: '2.0.0',
      projectRoot: config.projectRoot,
      requiredParams: ['analysisGoals', 'targetSegment'],
      debug: config.debug
    });

    // AnalysisAgent 인스턴스 (쿼리 실행 담당)
    this.analysisAgent = new AnalysisAgent({
      projectRoot: this.projectRoot,
      ...config
    });
  }

  /**
   * 초기화 - SKILL.md 로드
   */
  async initialize() {
    await super.initialize(path.join(__dirname, '..'));
    this.skill = await this.skillLoader.loadSkill('query');
    return this;
  }

  /**
   * 실행 메서드 (BaseSkill 인터페이스 구현)
   *
   * @param {Object} params - 실행 파라미터
   * @param {string[]} params.analysisGoals - 분석 목표 목록
   * @param {string} params.targetSegment - 대상 세그먼트
   * @param {Object} params.timeRange - 분석 기간 {start, end}
   * @param {string} params.additionalContext - 추가 맥락
   * @param {Object} context - 실행 컨텍스트
   * @returns {Promise<Object>} 실행 결과
   */
  async execute(params, context = {}) {
    this.validate(params);
    return await this.analyze(params);
  }

  /**
   * 분석 목표에 맞는 SQL 쿼리 생성 및 실행
   *
   * @param {Object} input - 입력 데이터
   * @param {string[]} input.analysisGoals - 분석 목표 목록
   * @param {string} input.targetSegment - 대상 세그먼트
   * @param {Object} input.timeRange - 분석 기간 {start, end}
   * @param {string} input.additionalContext - 추가 맥락
   * @returns {Promise<Object>} 쿼리 결과 및 인사이트
   */
  async analyze(input) {
    const { analysisGoals, targetSegment, timeRange, additionalContext } = input;

    this.log('Starting analysis');
    this.log(`  Goals: ${analysisGoals.length} items`);
    this.log(`  Segment: ${targetSegment}`);
    this.log(`  TimeRange: ${timeRange?.start} ~ ${timeRange?.end}`);

    // PRD 형식으로 변환하여 AnalysisAgent 호출
    const prdContent = this._buildPrdFromInput(input);

    try {
      const result = await this.analysisAgent.analyze(prdContent, `query-${Date.now()}`);

      // 결과를 QuerySkill 출력 형식으로 변환
      this.success('Analysis completed');
      return this._formatOutput(result, input);
    } catch (error) {
      this.error(`Analysis failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 단일 쿼리 실행
   *
   * @param {string} sql - SQL 쿼리
   * @param {string} goal - 쿼리 목적
   * @returns {Promise<Object>} 실행 결과
   */
  async executeQuery(sql, goal = 'Custom Query') {
    this.log(`Executing: ${goal}`);

    // 보안 검증
    if (!this._validateQuery(sql)) {
      throw new Error('Query validation failed: Only SELECT queries are allowed');
    }

    const startTime = Date.now();

    try {
      const result = await this.analysisAgent._executeQuery(sql);
      const executionTime = Date.now() - startTime;

      this.success(`Query executed in ${executionTime}ms`);

      return {
        queryId: `Q-${Date.now()}`,
        goal,
        sql,
        rowCount: result.length,
        data: result.slice(0, 100), // 최대 100행 반환
        executionTime: `${executionTime}ms`,
        success: true
      };
    } catch (error) {
      this.error(`Query failed: ${error.message}`);

      return {
        queryId: `Q-${Date.now()}`,
        goal,
        sql,
        rowCount: 0,
        data: [],
        executionTime: '0ms',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 입력을 PRD 형식으로 변환
   */
  _buildPrdFromInput(input) {
    const { analysisGoals, targetSegment, timeRange, additionalContext } = input;

    return `# 데이터 분석 요청

## 분석 목표
${analysisGoals.map((g, i) => `${i + 1}. ${g}`).join('\n')}

## 대상 세그먼트
${targetSegment}

## 분석 기간
- 시작: ${timeRange?.start || '전체'}
- 종료: ${timeRange?.end || '현재'}

## 추가 맥락
${additionalContext || '없음'}

## 출력 요구사항
- SQL 쿼리별 결과 데이터
- 통계적 인사이트
- 발견 사항 요약
`;
  }

  /**
   * 출력 형식 변환
   */
  _formatOutput(analysisResult, input) {
    return {
      queries: analysisResult.queries || [],
      results: analysisResult.results || [],
      insights: analysisResult.insights || [],
      summary: analysisResult.summary || '분석 완료',
      metadata: {
        analysisGoals: input.analysisGoals,
        targetSegment: input.targetSegment,
        timeRange: input.timeRange,
        executedAt: new Date().toISOString()
      }
    };
  }

  /**
   * 쿼리 보안 검증
   */
  _validateQuery(sql) {
    const upperSql = sql.toUpperCase().trim();

    // SELECT만 허용
    if (!upperSql.startsWith('SELECT')) {
      return false;
    }

    // 위험 키워드 차단
    const forbidden = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE'];
    for (const keyword of forbidden) {
      if (upperSql.includes(keyword)) {
        return false;
      }
    }

    return true;
  }
}

export default {
  create: (config = {}) => new QuerySkill(config),
  meta: {
    name: 'QuerySkill',
    version: '2.0.0',
    description: 'SQL 쿼리 생성 및 데이터 분석 전담 (BaseSkill 기반)',
    category: 'analyst',
    dependencies: ['BaseSkill', 'SkillLoader', 'AnalysisAgent'],
    status: 'active'
  }
};

// Legacy alias for backward compatibility
export { QuerySkill as QueryAgent };
