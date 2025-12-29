/**
 * CodeAgent - Role 기반 래퍼 (v2.0.0)
 *
 * ROLES_DEFINITION.md 섹션 6 (Coder) 기반 구현
 * 레거시 code-agent.legacy.js를 내부적으로 사용
 *
 * Role 정의:
 * - 역할: Developer (개발자)
 * - Phase: Phase C (Implementation)
 * - Tools: CoderTool
 * - 권한: backend/src/*, frontend/src/*, mcp-server/* 쓰기
 * - 제약: .claude/{rules, workflows, context}/* 수정 금지
 *
 * @version 2.0.0
 * @since 2025-12-29
 * @see ROLES_DEFINITION.md 섹션 6
 */

import { CodeAgent as LegacyCodeAgent } from './code-agent.legacy.js';
import { RoleLoader } from '../utils/role-loader.js';

export class CodeAgent {
  constructor(config = {}) {
    this.projectRoot = config.projectRoot || process.cwd();
    this.config = config;

    // 레거시 에이전트 위임
    this.legacyAgent = new LegacyCodeAgent(config);

    // Role 정의 로더
    this.roleLoader = new RoleLoader(this.projectRoot);

    // Role 메타데이터
    this.role = {
      name: 'Coder',
      phase: 'C',
      tools: ['CoderTool'],
      section: 6,
    };
  }

  /**
   * Role 기반 시스템 프롬프트 로드 (JIT)
   */
  async loadRolePrompt() {
    return this.roleLoader.loadSection(this.role.section);
  }

  /**
   * 코드 구현 - 레거시 위임
   */
  async implement(context) {
    // JIT 로딩: Role 시스템 프롬프트 주입
    const rolePrompt = await this.loadRolePrompt();
    const enhancedContext = {
      ...context,
      rolePrompt,
      roleMeta: this.role,
    };

    return this.legacyAgent.implement(enhancedContext);
  }

  /**
   * 코드 수정 - 레거시 위임
   */
  async revise(feedback, currentFiles) {
    return this.legacyAgent.revise(feedback, currentFiles);
  }

  /**
   * 파일 저장 - 레거시 위임
   */
  async saveFiles(files) {
    return this.legacyAgent.saveFiles(files);
  }
}

export default CodeAgent;
