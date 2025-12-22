/**
 * AuditLogger - 감사 로깅 시스템
 *
 * 보안 기능 (v3.2.0 P2):
 * - 보안 이벤트 추적
 * - 민감 정보 마스킹
 * - 구조화된 로그 포맷
 */

import fs from 'fs';
import path from 'path';

// 로그 레벨
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  SECURITY: 4,
};

// 보안 이벤트 타입
const SECURITY_EVENTS = {
  PROMPT_INJECTION_DETECTED: 'PROMPT_INJECTION_DETECTED',
  PATH_TRAVERSAL_DETECTED: 'PATH_TRAVERSAL_DETECTED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_INPUT: 'INVALID_INPUT',
  API_KEY_EXPOSURE_PREVENTED: 'API_KEY_EXPOSURE_PREVENTED',
  PROVIDER_FALLBACK: 'PROVIDER_FALLBACK',
  PROTECTED_PATH_ACCESS: 'PROTECTED_PATH_ACCESS',
  DANGEROUS_CODE_PATTERN: 'DANGEROUS_CODE_PATTERN',
};

export class AuditLogger {
  constructor(config = {}) {
    this.logDir = config.logDir || './orchestrator/logs/audit';
    this.minLevel = LOG_LEVELS[config.minLevel?.toUpperCase()] || LOG_LEVELS.INFO;
    this.consoleOutput = config.consoleOutput !== false;
    this.fileOutput = config.fileOutput !== false;

    // 로그 디렉토리 생성
    if (this.fileOutput && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    // 현재 세션 ID
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 민감 정보 마스킹
   */
  maskSensitiveData(data) {
    if (typeof data !== 'string') {
      data = JSON.stringify(data);
    }

    return data
      // API 키 패턴
      .replace(/sk-ant-[a-zA-Z0-9-]+/g, 'sk-ant-***MASKED***')
      .replace(/sk-[a-zA-Z0-9-]+/g, 'sk-***MASKED***')
      .replace(/AIza[a-zA-Z0-9_-]+/g, 'AIza***MASKED***')
      // 환경변수
      .replace(/"(apiKey|api_key|API_KEY|password|PASSWORD|secret|SECRET)"\s*:\s*"[^"]+"/gi, '"$1": "***MASKED***"')
      // 이메일 (부분 마스킹)
      .replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, (match, local, domain) => {
        const maskedLocal = local.length > 2 ? local[0] + '***' + local[local.length - 1] : '***';
        return `${maskedLocal}@${domain}`;
      });
  }

  /**
   * 로그 엔트리 생성
   */
  createLogEntry(level, event, message, context = {}) {
    return {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      level,
      event,
      message,
      context: this.maskSensitiveData(context),
    };
  }

  /**
   * 로그 기록
   */
  log(level, event, message, context = {}) {
    const levelNum = LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;

    if (levelNum < this.minLevel) {
      return;
    }

    const entry = this.createLogEntry(level.toUpperCase(), event, message, context);

    // 콘솔 출력
    if (this.consoleOutput) {
      const prefix = level === 'SECURITY' ? '🔒' : level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : 'ℹ️';
      console.log(`${prefix} [${entry.timestamp}] [${event}] ${message}`);
    }

    // 파일 기록
    if (this.fileOutput) {
      this.writeToFile(entry);
    }

    return entry;
  }

  /**
   * 파일에 로그 기록
   */
  writeToFile(entry) {
    const date = new Date().toISOString().split('T')[0];
    const fileName = `audit-${date}.jsonl`;
    const filePath = path.join(this.logDir, fileName);

    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(filePath, line, 'utf-8');
  }

  // ========== 편의 메서드 ==========

  debug(event, message, context = {}) {
    return this.log('DEBUG', event, message, context);
  }

  info(event, message, context = {}) {
    return this.log('INFO', event, message, context);
  }

  warn(event, message, context = {}) {
    return this.log('WARN', event, message, context);
  }

  error(event, message, context = {}) {
    return this.log('ERROR', event, message, context);
  }

  // ========== 보안 이벤트 전용 ==========

  security(event, message, context = {}) {
    return this.log('SECURITY', event, message, {
      ...context,
      securityEvent: true,
    });
  }

  /**
   * 프롬프트 인젝션 감지 로깅
   */
  logPromptInjection(pattern, input, source) {
    return this.security(
      SECURITY_EVENTS.PROMPT_INJECTION_DETECTED,
      `Potential prompt injection detected: ${pattern}`,
      { pattern, inputPreview: input.substring(0, 100), source }
    );
  }

  /**
   * Path Traversal 감지 로깅
   */
  logPathTraversal(path, source) {
    return this.security(
      SECURITY_EVENTS.PATH_TRAVERSAL_DETECTED,
      `Path traversal attempt detected`,
      { path, source }
    );
  }

  /**
   * Rate Limit 초과 로깅
   */
  logRateLimitExceeded(count, limit, window) {
    return this.security(
      SECURITY_EVENTS.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded: ${count}/${limit} in ${window}`,
      { count, limit, window }
    );
  }

  /**
   * Provider Fallback 로깅
   */
  logProviderFallback(from, to, reason) {
    return this.info(
      SECURITY_EVENTS.PROVIDER_FALLBACK,
      `Provider fallback: ${from} → ${to}`,
      { from, to, reason }
    );
  }

  /**
   * 보호된 경로 접근 시도 로깅
   */
  logProtectedPathAccess(path, source) {
    return this.security(
      SECURITY_EVENTS.PROTECTED_PATH_ACCESS,
      `Attempted access to protected path`,
      { path, source }
    );
  }

  /**
   * 위험한 코드 패턴 감지 로깅
   */
  logDangerousCodePattern(pattern, filePath) {
    return this.warn(
      SECURITY_EVENTS.DANGEROUS_CODE_PATTERN,
      `Potentially dangerous code pattern detected`,
      { pattern: pattern.toString(), filePath }
    );
  }
}

// 싱글톤 인스턴스
let instance = null;

export function getAuditLogger(config = {}) {
  if (!instance) {
    instance = new AuditLogger(config);
  }
  return instance;
}

export { SECURITY_EVENTS, LOG_LEVELS };
export default AuditLogger;
