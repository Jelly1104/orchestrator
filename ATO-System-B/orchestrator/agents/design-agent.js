/**
 * DesignAgent - Role 기반 래퍼 (v2.0.0)
 *
 * ROLES_DEFINITION.md 섹션 4 (Designer) 기반 구현
 * 레거시 design-agent.legacy.js를 내부적으로 사용
 *
 * Role 정의:
 * - 역할: Architect & Planner (UX 기획 + 시스템 아키텍트)
 * - Phase: Phase B (Design)
 * - Tools: DesignerTool
 * - 권한: docs/cases/{caseId}/*.md 쓰기 가능
 * - 산출물: IA.md, Wireframe.md, SDD.md
 *
 * @version 2.0.0
 * @since 2025-12-29
 * @see ROLES_DEFINITION.md 섹션 4
 */

import { DesignAgent as LegacyDesignAgent } from './design-agent.legacy.js';
import { RoleLoader } from '../utils/role-loader.js';

export class DesignAgent {
  constructor(config = {}) {
    this.projectRoot = config.projectRoot || process.cwd();
    this.config = config;

    // 레거시 에이전트 위임
    this.legacyAgent = new LegacyDesignAgent(config);

    // Role 정의 로더
    this.roleLoader = new RoleLoader(this.projectRoot);

    // Role 메타데이터
    this.role = {
      name: 'Designer',
      phase: 'B',
      tools: ['DesignerTool'],
      section: 4,
    };
  }

  /**
   * Role 기반 시스템 프롬프트 로드 (JIT)
   */
  async loadRolePrompt() {
    return this.roleLoader.loadSection(this.role.section);
  }

  /**
   * 설계 문서 생성 - 레거시 위임
   */
  async generateDesign(prd, taskId) {
    // JIT 로딩: Role 시스템 프롬프트 주입
    const rolePrompt = await this.loadRolePrompt();

    return this.legacyAgent.generateDesign(prd, taskId, {
      rolePrompt,
      roleMeta: this.role,
    });
  }

  /**
   * IA 문서 생성 - 레거시 위임
   */
  async generateIA(prd) {
    return this.legacyAgent.generateIA(prd);
  }

  /**
   * Wireframe 생성 - 레거시 위임
   */
  async generateWireframe(prd, ia) {
    return this.legacyAgent.generateWireframe(prd, ia);
  }

  /**
   * SDD 생성 - 레거시 위임
   */
  async generateSDD(prd, ia, wireframe) {
    return this.legacyAgent.generateSDD(prd, ia, wireframe);
  }
}

export default DesignAgent;
