/**
 * InputValidator - 입력 검증
 *
 * 보안 기능:
 * - Prompt Injection 방어
 * - 정규표현식 기반 필터링
 * - 토큰 길이 제한
 * - 위험 패턴 감지
 *
 * @see DOCUMENT_MANAGER_ARCHITECTURE.md 섹션 4.1
 * @version 1.0.0
 */

import { isEnabled } from '../config/feature-flags.js';
import { getAuditLogger } from '../utils/audit-logger.js';

// Prompt Injection 패턴
const INJECTION_PATTERNS = [
  // 역할 변경 시도
  /ignore\s+(previous|above|all)\s+(instructions?|prompts?|rules?)/gi,
  /forget\s+(everything|all|previous)/gi,
  /disregard\s+(previous|above|all)/gi,
  /you\s+are\s+now\s+a/gi,
  /act\s+as\s+(if\s+you\s+are|a)/gi,
  /pretend\s+(to\s+be|you\s+are)/gi,
  /roleplay\s+as/gi,

  // 시스템 프롬프트 추출 시도
  /what\s+(is|are)\s+your\s+(system\s+)?prompt/gi,
  /show\s+(me\s+)?your\s+(system\s+)?instructions/gi,
  /reveal\s+your\s+(system\s+)?prompt/gi,
  /print\s+(your\s+)?(system\s+)?prompt/gi,

  // 보안 우회 시도
  /bypass\s+(security|filter|restriction)/gi,
  /override\s+(security|filter|restriction)/gi,
  /disable\s+(security|filter|restriction)/gi,

  // 코드 실행 시도
  /eval\s*\(/gi,
  /exec\s*\(/gi,
  /system\s*\(/gi,
  /__import__/gi,
  /subprocess/gi,

  // SQL Injection 패턴
  /(\b(union|select|insert|update|delete|drop|truncate|alter)\b.*\b(from|into|table|database)\b)/gi,
  /--\s*$/gm,                           // SQL 주석
  /;\s*(drop|delete|truncate)/gi,

  // 민감 정보 요청
  /api[_\s]?key/gi,
  /secret[_\s]?key/gi,
  /password/gi,
  /credential/gi,
  /\.env\b/gi,
];

// 위험 문자열 (정확한 매칭)
const DANGEROUS_STRINGS = [
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'GOOGLE_API_KEY',
  'sk-ant-',
  'sk-',
  'AIza',
  'process.env',
  'child_process',
  'fs.writeFileSync',
  'fs.rmSync',
  'rm -rf',
];

// 토큰 제한
const TOKEN_LIMITS = {
  DEFAULT: 100000,          // 기본 10만 토큰
  DOCUMENT_CONTENT: 50000,  // 문서 내용
  CHANGELOG_ENTRY: 5000,    // CHANGELOG 엔트리
  PATH: 500,                // 경로
  QUERY: 10000,             // SQL 쿼리
};

export class InputValidator {
  constructor(config = {}) {
    this.injectionPatterns = config.injectionPatterns || INJECTION_PATTERNS;
    this.dangerousStrings = config.dangerousStrings || DANGEROUS_STRINGS;
    this.tokenLimits = { ...TOKEN_LIMITS, ...config.tokenLimits };
    this.logger = getAuditLogger();
  }

  /**
   * 입력 전체 검증
   * @param {string} input - 검증할 입력
   * @param {string} type - 입력 유형 (DEFAULT, DOCUMENT_CONTENT, etc.)
   * @returns {Object} - { valid, sanitized, violations }
   */
  validate(input, type = 'DEFAULT') {
    // 스텁 모드
    if (!isEnabled('SECURITY_INPUT_VALIDATION')) {
      this.logger.debug('INPUT_VALIDATION_STUB', `[STUB] Would validate input of type: ${type}`);
      return { valid: true, sanitized: input, stub: true };
    }

    const violations = [];

    // 1. null/undefined 검사
    if (input === null || input === undefined) {
      return { valid: false, violations: [{ type: 'NULL_INPUT', message: 'Input is null or undefined' }] };
    }

    // 문자열로 변환
    const inputStr = String(input);

    // 2. 토큰 길이 검사
    const tokenLimit = this.tokenLimits[type] || this.tokenLimits.DEFAULT;
    const estimatedTokens = this._estimateTokens(inputStr);

    if (estimatedTokens > tokenLimit) {
      violations.push({
        type: 'TOKEN_LIMIT_EXCEEDED',
        message: `Input exceeds token limit: ${estimatedTokens}/${tokenLimit}`,
        tokens: estimatedTokens,
        limit: tokenLimit,
      });
    }

    // 3. Prompt Injection 패턴 검사
    const injectionMatches = this._checkInjectionPatterns(inputStr);
    if (injectionMatches.length > 0) {
      violations.push({
        type: 'PROMPT_INJECTION',
        message: 'Potential prompt injection detected',
        patterns: injectionMatches,
      });
    }

    // 4. 위험 문자열 검사
    const dangerousMatches = this._checkDangerousStrings(inputStr);
    if (dangerousMatches.length > 0) {
      violations.push({
        type: 'DANGEROUS_STRING',
        message: 'Dangerous string detected',
        matches: dangerousMatches,
      });
    }

    // 결과
    const valid = violations.length === 0;

    if (!valid) {
      this.logger.security('INPUT_VALIDATION_FAIL', 'Input validation failed', {
        type,
        violationCount: violations.length,
        violations: violations.map(v => v.type),
      });
    }

    return {
      valid,
      sanitized: valid ? inputStr : null,
      violations,
      estimatedTokens,
    };
  }

  /**
   * 경로 입력 검증 (더 엄격)
   */
  validatePath(input) {
    const result = this.validate(input, 'PATH');

    if (!result.valid) {
      return result;
    }

    // 추가 경로 검증
    const pathViolations = [];

    // null bytes
    if (input.includes('\0')) {
      pathViolations.push({ type: 'NULL_BYTE', message: 'Path contains null byte' });
    }

    // 특수 문자
    const invalidChars = /[<>:"|?*]/;
    if (invalidChars.test(input)) {
      pathViolations.push({ type: 'INVALID_CHARS', message: 'Path contains invalid characters' });
    }

    if (pathViolations.length > 0) {
      return {
        valid: false,
        violations: [...result.violations, ...pathViolations],
      };
    }

    return result;
  }

  /**
   * CHANGELOG 엔트리 검증
   */
  validateChangelogEntry(entry) {
    const violations = [];

    // 필수 필드 검사
    const requiredFields = ['content', 'background', 'purpose', 'goal', 'output'];
    for (const field of requiredFields) {
      if (!entry[field] || typeof entry[field] !== 'string') {
        violations.push({
          type: 'MISSING_FIELD',
          message: `Missing or invalid field: ${field}`,
          field,
        });
      }
    }

    // 각 필드 개별 검증
    for (const [field, value] of Object.entries(entry)) {
      if (typeof value === 'string') {
        const fieldResult = this.validate(value, 'CHANGELOG_ENTRY');
        if (!fieldResult.valid) {
          violations.push({
            type: 'FIELD_VALIDATION_FAIL',
            field,
            violations: fieldResult.violations,
          });
        }
      }
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }

  /**
   * 토큰 수 추정 (대략적)
   */
  _estimateTokens(text) {
    // 대략 4글자 = 1토큰 (영어 기준)
    // 한글은 대략 2글자 = 1토큰
    const englishChars = (text.match(/[a-zA-Z0-9\s]/g) || []).length;
    const otherChars = text.length - englishChars;

    return Math.ceil(englishChars / 4 + otherChars / 2);
  }

  /**
   * Prompt Injection 패턴 검사
   */
  _checkInjectionPatterns(input) {
    const matches = [];

    for (const pattern of this.injectionPatterns) {
      // 정규식 재생성 (lastIndex 초기화)
      const regex = new RegExp(pattern.source, pattern.flags);
      const match = input.match(regex);

      if (match) {
        matches.push({
          pattern: pattern.source,
          match: match[0].substring(0, 50), // 매치된 부분 일부만
        });
      }
    }

    return matches;
  }

  /**
   * 위험 문자열 검사
   */
  _checkDangerousStrings(input) {
    const matches = [];
    const inputLower = input.toLowerCase();

    for (const dangerous of this.dangerousStrings) {
      if (inputLower.includes(dangerous.toLowerCase())) {
        matches.push(dangerous);
      }
    }

    return matches;
  }

  /**
   * 입력 새니타이징 (위험 요소 제거/마스킹)
   */
  sanitize(input, options = {}) {
    let sanitized = String(input);

    // API 키 패턴 마스킹
    sanitized = sanitized
      .replace(/sk-ant-[a-zA-Z0-9-]+/g, 'sk-ant-***MASKED***')
      .replace(/sk-[a-zA-Z0-9-]+/g, 'sk-***MASKED***')
      .replace(/AIza[a-zA-Z0-9_-]+/g, 'AIza***MASKED***');

    // 옵션에 따른 추가 처리
    if (options.removeInjection) {
      for (const pattern of this.injectionPatterns) {
        sanitized = sanitized.replace(pattern, '[REMOVED]');
      }
    }

    return sanitized;
  }
}

// 싱글톤 인스턴스
let instance = null;

export function getInputValidator(config = {}) {
  if (!instance) {
    instance = new InputValidator(config);
  }
  return instance;
}

export { INJECTION_PATTERNS, DANGEROUS_STRINGS, TOKEN_LIMITS };
export default InputValidator;
