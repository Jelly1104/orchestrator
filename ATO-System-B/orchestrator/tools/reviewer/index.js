/**
 * ReviewerSkill - 산출물 품질 검증 및 PRD 정합성 확인
 *
 * output-validator.js 기능을 확장하여 종합적인 품질 검증 수행
 *
 * @version 2.0.0
 * @since 2025-12-19
 * @updated 2025-12-24 - 네이밍 리팩토링 (ReviewAgent → ReviewerSkill)
 * @updated 2025-12-26 - BaseTool 상속으로 아키텍처 표준화 (Milestone 4)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { BaseTool } from '../base/BaseTool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 검증 가중치
const WEIGHTS = {
  syntax: 0.10,
  semantic: 0.15,
  prd_match: 0.25,
  prd_scope: 0.10,  // PRD 범위 검증
  cross_ref: 0.40
};

// 통과 기준
const PASS_CRITERIA = {
  minScore: 80,
  maxHighIssues: 0,
  minPrdMatchRate: 0.80,
  maxFeaturesPerIteration: 50  // 단일 iteration 최대 기능 수
};

/**
 * HITL 트리거 조건 (TO-BE 아키텍처)
 * ROLE_ARCHITECTURE.md 기반
 */
const HITL_TRIGGERS = {
  // Phase별 트리거 조건
  PHASE_A: {
    emptyResult: true,        // 결과 0행
    timeout: 30,              // 30초 타임아웃
    schemaViolation: true     // 스키마 불일치
  },
  PHASE_B: {
    sddSchemaViolation: true, // SDD-Schema 불일치
    iaWfMismatch: true        // IA-WF 정합성 실패
  },
  PHASE_C: {
    testFail: true,           // 테스트 FAIL
    securityViolation: true,  // 보안 위반
    maxRetries: 3             // 재시도 ≥3회
  }
};

export class ReviewerTool extends BaseTool {
  constructor(config = {}) {
    // BaseTool 초기화
    super({
      name: 'ReviewerTool',
      version: '2.0.0',
      projectRoot: config.projectRoot,
      requiredParams: ['outputs'],
      debug: config.debug
    });
  }

  /**
   * 초기화 - TOOL.md 로드
   */
  async initialize() {
    await super.initialize(path.join(__dirname, '..'));
    // toolLoader는 BaseTool.initialize()에서 이미 설정됨
    // this.tool은 BaseTool에서 loadTool(this.name)으로 로드됨
    return this;
  }

  /**
   * 실행 메서드 (BaseTool 인터페이스 구현)
   *
   * @param {Object} params - 실행 파라미터
   * @param {Object} params.prd - PRD 정보
   * @param {Object} params.outputs - 산출물 (IA, Wireframe, SDD 등)
   * @param {string[]} params.validationScope - 검증 범위
   * @returns {Promise<Object>} 검증 결과
   */
  async execute(params) {
    // outputs 필수 검증
    if (!params?.outputs) {
      throw new Error('ReviewerTool: outputs는 필수입니다.');
    }
    return await this.review(params);
  }

  /**
   * 산출물 종합 검증
   *
   * @param {Object} input - 검증 대상
   * @param {Object} input.prd - PRD 정보
   * @param {Object} input.outputs - 산출물 (IA, Wireframe, SDD 등)
   * @param {string[]} input.validationScope - 검증 범위
   * @returns {Promise<Object>} 검증 결과
   */
  async review(input) {
    const { prd, outputs, validationScope = ['syntax', 'semantic', 'prd_match', 'prd_scope', 'cross_ref'] } = input;

    this.debug('Starting validation');
    this.debug(`  Scope: ${validationScope.join(', ')}`);

    const details = {};
    const issues = [];

    // 1. Syntax 검증
    if (validationScope.includes('syntax')) {
      details.syntax = await this._validateSyntax(outputs);
      issues.push(...details.syntax.items.filter(i => i.status === 'FAIL').map(i => ({
        severity: 'LOW',
        category: 'syntax',
        description: i.note,
        location: i.item,
        recommendation: '문서 형식을 수정하세요'
      })));
    }

    // 2. Semantic 검증
    if (validationScope.includes('semantic')) {
      details.semantic = await this._validateSemantic(outputs);
      issues.push(...details.semantic.items.filter(i => i.status === 'FAIL').map(i => ({
        severity: i.critical ? 'HIGH' : 'MEDIUM',
        category: 'semantic',
        description: i.note,
        location: i.item,
        recommendation: '논리적 완결성을 보완하세요'
      })));
    }

    // 3. PRD 매칭 검증
    if (validationScope.includes('prd_match')) {
      details.prd_match = await this._validatePrdMatch(prd, outputs);
      issues.push(...details.prd_match.unmatchedItems.map(i => ({
        severity: 'HIGH',
        category: 'prd_match',
        description: `PRD 요구사항 미충족: ${i.requirement}`,
        location: i.location || 'N/A',
        recommendation: i.reason
      })));
    }

    // 4. Cross-reference 검증
    if (validationScope.includes('cross_ref')) {
      details.cross_ref = await this._validateCrossRef(outputs);
      issues.push(...details.cross_ref.items.filter(i => i.status === 'FAIL').map(i => ({
        severity: 'MEDIUM',
        category: 'cross_ref',
        description: i.note,
        location: i.item,
        recommendation: '산출물 간 일관성을 확인하세요'
      })));
    }

    // 5. PRD Scope 검증 (기능 수 제한)
    if (validationScope.includes('prd_scope') || validationScope.includes('structure')) {
      details.prd_scope = await this._validatePrdScope(prd);
      if (!details.prd_scope.passed) {
        issues.push({
          severity: 'HIGH',
          category: 'prd_scope',
          description: details.prd_scope.message,
          location: 'PRD',
          recommendation: 'PRD를 여러 Phase로 분할하거나 핵심 기능만 선별해주세요'
        });
      }
    }

    // 점수 계산
    const score = this._calculateScore(details);
    const highIssues = issues.filter(i => i.severity === 'HIGH').length;
    const prdMatchRate = details.prd_match?.matchedRequirements / details.prd_match?.totalRequirements || 1;

    // 판정
    const passed = score >= PASS_CRITERIA.minScore &&
                   highIssues <= PASS_CRITERIA.maxHighIssues &&
                   prdMatchRate >= PASS_CRITERIA.minPrdMatchRate;

    // 결과 로깅 (debug 모드에서만)
    if (passed) {
      this.debug(`Validation passed with score ${Math.round(score)}`);
    } else {
      this.debug(`Validation failed with score ${Math.round(score)}`);
    }

    // HITL 필요 여부 판단 (TO-BE 아키텍처)
    const hitlContext = this._determineHITLRequired(passed, score, issues, details, input.phase);

    return {
      passed,
      score: Math.round(score),
      summary: this._generateSummary(passed, score, highIssues, prdMatchRate),
      details,
      issues,
      recommendations: this._generateRecommendations(issues),
      // TO-BE: HITL 관련 필드 추가
      hitlRequired: hitlContext.required,
      hitlTrigger: hitlContext.trigger,
      hitl3WayOptions: hitlContext.options,
      metadata: {
        validationScope,
        validatedAt: new Date().toISOString(),
        criteria: PASS_CRITERIA
      }
    };
  }

  /**
   * HITL 필요 여부 판단 (TO-BE 아키텍처)
   *
   * ImpLeader 자동 검증 결과 기반:
   * - PASS → HITL 없이 다음 Phase 진행
   * - FAIL → HITL 트리거 + 3-way 옵션 제공
   *
   * @param {boolean} passed - 검증 통과 여부
   * @param {number} score - 검증 점수
   * @param {Array} issues - 이슈 목록
   * @param {Object} details - 상세 검증 결과
   * @param {string} phase - 현재 Phase (A, B, C)
   * @returns {Object} { required, trigger, options }
   */
  _determineHITLRequired(passed, score, issues, details, phase = 'B') {
    // 자동 검증 PASS → HITL 불필요
    if (passed) {
      return {
        required: false,
        trigger: null,
        options: null
      };
    }

    // 자동 검증 FAIL → HITL 트리거 결정
    const highIssues = issues.filter(i => i.severity === 'HIGH');
    const trigger = this._identifyHITLTrigger(phase, score, issues, details);

    // 3-way 옵션 생성
    const options = this._generate3WayOptions(phase, trigger, issues);

    return {
      required: true,
      trigger,
      options
    };
  }

  /**
   * HITL 트리거 식별
   */
  _identifyHITLTrigger(phase, score, issues, details) {
    const triggers = [];

    // Phase별 트리거 체크
    switch (phase) {
      case 'A':
        if (details.syntax?.score === 0) triggers.push('EMPTY_RESULT');
        if (issues.some(i => i.category === 'schema')) triggers.push('SCHEMA_VIOLATION');
        break;

      case 'B':
        if (details.cross_ref?.score < 70) triggers.push('IA_WF_MISMATCH');
        if (issues.some(i => i.category === 'semantic' && i.severity === 'HIGH')) {
          triggers.push('SDD_SCHEMA_VIOLATION');
        }
        break;

      case 'C':
        if (issues.some(i => i.category === 'test')) triggers.push('TEST_FAIL');
        if (issues.some(i => i.category === 'security')) triggers.push('SECURITY_VIOLATION');
        break;
    }

    // 공통: 점수 미달
    if (score < PASS_CRITERIA.minScore) {
      triggers.push('SCORE_BELOW_THRESHOLD');
    }

    // 공통: HIGH 이슈 존재
    if (issues.filter(i => i.severity === 'HIGH').length > 0) {
      triggers.push('HIGH_SEVERITY_ISSUE');
    }

    return triggers.length > 0 ? triggers : ['GENERAL_FAIL'];
  }

  /**
   * 3-way 옵션 생성
   */
  _generate3WayOptions(phase, triggers, issues) {
    const phaseLabels = {
      'A': { action: '쿼리', rework: '재분석' },
      'B': { action: '설계', rework: '재설계' },
      'C': { action: '코드', rework: '수동 수정' }
    };

    const labels = phaseLabels[phase] || phaseLabels['B'];

    return {
      EXCEPTION_APPROVAL: {
        label: '예외 승인',
        description: `이번 건만 예외 허용, 다음 Phase 진행`,
        useCase: '긴급 배포, 알려진 제약'
      },
      RULE_OVERRIDE: {
        label: '규칙 수정 요청',
        description: `규칙 자체 수정 요청 → 관리자 검토 필요`,
        useCase: '규칙이 현실과 맞지 않을 때'
      },
      REJECT: {
        label: `${labels.rework}`,
        description: `해당 Phase 재작업 지시 (${labels.action} 수정)`,
        useCase: '품질 미달, 재수정 필요'
      }
    };
  }

  /**
   * Syntax 검증 - 문서 형식 및 구조
   */
  async _validateSyntax(outputs) {
    const items = [];
    let totalScore = 0;
    let count = 0;

    for (const [name, content] of Object.entries(outputs)) {
      if (typeof content !== 'string') continue;

      // 마크다운 헤더 검증
      const hasHeader = /^#\s+.+/m.test(content);
      items.push({
        item: `${name} - 헤더 구조`,
        status: hasHeader ? 'PASS' : 'FAIL',
        note: hasHeader ? '' : '최상위 헤더(#)가 없습니다'
      });
      totalScore += hasHeader ? 100 : 0;
      count++;

      // 필수 섹션 검증 (IA, Wireframe, SDD)
      if (name === 'IA') {
        const hasNav = /##.*navigation|구조|structure/i.test(content);
        items.push({
          item: `${name} - 네비게이션 섹션`,
          status: hasNav ? 'PASS' : 'FAIL',
          note: hasNav ? '' : '네비게이션/구조 섹션이 없습니다'
        });
        totalScore += hasNav ? 100 : 0;
        count++;
      }

      if (name === 'Wireframe') {
        const hasAscii = /```[\s\S]*?```/m.test(content) || /\+[-+]+\+/.test(content);
        items.push({
          item: `${name} - UI 스케치`,
          status: hasAscii ? 'PASS' : 'FAIL',
          note: hasAscii ? '' : 'ASCII 스케치 또는 코드 블록이 없습니다'
        });
        totalScore += hasAscii ? 100 : 0;
        count++;
      }

      if (name === 'SDD') {
        const hasApi = /api|endpoint|route/i.test(content);
        items.push({
          item: `${name} - API 섹션`,
          status: hasApi ? 'PASS' : 'FAIL',
          note: hasApi ? '' : 'API/엔드포인트 정의가 없습니다'
        });
        totalScore += hasApi ? 100 : 0;
        count++;
      }
    }

    return {
      passed: totalScore / count >= 80,
      score: count > 0 ? Math.round(totalScore / count) : 100,
      items
    };
  }

  /**
   * Semantic 검증 - 논리적 완결성
   */
  async _validateSemantic(outputs) {
    const items = [];
    let totalScore = 0;
    let count = 0;

    for (const [name, content] of Object.entries(outputs)) {
      if (typeof content !== 'string') continue;

      // TODO 없음 검증
      const hasTodo = /TODO|FIXME|TBD/i.test(content);
      items.push({
        item: `${name} - 완결성`,
        status: !hasTodo ? 'PASS' : 'FAIL',
        note: hasTodo ? 'TODO/FIXME가 남아있습니다' : '',
        critical: hasTodo
      });
      totalScore += !hasTodo ? 100 : 0;
      count++;

      // 모호한 표현 검증
      const vaguePatterns = /추후|나중에|예정|미정|TBD|확인 필요/;
      const hasVague = vaguePatterns.test(content);
      items.push({
        item: `${name} - 명확성`,
        status: !hasVague ? 'PASS' : 'FAIL',
        note: hasVague ? '모호한 표현이 있습니다' : ''
      });
      totalScore += !hasVague ? 100 : 50;
      count++;
    }

    return {
      passed: totalScore / count >= 80,
      score: count > 0 ? Math.round(totalScore / count) : 100,
      items
    };
  }

  /**
   * PRD 매칭 검증
   */
  async _validatePrdMatch(prd, outputs) {
    if (!prd || !prd.requirements) {
      return {
        passed: true,
        score: 100,
        matchedRequirements: 0,
        totalRequirements: 0,
        unmatchedItems: []
      };
    }

    const allOutputContent = Object.values(outputs)
      .filter(c => typeof c === 'string')
      .join('\n');

    const requirements = prd.requirements || [];
    const unmatchedItems = [];
    let matched = 0;

    for (const req of requirements) {
      const reqText = typeof req === 'string' ? req : req.description || req.title || '';
      const keywords = reqText.split(/\s+/).filter(w => w.length > 2);

      // 키워드 매칭 (50% 이상)
      const matchCount = keywords.filter(k =>
        allOutputContent.toLowerCase().includes(k.toLowerCase())
      ).length;

      if (matchCount >= keywords.length * 0.5) {
        matched++;
      } else {
        unmatchedItems.push({
          requirement: reqText.substring(0, 50) + '...',
          reason: '산출물에 관련 내용이 부족합니다',
          location: 'N/A'
        });
      }
    }

    const rate = requirements.length > 0 ? matched / requirements.length : 1;

    return {
      passed: rate >= PASS_CRITERIA.minPrdMatchRate,
      score: Math.round(rate * 100),
      matchedRequirements: matched,
      totalRequirements: requirements.length,
      unmatchedItems
    };
  }

  /**
   * PRD Scope 검증 - 기능 수 제한 (Case 05: 초대형 PRD)
   */
  async _validatePrdScope(prd) {
    if (!prd || !prd.content) {
      return {
        passed: true,
        score: 100,
        featureCount: 0,
        maxFeatures: PASS_CRITERIA.maxFeaturesPerIteration,
        message: 'PRD 내용 없음'
      };
    }

    const content = prd.content;

    // 체크리스트 항목 카운트 (- [ ] 패턴)
    const checklistMatches = content.match(/- \[ \]/g) || [];
    const featureCount = checklistMatches.length;

    // 섹션 헤더에서 "N개 기능" 패턴 추출
    const sectionCounts = [];
    const sectionRegex = /###\s+\d+\.\d+\s+(.+?)\s*\((\d+)개\s*기능\)/g;
    let match;
    while ((match = sectionRegex.exec(content)) !== null) {
      sectionCounts.push({
        name: match[1],
        count: parseInt(match[2])
      });
    }

    const isOversized = featureCount > PASS_CRITERIA.maxFeaturesPerIteration;
    const score = isOversized
      ? Math.max(0, 100 - (featureCount - PASS_CRITERIA.maxFeaturesPerIteration) * 2)
      : 100;

    return {
      passed: !isOversized,
      score: Math.round(score),
      featureCount,
      maxFeatures: PASS_CRITERIA.maxFeaturesPerIteration,
      sections: sectionCounts,
      message: isOversized
        ? `요구사항 과다 (${featureCount}개 기능 > 최대 ${PASS_CRITERIA.maxFeaturesPerIteration}개)`
        : `기능 수 적정 (${featureCount}개)`
    };
  }

  /**
   * Cross-reference 검증 - 산출물 간 정합성
   */
  async _validateCrossRef(outputs) {
    const items = [];
    let totalScore = 0;
    let count = 0;

    const ia = outputs.IA || '';
    const wireframe = outputs.Wireframe || '';
    const sdd = outputs.SDD || '';

    // IA → Wireframe 정합성
    if (ia && wireframe) {
      const iaScreens = ia.match(/##\s*\d+\.\s*(.+)/g) || [];
      const wireframeScreens = wireframe.toLowerCase();

      let matched = 0;
      for (const screen of iaScreens) {
        const screenName = screen.replace(/##\s*\d+\.\s*/, '').toLowerCase();
        if (wireframeScreens.includes(screenName.substring(0, 5))) {
          matched++;
        }
      }

      const rate = iaScreens.length > 0 ? matched / iaScreens.length : 1;
      items.push({
        item: 'IA ↔ Wireframe 정합성',
        status: rate >= 0.7 ? 'PASS' : 'FAIL',
        note: rate < 0.7 ? `IA 화면 중 ${Math.round((1-rate)*100)}%가 Wireframe에 없음` : ''
      });
      totalScore += rate * 100;
      count++;
    }

    // Wireframe → SDD 정합성
    if (wireframe && sdd) {
      const components = wireframe.match(/\[([^\]]+)\]/g) || [];
      const sddLower = sdd.toLowerCase();

      let matched = 0;
      for (const comp of components.slice(0, 10)) {
        const compName = comp.replace(/[\[\]]/g, '').toLowerCase();
        if (sddLower.includes(compName.substring(0, 4))) {
          matched++;
        }
      }

      const checkCount = Math.min(components.length, 10);
      const rate = checkCount > 0 ? matched / checkCount : 1;
      items.push({
        item: 'Wireframe ↔ SDD 정합성',
        status: rate >= 0.5 ? 'PASS' : 'FAIL',
        note: rate < 0.5 ? '일부 컴포넌트가 SDD에 정의되지 않음' : ''
      });
      totalScore += rate * 100;
      count++;
    }

    return {
      passed: count === 0 || totalScore / count >= 70,
      score: count > 0 ? Math.round(totalScore / count) : 100,
      items
    };
  }

  /**
   * 가중 점수 계산
   */
  _calculateScore(details) {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [key, weight] of Object.entries(WEIGHTS)) {
      if (details[key] && typeof details[key].score === 'number') {
        weightedSum += details[key].score * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * 요약 생성
   */
  _generateSummary(passed, score, highIssues, prdMatchRate) {
    if (passed) {
      return `✅ 검증 통과 (${score}점). PRD 매칭률 ${Math.round(prdMatchRate*100)}%`;
    }

    const reasons = [];
    if (score < PASS_CRITERIA.minScore) reasons.push(`점수 미달 (${score}/${PASS_CRITERIA.minScore})`);
    if (highIssues > 0) reasons.push(`심각 이슈 ${highIssues}건`);
    if (prdMatchRate < PASS_CRITERIA.minPrdMatchRate) reasons.push(`PRD 매칭 미달`);

    return `❌ 검증 실패. 사유: ${reasons.join(', ')}`;
  }

  /**
   * 개선 권고 생성
   */
  _generateRecommendations(issues) {
    const recs = new Set();

    const highIssues = issues.filter(i => i.severity === 'HIGH');
    if (highIssues.length > 0) {
      recs.add('HIGH 심각도 이슈를 우선 해결하세요');
    }

    const prdIssues = issues.filter(i => i.category === 'prd_match');
    if (prdIssues.length > 0) {
      recs.add('PRD 요구사항을 다시 검토하고 누락된 항목을 반영하세요');
    }

    const crossRefIssues = issues.filter(i => i.category === 'cross_ref');
    if (crossRefIssues.length > 0) {
      recs.add('IA, Wireframe, SDD 간 일관성을 확인하세요');
    }

    return Array.from(recs);
  }
}

export default {
  create: (config = {}) => new ReviewerSkill(config),
  meta: {
    name: 'ReviewerTool',
    version: '2.0.0',
    description: '산출물 품질 검증 및 PRD 정합성 확인 (BaseTool 기반)',
    category: 'guardian',
    dependencies: ['BaseTool', 'SkillLoader'],
    status: 'active'
  }
};

// 하위 호환 alias
export const ReviewerSkill = ReviewerTool;
