/**
 * BaseAgent - Agent 추상 클래스
 *
 * 모든 Agent가 상속해야 하는 기본 클래스입니다.
 * 공통 로깅, 초기화, 실행 인터페이스를 제공합니다.
 *
 * @version 1.0.0
 * @since 2025-12-26
 */

export class BaseAgent {
  constructor(config = {}) {
    this.name = config.name || 'BaseAgent';
    this.role = config.role || 'Agent';
    this.contextMode = config.contextMode || 'Default';
    this.debug = config.debug || false;
    this.projectRoot = config.projectRoot || process.cwd();
  }

  /**
   * 로그 출력 (Agent 이름 포함)
   */
  log(message) {
    console.log(`[${this.name}] ${message}`);
  }

  /**
   * 경고 로그
   */
  warn(message) {
    console.warn(`[${this.name}] ⚠️ ${message}`);
  }

  /**
   * 에러 로그
   */
  error(message) {
    console.error(`[${this.name}] ❌ ${message}`);
  }

  /**
   * 성공 로그
   */
  success(message) {
    console.log(`[${this.name}] ✅ ${message}`);
  }

  /**
   * 디버그 로그 (debug 모드에서만 출력)
   */
  debugLog(message) {
    if (this.debug) {
      console.log(`[${this.name}:DEBUG] ${message}`);
    }
  }

  /**
   * 초기화 (하위 클래스에서 오버라이드)
   */
  async initialize() {
    this.log(`Initializing ${this.name} (${this.role})...`);
    return this;
  }

  /**
   * 실행 (하위 클래스에서 반드시 구현)
   * @abstract
   */
  async execute(context = {}) {
    throw new Error(`[${this.name}] execute() must be implemented by subclass`);
  }

  /**
   * Agent 메타데이터 반환
   */
  getMeta() {
    return {
      name: this.name,
      role: this.role,
      contextMode: this.contextMode
    };
  }
}

export default BaseAgent;
