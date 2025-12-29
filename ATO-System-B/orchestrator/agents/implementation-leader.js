/**
 * ImplementationLeader - Quality Manager (품질 관리자)
 *
 * ROLES_DEFINITION.md 섹션 5 (Implementation Leader) 기반 구현
 *
 * Role 정의:
 * - 역할: Quality Manager (품질 관리자)
 * - Phase: All (Phase A, B, C 모든 산출물 검증)
 * - Tools: ReviewerTool
 * - 권한: 읽기 전용 (산출물 수정 불가)
 * - 보고: PASS → Leader / FAIL → Executor (재작업 지시)
 *
 * 핵심 원칙:
 * - "실행하는 자는 검증하지 않고, 검증하는 자는 실행하지 않는다."
 * - FAIL 판정 시 반드시 Actionable Feedback 제공
 *
 * @version 1.0.0
 * @since 2025-12-29
 * @see ROLES_DEFINITION.md 섹션 5
 */

import path from 'path';
import { RoleLoader } from '../utils/role-loader.js';
import { ReviewerSkill } from '../skills/reviewer/index.js';

// 검증 항목 정의
const VALIDATION_RULES = {
  // Phase A: 분석 결과 검증
  A: {
    name: 'Analysis Validation',
    items: [
      'DATA_INTEGRITY',       // 데이터 정합성
      'SCHEMA_COMPLIANCE',    // 스키마 일치
      'SQL_SAFETY',           // SQL 안전성
    ],
  },

  // Phase B: 설계 문서 검증
  B: {
    name: 'Design Validation',
    items: [
      'PRD_WF_CONSISTENCY',   // PRD ↔ Wireframe 정합성
      'WF_SDD_CONSISTENCY',   // Wireframe ↔ SDD 정합성
      'FEASIBILITY',          // 실현 가능성
    ],
  },

  // Phase C: 구현 코드 검증
  C: {
    name: 'Implementation Validation',
    items: [
      'SECURITY_ENV',         // 보안: Env 보호
      'SECURITY_SQL_INJECTION', // 보안: SQL Injection 방지
      'LOGIC_CORRECTNESS',    // 로직 정확성
      'TEST_COVERAGE',        // 테스트 커버리지
    ],
  },
};

export class ImplementationLeader {
  constructor(config = {}) {
    this.projectRoot = config.projectRoot || process.cwd();
    this.config = config;

    // Role 정의 로더
    this.roleLoader = new RoleLoader(this.projectRoot);

    // Reviewer Skill (검증용)
    this.reviewerSkill = new ReviewerSkill({
      projectRoot: this.projectRoot,
      ...config,
    });

    // Role 메타데이터
    this.role = {
      name: 'ImplementationLeader',
      phase: 'All',
      tools: ['ReviewerTool'],
      section: 5,
    };

    // 재시도 카운터
    this.retryCount = {};
    this.maxRetries = config.maxRetries || 3;
  }

  /**
   * Role 기반 시스템 프롬프트 로드 (JIT)
   */
  async loadRolePrompt() {
    return this.roleLoader.loadSection(this.role.section);
  }

  /**
   * Quality Gate 실행 - 특정 Phase의 산출물 검증
   *
   * @param {string} phase - 검증할 Phase ('A', 'B', 'C')
   * @param {Object} artifacts - 검증할 산출물
   * @param {string} taskId - Task ID
   * @returns {Object} - { pass, feedback, violations }
   */
  async runQualityGate(phase, artifacts, taskId) {
    console.log(`\n🔍 [Implementation Leader] Quality Gate - Phase ${phase}`);

    // JIT 로딩: Role 시스템 프롬프트
    const rolePrompt = await this.loadRolePrompt();

    const validationRules = VALIDATION_RULES[phase];
    if (!validationRules) {
      return {
        pass: false,
        feedback: `Unknown phase: ${phase}`,
        violations: [{ type: 'UNKNOWN_PHASE', message: `Phase '${phase}' is not defined` }],
      };
    }

    console.log(`   📋 Validating: ${validationRules.name}`);
    console.log(`   📝 Items: ${validationRules.items.join(', ')}`);

    // Reviewer Skill로 검증 실행
    const reviewResult = await this.reviewerSkill.review({
      phase,
      artifacts,
      taskId,
      validationItems: validationRules.items,
      rolePrompt,
    });

    // 결과 처리
    const pass = reviewResult.pass !== false && reviewResult.violations?.length === 0;

    if (pass) {
      console.log(`   ✅ Quality Gate PASSED`);
      return {
        pass: true,
        feedback: reviewResult.feedback || 'All validations passed.',
        violations: [],
      };
    } else {
      console.log(`   ❌ Quality Gate FAILED`);

      // Actionable Feedback 생성
      const actionableFeedback = this._generateActionableFeedback(reviewResult);

      return {
        pass: false,
        feedback: actionableFeedback,
        violations: reviewResult.violations || [],
        canRetry: this._canRetry(taskId, phase),
      };
    }
  }

  /**
   * Actionable Feedback 생성
   * FAIL 판정 시 반드시 수정 방법을 포함
   */
  _generateActionableFeedback(reviewResult) {
    const violations = reviewResult.violations || [];
    const feedback = [];

    feedback.push('## Quality Gate FAIL - Actionable Feedback\n');

    for (const violation of violations) {
      feedback.push(`### ${violation.type}`);
      feedback.push(`- **위치**: ${violation.location || 'N/A'}`);
      feedback.push(`- **원인**: ${violation.reason || violation.message}`);
      feedback.push(`- **수정 방법**: ${violation.recommendation || 'Review the code manually'}`);

      if (violation.codeExample) {
        feedback.push('```');
        feedback.push(violation.codeExample);
        feedback.push('```');
      }

      feedback.push('');
    }

    return feedback.join('\n');
  }

  /**
   * 재시도 가능 여부 확인
   */
  _canRetry(taskId, phase) {
    const key = `${taskId}-${phase}`;
    const count = this.retryCount[key] || 0;

    if (count >= this.maxRetries) {
      console.log(`   ⚠️  Max retries reached for ${key}`);
      return false;
    }

    this.retryCount[key] = count + 1;
    return true;
  }

  /**
   * 재시도 카운터 리셋
   */
  resetRetryCount(taskId) {
    for (const key of Object.keys(this.retryCount)) {
      if (key.startsWith(taskId)) {
        delete this.retryCount[key];
      }
    }
  }

  /**
   * 전체 파이프라인 검증 (Phase A → B → C)
   */
  async validatePipeline(artifacts, taskId) {
    const results = {};

    // Phase A 검증
    if (artifacts.analysis) {
      results.A = await this.runQualityGate('A', artifacts.analysis, taskId);
      if (!results.A.pass) {
        return { success: false, failedPhase: 'A', results };
      }
    }

    // Phase B 검증
    if (artifacts.design) {
      results.B = await this.runQualityGate('B', artifacts.design, taskId);
      if (!results.B.pass) {
        return { success: false, failedPhase: 'B', results };
      }
    }

    // Phase C 검증
    if (artifacts.implementation) {
      results.C = await this.runQualityGate('C', artifacts.implementation, taskId);
      if (!results.C.pass) {
        return { success: false, failedPhase: 'C', results };
      }
    }

    return { success: true, results };
  }
}

export default ImplementationLeader;
