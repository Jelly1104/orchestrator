/**
 * EnvProtector - 환경변수 보호 유틸리티
 *
 * 보안 기능 (Phase E):
 * - API 키 마스킹
 * - .env 파일 접근 제한
 * - 런타임 환경변수 검증
 *
 * @see DOCUMENT_MANAGER_ARCHITECTURE.md 섹션 4.4
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';
import { isEnabled } from '../config/feature-flags.js';
import { getAuditLogger } from './audit-logger.js';

// 보호 대상 환경변수 패턴
const PROTECTED_ENV_PATTERNS = [
  /^ANTHROPIC_API_KEY$/,
  /^OPENAI_API_KEY$/,
  /^GOOGLE_API_KEY$/,
  /^GEMINI_API_KEY$/,
  /^NOTION_API_KEY$/,
  /^NOTION_TOKEN$/,
  /^DB_PASSWORD$/,
  /^DATABASE_URL$/,
  /^JWT_SECRET$/,
  /^SECRET_KEY$/,
  /.*_SECRET$/,
  /.*_TOKEN$/,
  /.*_API_KEY$/,
];

// 마스킹 전략
const MASKING_STRATEGY = {
  FULL: 'full',           // 전체 마스킹: ***
  PARTIAL: 'partial',     // 부분 마스킹: sk-***abc
  PREFIX_ONLY: 'prefix',  // 접두사만: sk-ant-***
};

export class EnvProtector {
  constructor(config = {}) {
    this.logger = getAuditLogger();
    this.strategy = config.strategy || MASKING_STRATEGY.PARTIAL;
    this.envDir = config.envDir || process.cwd();
  }

  /**
   * 환경변수가 보호 대상인지 확인
   * @param {string} key - 환경변수 이름
   * @returns {boolean}
   */
  isProtected(key) {
    return PROTECTED_ENV_PATTERNS.some(pattern => pattern.test(key));
  }

  /**
   * 환경변수 값 마스킹
   * @param {string} value - 원본 값
   * @param {string} strategy - 마스킹 전략
   * @returns {string} - 마스킹된 값
   */
  maskValue(value, strategy = this.strategy) {
    if (!value || typeof value !== 'string') return '***';

    switch (strategy) {
      case MASKING_STRATEGY.FULL:
        return '***';

      case MASKING_STRATEGY.PREFIX_ONLY:
        // 접두사만 표시 (예: sk-ant-***)
        const dashIndex = value.indexOf('-');
        if (dashIndex > 0 && dashIndex < 10) {
          const prefix = value.substring(0, value.indexOf('-', dashIndex + 1) + 1 || dashIndex + 1);
          return prefix + '***';
        }
        return value.substring(0, 3) + '***';

      case MASKING_STRATEGY.PARTIAL:
      default:
        // 앞 3자리, 뒤 3자리만 표시
        if (value.length <= 10) {
          return '***';
        }
        return value.substring(0, 3) + '***' + value.substring(value.length - 3);
    }
  }

  /**
   * 객체 내 환경변수 마스킹
   * @param {Object} obj - 마스킹할 객체
   * @returns {Object} - 마스킹된 객체
   */
  maskObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;

    const masked = {};

    for (const [key, value] of Object.entries(obj)) {
      if (this.isProtected(key)) {
        masked[key] = this.maskValue(value);
      } else if (typeof value === 'object' && value !== null) {
        masked[key] = this.maskObject(value);
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }

  /**
   * 문자열 내 API 키 패턴 마스킹
   * @param {string} str - 원본 문자열
   * @returns {string} - 마스킹된 문자열
   */
  maskString(str) {
    if (!str || typeof str !== 'string') return str;

    let masked = str;

    // Anthropic API 키
    masked = masked.replace(/sk-ant-[a-zA-Z0-9-]+/g, 'sk-ant-***');

    // OpenAI API 키
    masked = masked.replace(/sk-[a-zA-Z0-9]{20,}/g, 'sk-***');

    // 일반 API 키 패턴
    masked = masked.replace(/"(api[_-]?key|apiKey|API_KEY)"\s*:\s*"[^"]+"/gi, '"$1": "***"');
    masked = masked.replace(/"(secret|SECRET|token|TOKEN)"\s*:\s*"[^"]+"/gi, '"$1": "***"');

    // Bearer 토큰
    masked = masked.replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer ***');

    return masked;
  }

  /**
   * 안전한 환경변수 로드
   * @param {string} key - 환경변수 이름
   * @returns {string|undefined} - 환경변수 값
   */
  getEnv(key) {
    const value = process.env[key];

    // 로깅 (마스킹된 값으로)
    if (value && this.isProtected(key)) {
      this.logger.debug('ENV_ACCESS', `Accessed protected env: ${key}`, {
        key,
        masked: this.maskValue(value),
      });
    }

    return value;
  }

  /**
   * 필수 환경변수 검증
   * @param {string[]} requiredKeys - 필수 키 목록
   * @returns {Object} - { valid: boolean, missing: string[] }
   */
  validateRequired(requiredKeys) {
    const missing = [];

    for (const key of requiredKeys) {
      if (!process.env[key]) {
        missing.push(key);
      }
    }

    if (missing.length > 0) {
      this.logger.warn('ENV_VALIDATION_FAIL', 'Missing required environment variables', {
        missing,
      });
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * .env 파일 경로 검증
   * @param {string} envPath - .env 파일 경로
   * @returns {Object} - { valid: boolean, reason?: string }
   */
  validateEnvPath(envPath) {
    // 스텁 모드
    if (!isEnabled('NOTION_HMAC_VERIFY')) {
      return { valid: true, stub: true };
    }

    const resolved = path.resolve(envPath);
    const allowedDir = path.resolve(this.envDir);

    // 허용된 디렉토리 내부인지 확인
    if (!resolved.startsWith(allowedDir)) {
      this.logger.security('ENV_PATH_VIOLATION', 'Attempted access outside allowed directory', {
        path: envPath,
        allowedDir,
      });
      return { valid: false, reason: 'Path outside allowed directory' };
    }

    // .env 파일 존재 확인
    if (!fs.existsSync(resolved)) {
      return { valid: false, reason: 'File not found' };
    }

    return { valid: true };
  }

  /**
   * 환경변수 덤프 (마스킹 적용)
   * @returns {Object} - 마스킹된 환경변수 객체
   */
  getDumpMasked() {
    const dump = {};

    for (const [key, value] of Object.entries(process.env)) {
      if (this.isProtected(key)) {
        dump[key] = this.maskValue(value);
      } else {
        dump[key] = value;
      }
    }

    return dump;
  }
}

// 싱글톤 인스턴스
let instance = null;

export function getEnvProtector(config = {}) {
  if (!instance) {
    instance = new EnvProtector(config);
  }
  return instance;
}

export { PROTECTED_ENV_PATTERNS, MASKING_STRATEGY };
export default EnvProtector;
