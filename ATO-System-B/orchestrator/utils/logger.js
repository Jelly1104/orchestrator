/**
 * Logger - CLI 출력 통합 관리
 *
 * 로그 레벨:
 * - ERROR: 에러 (항상 출력)
 * - WARN: 경고 (항상 출력)
 * - INFO: 핵심 정보 (기본 출력)
 * - DEBUG: 상세 디버그 (--verbose 시에만)
 *
 * @version 1.0.0
 * @since 2025-12-30
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

class Logger {
  constructor() {
    // 환경변수 또는 CLI 옵션으로 설정
    this.level = process.env.LOG_LEVEL
      ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] || LOG_LEVELS.INFO
      : LOG_LEVELS.INFO;

    this.verbose = process.argv.includes('--verbose') || process.argv.includes('-v');
    if (this.verbose) {
      this.level = LOG_LEVELS.DEBUG;
    }
  }

  /**
   * 에러 출력 (항상)
   */
  error(message, ...args) {
    console.error(`❌ ${message}`, ...args);
  }

  /**
   * 경고 출력 (항상)
   */
  warn(message, ...args) {
    if (this.level >= LOG_LEVELS.WARN) {
      console.warn(`⚠️  ${message}`, ...args);
    }
  }

  /**
   * 핵심 정보 (기본)
   */
  info(message, ...args) {
    if (this.level >= LOG_LEVELS.INFO) {
      console.log(message, ...args);
    }
  }

  /**
   * 디버그 (--verbose 시에만)
   */
  debug(message, ...args) {
    if (this.level >= LOG_LEVELS.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Phase 시작 로그
   */
  phase(phaseName, description = '') {
    const divider = '━'.repeat(43);
    console.log(`\n${divider}`);
    console.log(`${phaseName}${description ? ` ${description}` : ''}`);
    console.log(divider);
  }

  /**
   * Phase 완료 로그
   */
  phaseComplete(phaseName, status = 'success', detail = '') {
    const icon = status === 'success' ? '✅' : status === 'partial' ? '⚠️' : '❌';
    console.log(`\n${icon} ${phaseName} 완료${detail ? `: ${detail}` : ''}`);
  }

  /**
   * 단계 진행 로그 (간결)
   */
  step(icon, message) {
    console.log(`${icon} ${message}`);
  }

  /**
   * 섹션 구분선
   */
  divider(char = '─', length = 60) {
    console.log(char.repeat(length));
  }

  /**
   * 성공 메시지
   */
  success(message) {
    console.log(`✅ ${message}`);
  }

  /**
   * Raw 출력 (포맷팅 없이)
   */
  raw(message) {
    console.log(message);
  }
}

// 싱글턴 인스턴스
const logger = new Logger();

export { logger, Logger, LOG_LEVELS };
export default logger;
