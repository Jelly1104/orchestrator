/**
 * BaseSkill - 모든 Skill의 추상 부모 클래스
 *
 * Skill 모듈의 표준 인터페이스를 정의하여 일관성 있는 구현을 보장합니다.
 *
 * @version 1.0.0
 * @since 2025-12-26
 * @milestone Milestone 4: Architecture Standardization
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { SkillLoader } from '../skill-loader.js';

/**
 * BaseSkill 추상 클래스
 *
 * 모든 Skill은 이 클래스를 상속받아야 합니다.
 * 표준화된 로깅, 검증, 실행 인터페이스를 제공합니다.
 */
export class BaseSkill {
  /**
   * @param {Object} config - 설정 객체
   * @param {string} config.name - 스킬 이름 (필수)
   * @param {string} config.version - 스킬 버전 (필수)
   * @param {string} config.projectRoot - 프로젝트 루트 경로
   * @param {string[]} config.requiredParams - 필수 파라미터 목록
   */
  constructor(config = {}) {
    // 추상 클래스 직접 인스턴스화 방지
    if (new.target === BaseSkill) {
      throw new Error('BaseSkill은 추상 클래스입니다. 직접 인스턴스화할 수 없습니다.');
    }

    // 필수 속성 검증
    if (!config.name) {
      throw new Error('BaseSkill: name은 필수입니다.');
    }
    if (!config.version) {
      throw new Error('BaseSkill: version은 필수입니다.');
    }

    this.name = config.name;
    this.version = config.version;
    this.projectRoot = config.projectRoot || process.cwd();
    this.requiredParams = config.requiredParams || [];

    // SkillLoader 초기화
    this.skillLoader = null;
    this.skill = null;

    // 로깅 설정
    this.logPrefix = `[${this.name}]`;
    this.debugMode = config.debug || false;
  }

  /**
   * 초기화 - SKILL.md 로드
   * 하위 클래스에서 super.initialize()를 호출해야 합니다.
   *
   * @param {string} skillDir - 스킬 디렉토리 경로
   * @returns {Promise<this>}
   */
  async initialize(skillDir) {
    if (skillDir) {
      this.skillLoader = new SkillLoader(skillDir);
      this.skill = await this.skillLoader.loadSkill(this.name);
    }
    this.log(`Initialized v${this.version}`);
    return this;
  }

  /**
   * 실행 메서드 - 하위 클래스에서 반드시 구현해야 합니다.
   *
   * @param {Object} params - 실행 파라미터
   * @param {Object} context - 실행 컨텍스트 (선택)
   * @returns {Promise<Object>} 실행 결과
   * @abstract
   */
  async execute(params, context = {}) {
    throw new Error(`${this.name}: execute() 메서드를 구현해야 합니다.`);
  }

  /**
   * 파라미터 검증
   *
   * 필수 파라미터가 누락되면 에러를 발생시킵니다.
   *
   * @param {Object} params - 검증할 파라미터
   * @param {string[]} required - 필수 파라미터 목록 (기본: this.requiredParams)
   * @throws {Error} 필수 파라미터 누락 시
   */
  validate(params, required = this.requiredParams) {
    if (!params) {
      throw new Error(`${this.name}: params가 null 또는 undefined입니다.`);
    }

    const missing = required.filter(key => {
      const value = params[key];
      return value === undefined || value === null || value === '';
    });

    if (missing.length > 0) {
      throw new Error(`${this.name}: 필수 파라미터 누락 - ${missing.join(', ')}`);
    }

    this.debug(`Validation passed for: ${required.join(', ')}`);
  }

  /**
   * 표준 로그 출력
   *
   * @param {string} message - 로그 메시지
   * @param {...any} args - 추가 인자
   */
  log(message, ...args) {
    console.log(`${this.logPrefix} ${message}`, ...args);
  }

  /**
   * 경고 로그 출력
   *
   * @param {string} message - 경고 메시지
   * @param {...any} args - 추가 인자
   */
  warn(message, ...args) {
    console.warn(`${this.logPrefix} ⚠️ ${message}`, ...args);
  }

  /**
   * 에러 로그 출력
   *
   * @param {string} message - 에러 메시지
   * @param {...any} args - 추가 인자
   */
  error(message, ...args) {
    console.error(`${this.logPrefix} ❌ ${message}`, ...args);
  }

  /**
   * 디버그 로그 출력 (debugMode가 true일 때만)
   *
   * @param {string} message - 디버그 메시지
   * @param {...any} args - 추가 인자
   */
  debug(message, ...args) {
    if (this.debugMode) {
      console.log(`${this.logPrefix} [DEBUG] ${message}`, ...args);
    }
  }

  /**
   * 성공 로그 출력
   *
   * @param {string} message - 성공 메시지
   * @param {...any} args - 추가 인자
   */
  success(message, ...args) {
    console.log(`${this.logPrefix} ✅ ${message}`, ...args);
  }

  /**
   * 스킬 메타데이터 반환
   *
   * @returns {Object} 메타데이터
   */
  getMetadata() {
    return {
      name: this.name,
      version: this.version,
      projectRoot: this.projectRoot,
      requiredParams: this.requiredParams,
      initialized: !!this.skill
    };
  }

  /**
   * 스킬 상태 반환
   *
   * @returns {Object} 상태 정보
   */
  getStatus() {
    return {
      name: this.name,
      version: this.version,
      ready: !!this.skill,
      timestamp: new Date().toISOString()
    };
  }
}

export default BaseSkill;
