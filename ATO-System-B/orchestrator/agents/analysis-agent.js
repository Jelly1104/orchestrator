/**
 * AnalysisAgent - Role 기반 래퍼 (v2.0.0)
 *
 * ROLES_DEFINITION.md 섹션 3 (Analyzer) 기반 구현
 * 레거시 analysis-agent.legacy.js를 내부적으로 사용
 *
 * Role 정의:
 * - 역할: 데이터 분석가 (Data Analyst)
 * - Phase: Phase A (Analysis)
 * - Tools: QueryTool, ProfilerTool
 * - 권한: docs/cases/{caseId}/analysis/* 쓰기 가능
 * - 제약: SELECT 쿼리만 허용, INSERT/UPDATE/DELETE 금지
 *
 * @version 2.0.0
 * @since 2025-12-29
 * @see ROLES_DEFINITION.md 섹션 3
 */

import { AnalysisAgent as LegacyAnalysisAgent } from './analysis-agent.legacy.js';
import { RoleLoader } from '../utils/role-loader.js';

export class AnalysisAgent {
  constructor(config = {}) {
    this.projectRoot = config.projectRoot || process.cwd();
    this.config = config;

    // 레거시 에이전트 위임
    this.legacyAgent = new LegacyAnalysisAgent(config);

    // Role 정의 로더
    this.roleLoader = new RoleLoader(this.projectRoot);

    // Role 메타데이터
    this.role = {
      name: 'Analyzer',
      phase: 'A',
      tools: ['QueryTool', 'ProfilerTool'],
      section: 3,
    };
  }

  /**
   * Role 기반 시스템 프롬프트 로드 (JIT)
   */
  async loadRolePrompt() {
    return this.roleLoader.loadSection(this.role.section);
  }

  /**
   * 데이터 분석 - 레거시 위임
   */
  async analyze(parsedPRD, taskId, options = {}) {
    // JIT 로딩: Role 시스템 프롬프트 주입
    const rolePrompt = await this.loadRolePrompt();

    return this.legacyAgent.analyze(parsedPRD, taskId, {
      ...options,
      rolePrompt,
      roleMeta: this.role,
    });
  }

  /**
   * 쿼리 생성 - 레거시 위임
   */
  async generateQueries(parsedPRD) {
    return this.legacyAgent.generateQueries(parsedPRD);
  }

  /**
   * 승인된 쿼리 실행 - 레거시 위임
   */
  async executeApprovedQuery(sql, taskId) {
    return this.legacyAgent.executeApprovedQuery(sql, taskId);
  }
}

export default AnalysisAgent;
