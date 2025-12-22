/**
 * Sandbox - 샌드박스 강제
 *
 * 보안 기능:
 * - 교차 경로 참조 차단
 * - 등급 간 접근 제어
 * - 권한 상승 방지
 *
 * @see DOCUMENT_MANAGER_ARCHITECTURE.md 섹션 4.1
 * @version 1.0.0
 */

import { isEnabled } from '../config/feature-flags.js';
import { getAuditLogger } from '../utils/audit-logger.js';
import { getPathValidator } from './path-validator.js';

// 문서 등급별 접근 규칙
const ACCESS_RULES = {
  // 소스 등급 → 접근 가능한 대상 등급
  IMMUTABLE: ['IMMUTABLE'],                     // 절대불변은 자기 자신만
  MUTABLE: ['MUTABLE', 'FEATURE'],              // 수정가능은 수정가능 + 피쳐
  FEATURE: ['FEATURE'],                         // 피쳐는 피쳐만
  UNKNOWN: [],                                  // 미분류는 접근 불가
};

// Agent별 접근 권한
const AGENT_PERMISSIONS = {
  LEADER: ['IMMUTABLE', 'MUTABLE', 'FEATURE'],  // Leader는 모든 등급 읽기 가능 (수정은 별도)
  SUBAGENT: ['MUTABLE', 'FEATURE'],             // SubAgent는 IMMUTABLE 직접 수정 불가
  DOC_MANAGE: ['IMMUTABLE', 'MUTABLE', 'FEATURE'], // DocManageAgent는 모든 등급 (승인 후)
};

export class Sandbox {
  constructor(config = {}) {
    this.projectRoot = config.projectRoot || process.cwd();
    this.pathValidator = getPathValidator(config);
    this.logger = getAuditLogger();
  }

  /**
   * 교차 참조 검증
   * @param {string} sourcePath - 요청 발생 경로
   * @param {string} targetPath - 접근 대상 경로
   * @param {string} sourceGrade - 소스 등급
   * @param {string} targetGrade - 대상 등급
   * @returns {Object} - { allowed, reason }
   */
  checkCrossReference(sourcePath, targetPath, sourceGrade, targetGrade) {
    // 스텁 모드
    if (!isEnabled('SECURITY_SANDBOX')) {
      this.logger.debug('SANDBOX_STUB', `[STUB] Would check: ${sourcePath} → ${targetPath}`);
      return { allowed: true, stub: true };
    }

    // 동일 경로는 허용
    if (sourcePath === targetPath) {
      return { allowed: true, reason: 'SAME_PATH' };
    }

    // 등급 기반 접근 검사
    const allowedTargets = ACCESS_RULES[sourceGrade] || [];
    if (!allowedTargets.includes(targetGrade)) {
      this.logger.security('SANDBOX_CROSS_REF_BLOCKED', 'Cross-reference blocked', {
        sourcePath,
        targetPath,
        sourceGrade,
        targetGrade,
      });

      return {
        allowed: false,
        reason: 'GRADE_MISMATCH',
        message: `${sourceGrade} cannot access ${targetGrade}`,
      };
    }

    return { allowed: true, reason: 'GRADE_ALLOWED' };
  }

  /**
   * Agent 접근 권한 검증
   * @param {string} agentType - Agent 유형 (LEADER, SUBAGENT, DOC_MANAGE)
   * @param {string} targetGrade - 대상 문서 등급
   * @param {string} operation - 작업 유형 (READ, WRITE, DELETE)
   * @returns {Object} - { allowed, reason }
   */
  checkAgentAccess(agentType, targetGrade, operation = 'READ') {
    // 스텁 모드
    if (!isEnabled('SECURITY_SANDBOX')) {
      this.logger.debug('SANDBOX_STUB', `[STUB] Would check agent access: ${agentType} → ${targetGrade} (${operation})`);
      return { allowed: true, stub: true };
    }

    const permissions = AGENT_PERMISSIONS[agentType] || [];

    // 읽기 권한 검사
    if (!permissions.includes(targetGrade)) {
      this.logger.security('SANDBOX_AGENT_BLOCKED', 'Agent access blocked', {
        agentType,
        targetGrade,
        operation,
      });

      return {
        allowed: false,
        reason: 'NO_PERMISSION',
        message: `${agentType} cannot ${operation} ${targetGrade} documents`,
      };
    }

    // 쓰기 권한 추가 검사: SubAgent는 IMMUTABLE 직접 수정 불가
    if (operation === 'WRITE' && agentType === 'SUBAGENT' && targetGrade === 'IMMUTABLE') {
      this.logger.security('SANDBOX_WRITE_BLOCKED', 'SubAgent write to IMMUTABLE blocked', {
        agentType,
        targetGrade,
      });

      return {
        allowed: false,
        reason: 'IMMUTABLE_WRITE_DENIED',
        message: 'SubAgent cannot directly write to IMMUTABLE documents',
      };
    }

    return { allowed: true, reason: 'PERMITTED' };
  }

  /**
   * 경로 이탈 검사
   * 심볼릭 링크 등을 통한 샌드박스 이탈 방지
   * @param {string} requestedPath - 요청 경로
   * @returns {Object} - { allowed, realPath, reason }
   */
  checkPathEscape(requestedPath) {
    // 스텁 모드
    if (!isEnabled('SECURITY_SANDBOX')) {
      this.logger.debug('SANDBOX_STUB', `[STUB] Would check path escape: ${requestedPath}`);
      return { allowed: true, realPath: requestedPath, stub: true };
    }

    const pathResult = this.pathValidator.validateDocumentPath(requestedPath);

    if (!pathResult.valid) {
      this.logger.security('SANDBOX_PATH_ESCAPE', 'Path escape attempt detected', {
        requestedPath,
        error: pathResult.error,
      });

      return {
        allowed: false,
        reason: pathResult.error,
        message: pathResult.message,
      };
    }

    return {
      allowed: true,
      realPath: pathResult.normalized,
      reason: 'VALID_PATH',
    };
  }

  /**
   * 전체 샌드박스 검증 (통합)
   * @param {Object} context - 검증 컨텍스트
   * @returns {Object} - { allowed, violations }
   */
  enforce(context) {
    const { agentType, sourcePath, targetPath, sourceGrade, targetGrade, operation } = context;
    const violations = [];

    // 1. 경로 이탈 검사
    if (targetPath) {
      const escapeCheck = this.checkPathEscape(targetPath);
      if (!escapeCheck.allowed) {
        violations.push({
          type: 'PATH_ESCAPE',
          ...escapeCheck,
        });
      }
    }

    // 2. Agent 접근 권한 검사
    if (agentType && targetGrade) {
      const agentCheck = this.checkAgentAccess(agentType, targetGrade, operation);
      if (!agentCheck.allowed) {
        violations.push({
          type: 'AGENT_ACCESS',
          ...agentCheck,
        });
      }
    }

    // 3. 교차 참조 검사
    if (sourcePath && targetPath && sourceGrade && targetGrade) {
      const crossCheck = this.checkCrossReference(sourcePath, targetPath, sourceGrade, targetGrade);
      if (!crossCheck.allowed) {
        violations.push({
          type: 'CROSS_REFERENCE',
          ...crossCheck,
        });
      }
    }

    const allowed = violations.length === 0;

    if (!allowed) {
      this.logger.security('SANDBOX_ENFORCE_FAIL', 'Sandbox enforcement failed', {
        context,
        violations,
      });
    }

    return { allowed, violations };
  }
}

// 싱글톤 인스턴스
let instance = null;

export function getSandbox(config = {}) {
  if (!instance) {
    instance = new Sandbox(config);
  }
  return instance;
}

export { ACCESS_RULES, AGENT_PERMISSIONS };
export default Sandbox;
