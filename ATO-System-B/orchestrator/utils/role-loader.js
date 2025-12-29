/**
 * RoleLoader - Role 정의 JIT(Just-in-Time) 로더
 *
 * ROLES_DEFINITION.md에서 Role별 섹션만 추출하여 토큰 절약
 *
 * JIT Injection 원칙 (ROLES_DEFINITION.md 준수):
 * - Leader → 섹션 2만
 * - Analyzer → 섹션 3만
 * - Designer → 섹션 4만
 * - Implementation Leader → 섹션 5만
 * - Coder → 섹션 6 + HANDOFF
 *
 * @version 1.0.0
 * @since 2025-12-29
 * @see ROLES_DEFINITION.md
 */

import fs from 'fs';
import path from 'path';

// Role-Section 매핑
const ROLE_SECTION_MAP = {
  Leader: 2,
  Analyzer: 3,
  Designer: 4,
  ImplementationLeader: 5,
  ImplLeader: 5,
  Coder: 6,
  Orchestrator: 7,
};

// 섹션 제목 패턴
const SECTION_PATTERNS = {
  2: /^## 2\. Leader/,
  3: /^## 3\. Analyzer/,
  4: /^## 4\. Designer/,
  5: /^## 5\. Implementation Leader/,
  6: /^## 6\. Coder/,
  7: /^## 7\. Orchestrator/,
};

export class RoleLoader {
  constructor(projectRoot) {
    this.projectRoot = projectRoot || process.cwd();
    this.rolesDefPath = path.join(
      this.projectRoot,
      '.claude',
      'workflows',
      'ROLES_DEFINITION.md'
    );
    this.cache = new Map();
  }

  /**
   * 전체 ROLES_DEFINITION.md 파일 로드
   */
  _loadFile() {
    if (!fs.existsSync(this.rolesDefPath)) {
      console.warn(`[RoleLoader] ROLES_DEFINITION.md not found: ${this.rolesDefPath}`);
      return null;
    }
    return fs.readFileSync(this.rolesDefPath, 'utf-8');
  }

  /**
   * 특정 섹션 번호로 콘텐츠 추출
   * @param {number} sectionNum - 섹션 번호 (2-7)
   * @returns {string|null} - 해당 섹션 콘텐츠
   */
  loadSection(sectionNum) {
    // 캐시 확인
    const cacheKey = `section-${sectionNum}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const content = this._loadFile();
    if (!content) {
      return null;
    }

    const lines = content.split('\n');
    let capturing = false;
    let sectionContent = [];
    let currentLevel = 0;

    const startPattern = SECTION_PATTERNS[sectionNum];
    if (!startPattern) {
      console.warn(`[RoleLoader] Unknown section number: ${sectionNum}`);
      return null;
    }

    for (const line of lines) {
      // 섹션 시작 감지
      if (startPattern.test(line)) {
        capturing = true;
        sectionContent.push(line);
        currentLevel = 2; // ## level
        continue;
      }

      // 다음 동일 레벨 섹션 도달 시 중단
      if (capturing && /^## \d+\./.test(line)) {
        break;
      }

      // 콘텐츠 수집
      if (capturing) {
        sectionContent.push(line);
      }
    }

    const result = sectionContent.join('\n').trim();

    // 캐시 저장
    this.cache.set(cacheKey, result);

    return result;
  }

  /**
   * Role 이름으로 섹션 로드
   * @param {string} roleName - Role 이름 (Leader, Analyzer, etc.)
   * @returns {string|null} - 해당 Role의 시스템 프롬프트
   */
  loadRole(roleName) {
    const sectionNum = ROLE_SECTION_MAP[roleName];
    if (!sectionNum) {
      console.warn(`[RoleLoader] Unknown role: ${roleName}`);
      return null;
    }
    return this.loadSection(sectionNum);
  }

  /**
   * 시스템 프롬프트 요약 추출
   * 섹션 내에서 '시스템 프롬프트 요약' 부분만 추출
   * @param {number} sectionNum - 섹션 번호
   * @returns {string|null} - 시스템 프롬프트 코드 블록 내용
   */
  loadSystemPrompt(sectionNum) {
    const section = this.loadSection(sectionNum);
    if (!section) return null;

    // 시스템 프롬프트 요약 섹션 찾기
    const promptMatch = section.match(/### \d+\.\d+ 시스템 프롬프트 요약[\s\S]*?```([\s\S]*?)```/);
    if (promptMatch) {
      return promptMatch[1].trim();
    }

    return null;
  }

  /**
   * 캐시 클리어
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * 전체 Role 정의 로드 (디버깅용)
   */
  loadAll() {
    const result = {};
    for (const [roleName, sectionNum] of Object.entries(ROLE_SECTION_MAP)) {
      result[roleName] = {
        section: sectionNum,
        content: this.loadSection(sectionNum),
        systemPrompt: this.loadSystemPrompt(sectionNum),
      };
    }
    return result;
  }
}

// 싱글톤 인스턴스
let instance = null;

export function getRoleLoader(projectRoot) {
  if (!instance) {
    instance = new RoleLoader(projectRoot);
  }
  return instance;
}

export { ROLE_SECTION_MAP, SECTION_PATTERNS };
export default RoleLoader;
