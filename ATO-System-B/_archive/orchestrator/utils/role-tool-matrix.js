/**
 * RoleToolMatrix - Role별 Tool 사용 권한 매트릭스
 *
 * ROLES_DEFINITION.md 기반 Tool 권한 엄격 제한
 *
 * 황금률: "실행하는 자는 검증하지 않고, 검증하는 자는 실행하지 않는다."
 *
 * @version 1.0.0
 * @since 2025-12-29
 * @see ROLES_DEFINITION.md 섹션 1 (Role 정의 요약)
 */

// Role별 허용 Tool 목록
export const ROLE_TOOL_MATRIX = {
  // Leader: Tool 없음 (기계적 스위칭만)
  Leader: {
    allowedTools: [],
    description: 'PRD 분석, 파이프라인 전략 수립, 목표 하달, HITL 최종 승인',
    phase: 'All',
  },

  // Analyzer: Query, Profiler Tool
  Analyzer: {
    allowedTools: ['QueryTool', 'ProfilerTool'],
    description: '데이터 분석 및 전략 근거 마련',
    phase: 'A',
  },

  // Designer: Designer Tool
  Designer: {
    allowedTools: ['DesignerTool'],
    description: 'UX 기획(IA/WF) + 기술 설계(SDD)',
    phase: 'B',
  },

  // Implementation Leader: Reviewer Tool만
  ImplementationLeader: {
    allowedTools: ['ReviewerTool'],
    description: 'Quality Gate 관리, 각 Phase 산출물 검증',
    phase: 'All',
  },

  // Coder: Coder Tool
  Coder: {
    allowedTools: ['CoderTool'],
    description: 'HANDOFF 기반 코드 구현, Self-Check',
    phase: 'C',
  },

  // Orchestrator: DocSync, Viewer (LLM 호출 없이 직접 실행)
  Orchestrator: {
    allowedTools: ['DocSyncTool', 'ViewerTool'],
    description: '기계적 파이프라인 스위칭 + 보안 게이트웨이',
    phase: 'All',
    isClass: true, // JavaScript 클래스 (NOT LLM Role)
  },
};

/**
 * Role이 특정 Tool을 사용할 수 있는지 검증
 * @param {string} roleName - Role 이름
 * @param {string} toolName - Tool 이름
 * @returns {boolean} - 허용 여부
 */
export function isToolAllowed(roleName, toolName) {
  const roleConfig = ROLE_TOOL_MATRIX[roleName];
  if (!roleConfig) {
    console.warn(`[RoleToolMatrix] Unknown role: ${roleName}`);
    return false;
  }
  return roleConfig.allowedTools.includes(toolName);
}

/**
 * Role의 허용된 Tool 목록 반환
 * @param {string} roleName - Role 이름
 * @returns {string[]} - 허용된 Tool 목록
 */
export function getAllowedTools(roleName) {
  const roleConfig = ROLE_TOOL_MATRIX[roleName];
  if (!roleConfig) {
    return [];
  }
  return [...roleConfig.allowedTools];
}

/**
 * Tool 사용 권한 검증 및 로깅
 * @param {string} roleName - Role 이름
 * @param {string} toolName - Tool 이름
 * @returns {{ allowed: boolean, reason: string }}
 */
export function validateToolUsage(roleName, toolName) {
  const roleConfig = ROLE_TOOL_MATRIX[roleName];

  if (!roleConfig) {
    return {
      allowed: false,
      reason: `Unknown role: ${roleName}`,
    };
  }

  if (!roleConfig.allowedTools.includes(toolName)) {
    return {
      allowed: false,
      reason: `Role '${roleName}' is not allowed to use '${toolName}'. Allowed tools: [${roleConfig.allowedTools.join(', ') || 'none'}]`,
    };
  }

  return {
    allowed: true,
    reason: `Tool '${toolName}' is allowed for role '${roleName}'`,
  };
}

/**
 * LLM API 호출 시 tools 배열 생성
 * Role에 따라 허용된 Tool만 포함
 * @param {string} roleName - Role 이름
 * @param {Object} toolDefinitions - 전체 Tool 정의 객체
 * @returns {Array} - 필터링된 tools 배열
 */
export function filterToolsForRole(roleName, toolDefinitions = {}) {
  const allowedTools = getAllowedTools(roleName);

  if (allowedTools.length === 0) {
    return []; // Leader는 빈 배열
  }

  return Object.entries(toolDefinitions)
    .filter(([toolName]) => allowedTools.includes(toolName))
    .map(([, toolDef]) => toolDef);
}

/**
 * Role이 LLM Role인지 확인
 * @param {string} roleName - Role 이름
 * @returns {boolean} - LLM Role 여부
 */
export function isLLMRole(roleName) {
  const roleConfig = ROLE_TOOL_MATRIX[roleName];
  if (!roleConfig) {
    return false;
  }
  return !roleConfig.isClass;
}

export default {
  ROLE_TOOL_MATRIX,
  isToolAllowed,
  getAllowedTools,
  validateToolUsage,
  filterToolsForRole,
  isLLMRole,
};
