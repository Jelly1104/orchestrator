/**
 * PathValidator - 경로 검증
 *
 * 보안 기능:
 * - Path Traversal 방어 (../ 등)
 * - fs.realpathSync()로 정규화
 * - 허용된 기본 경로 내부인지 확인
 *
 * @see DOCUMENT_MANAGER_ARCHITECTURE.md 섹션 4.1
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';
import { isEnabled } from '../config/feature-flags.js';
import { getAuditLogger } from '../utils/audit-logger.js';

// 허용된 기본 경로 패턴
const ALLOWED_BASE_PATHS = [
  '.claude/',
  'orchestrator/',
  'src/',
];

// 내부 시스템 경로 (항상 허용) - Security Whitelist
const INTERNAL_SYSTEM_PATHS = [
  'orchestrator/skills/',
  'orchestrator/agents/',
  'orchestrator/config/',
  'orchestrator/utils/',
  'orchestrator/state/',
];

// 금지된 경로 패턴
const FORBIDDEN_PATTERNS = [
  /\.\.\//,                    // Path traversal
  /\.\.$/,                     // 끝이 ..
  /^\/etc\//,                  // 시스템 경로
  /^\/usr\//,                  // 시스템 경로
  /^~\//,                      // 홈 디렉토리 접근
  /node_modules/,              // node_modules 직접 접근
  /\.env/,                     // 환경 파일
  /\.git\//,                   // git 내부
];

export class PathValidator {
  constructor(config = {}) {
    this.projectRoot = config.projectRoot || process.cwd();
    this.allowedPaths = config.allowedPaths || ALLOWED_BASE_PATHS;
    this.logger = getAuditLogger();
  }

  /**
   * 경로 검증
   * @param {string} inputPath - 검증할 경로
   * @returns {Object} - { valid, normalized, error }
   */
  validate(inputPath) {
    // 스텁 모드
    if (!isEnabled('SECURITY_PATH_VALIDATION')) {
      this.logger.debug('PATH_VALIDATION_STUB', `[STUB] Would validate: ${inputPath}`);
      return { valid: true, normalized: inputPath, stub: true };
    }

    try {
      // 1. 기본 검사: null, undefined, 빈 문자열
      if (!inputPath || typeof inputPath !== 'string') {
        return this._reject(inputPath, 'INVALID_INPUT', 'Path is empty or invalid');
      }

      // 2. 금지 패턴 검사
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(inputPath)) {
          return this._reject(inputPath, 'FORBIDDEN_PATTERN', `Path matches forbidden pattern: ${pattern}`);
        }
      }

      // 3. 경로 정규화
      const normalized = this._normalize(inputPath);

      // 4. 허용된 기본 경로 내부인지 확인
      const isAllowed = this._isWithinAllowedPaths(normalized);
      if (!isAllowed) {
        return this._reject(inputPath, 'OUTSIDE_ALLOWED_PATHS', 'Path is outside allowed directories');
      }

      // 5. 실제 경로 확인 (존재하는 경로만)
      if (fs.existsSync(path.join(this.projectRoot, normalized))) {
        const realPath = this._getRealPath(normalized);
        if (realPath !== normalized && !this._isWithinAllowedPaths(realPath)) {
          return this._reject(inputPath, 'SYMLINK_ESCAPE', 'Symlink points outside allowed paths');
        }
      }

      this.logger.debug('PATH_VALIDATION_PASS', `Path validated: ${normalized}`);
      return { valid: true, normalized };

    } catch (err) {
      return this._reject(inputPath, 'VALIDATION_ERROR', err.message);
    }
  }

  /**
   * 경로 정규화
   */
  _normalize(inputPath) {
    // 윈도우 경로 → Unix 스타일
    let normalized = inputPath.replace(/\\/g, '/');

    // 선행 슬래시 제거 (상대 경로로 통일)
    normalized = normalized.replace(/^\/+/, '');

    // 중복 슬래시 제거
    normalized = normalized.replace(/\/+/g, '/');

    // 후행 슬래시 제거
    normalized = normalized.replace(/\/+$/, '');

    // path.normalize로 추가 정규화
    normalized = path.normalize(normalized).replace(/\\/g, '/');

    return normalized;
  }

  /**
   * 실제 경로 가져오기 (심볼릭 링크 해결)
   */
  _getRealPath(normalized) {
    try {
      const fullPath = path.join(this.projectRoot, normalized);
      const realFullPath = fs.realpathSync(fullPath);
      return path.relative(this.projectRoot, realFullPath).replace(/\\/g, '/');
    } catch {
      return normalized;
    }
  }

  /**
   * 허용된 경로 내부인지 확인
   */
  _isWithinAllowedPaths(normalized) {
    return this.allowedPaths.some(allowed => {
      const allowedNormalized = allowed.replace(/\/$/, '');
      return normalized.startsWith(allowedNormalized) ||
             normalized.startsWith(allowedNormalized + '/');
    });
  }

  /**
   * 내부 시스템 경로인지 확인 (항상 허용)
   */
  _isInternalSystemPath(normalized) {
    return INTERNAL_SYSTEM_PATHS.some(internal => {
      const internalNormalized = internal.replace(/\/$/, '');
      return normalized.startsWith(internalNormalized) ||
             normalized.startsWith(internalNormalized + '/');
    });
  }

  /**
   * 거부 결과 생성 및 로깅
   */
  _reject(inputPath, errorType, message) {
    this.logger.security('PATH_VALIDATION_FAIL', message, {
      inputPath,
      errorType,
    });

    return {
      valid: false,
      error: errorType,
      message,
      inputPath,
    };
  }

  /**
   * DocumentManager용 특화 검증
   * .claude/* 경로만 허용
   */
  validateDocumentPath(inputPath) {
    const result = this.validate(inputPath);

    if (!result.valid) {
      return result;
    }

    // .claude/ 경로 내부인지 추가 확인
    if (!result.normalized.startsWith('.claude/')) {
      return this._reject(inputPath, 'NOT_DOCUMENT_PATH', 'Path must be within .claude/ directory');
    }

    return result;
  }

  /**
   * 내부 시스템 경로 검증 (Skills, Agents 등)
   * orchestrator/skills/*, orchestrator/agents/* 등 허용
   * @param {string} inputPath - 검증할 경로
   * @returns {Object} - { valid, normalized, error }
   */
  validateInternalPath(inputPath) {
    // 스텁 모드
    if (!isEnabled('SECURITY_PATH_VALIDATION')) {
      this.logger.debug('PATH_VALIDATION_STUB', `[STUB] Would validate internal: ${inputPath}`);
      return { valid: true, normalized: inputPath, stub: true };
    }

    try {
      // 1. 기본 검사
      if (!inputPath || typeof inputPath !== 'string') {
        return this._reject(inputPath, 'INVALID_INPUT', 'Path is empty or invalid');
      }

      // 2. 금지 패턴 검사 (Path Traversal 등)
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(inputPath)) {
          return this._reject(inputPath, 'FORBIDDEN_PATTERN', `Path matches forbidden pattern: ${pattern}`);
        }
      }

      // 3. 경로 정규화
      const normalized = this._normalize(inputPath);

      // 4. 내부 시스템 경로인지 확인 (Whitelist)
      if (this._isInternalSystemPath(normalized)) {
        this.logger.debug('INTERNAL_PATH_VALIDATION_PASS', `Internal system path validated: ${normalized}`);
        return { valid: true, normalized, internal: true };
      }

      // 5. 일반 허용 경로 확인
      if (this._isWithinAllowedPaths(normalized)) {
        this.logger.debug('PATH_VALIDATION_PASS', `Path validated: ${normalized}`);
        return { valid: true, normalized };
      }

      return this._reject(inputPath, 'OUTSIDE_ALLOWED_PATHS', 'Path is outside allowed directories');

    } catch (err) {
      return this._reject(inputPath, 'VALIDATION_ERROR', err.message);
    }
  }
}

// 싱글톤 인스턴스
let instance = null;

export function getPathValidator(config = {}) {
  if (!instance) {
    instance = new PathValidator(config);
  }
  return instance;
}

export { ALLOWED_BASE_PATHS, FORBIDDEN_PATTERNS };
export default PathValidator;
