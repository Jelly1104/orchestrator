/**
 * ReviewerSkill - 산출물 품질 검증 및 PRD 정합성 확인
 *
 * output-validator.js 기능을 확장하여 종합적인 품질 검증 수행
 *
 * @version 1.2.0
 * @since 2025-12-19
 * @updated 2025-12-24 - 네이밍 리팩토링 (ReviewAgent → ReviewerSkill)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { SkillLoader } from '../skill-loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 검증 가중치
const WEIGHTS = {
  syntax: 0.10,
  semantic: 0.15,
  prd_match: 0.30,
  cross_ref: 0.45
};

// 통과 기준
const PASS_CRITERIA = {
  minScore: 80,
  maxHighIssues: 0,
  minPrdMatchRate: 0.80
};

export class ReviewerSkill {
  constructor(config = {}) {
    this.projectRoot = config.projectRoot || process.cwd();

    // SkillLoader로 SKILL.md 로드
    this.skillLoader = new SkillLoader(path.join(__dirname, '..'));
    this.skill = null;
  }

  /**
   * 초기화 - SKILL.md 로드
   */
  async initialize() {
    this.skill = await this.skillLoader.loadSkill('reviewer');
    console.log('[ReviewerSkill] Initialized with SKILL.md');
    return this;
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
  async validate(input) {
    const { prd, outputs, validationScope = ['syntax', 'semantic', 'prd_match', 'cross_ref'] } = input;

    console.log('[ReviewerSkill] Starting validation');
    console.log(`  Scope: ${validationScope.join(', ')}`);

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

    // 점수 계산
    const score = this._calculateScore(details);
    const highIssues = issues.filter(i => i.severity === 'HIGH').length;
    const prdMatchRate = details.prd_match?.matchedRequirements / details.prd_match?.totalRequirements || 1;

    // 판정
    const passed = score >= PASS_CRITERIA.minScore &&
                   highIssues <= PASS_CRITERIA.maxHighIssues &&
                   prdMatchRate >= PASS_CRITERIA.minPrdMatchRate;

    return {
      passed,
      score: Math.round(score),
      summary: this._generateSummary(passed, score, highIssues, prdMatchRate),
      details,
      issues,
      recommendations: this._generateRecommendations(issues),
      metadata: {
        validationScope,
        validatedAt: new Date().toISOString(),
        criteria: PASS_CRITERIA
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
      // IA의 화면이 Wireframe에 반영되었는지
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
      // Wireframe의 컴포넌트가 SDD에 정의되었는지
      const components = wireframe.match(/\[([^\]]+)\]/g) || [];
      const sddLower = sdd.toLowerCase();

      let matched = 0;
      for (const comp of components.slice(0, 10)) { // 최대 10개만 검사
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
      if (details[key]) {
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
    name: 'reviewer',
    version: '1.2.0',
    description: '산출물 품질 검증 및 PRD 정합성 확인',
    category: 'guardian',
    dependencies: ['SkillLoader'],
    status: 'active'
  }
};
