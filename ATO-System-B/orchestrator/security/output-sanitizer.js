/**
 * OutputSanitizer - 출력 검증
 *
 * 보안 기능:
 * - 비정상 경로 쓰기 감지
 * - 민감 정보 출력 차단
 * - 실시간 감사
 *
 * @see DOCUMENT_MANAGER_ARCHITECTURE.md 섹션 4.3
 * @version 1.0.0
 */

import path from 'path';
import { isEnabled } from '../config/feature-flags.js';
import { getAuditLogger } from '../utils/audit-logger.js';

// 금지된 출력 경로 패턴
const FORBIDDEN_OUTPUT_PATHS = [
  /^\/etc\//,                    // 시스템 설정
  /^\/usr\//,                    // 시스템 바이너리
  /^\/var\//,                    // 시스템 데이터
  /^\/root\//,                   // root 홈
  /^~\//,                        // 홈 디렉토리 직접 접근
  /node_modules\//,              // node_modules
  /\.git\//,                     // Git 내부
  /\.env/,                       // 환경 파일
  /package\.json$/,              // package.json 직접 수정
  /package-lock\.json$/,         // lock 파일
];

// 허용된 출력 경로 패턴 (화이트리스트)
const ALLOWED_OUTPUT_PATHS = [
  /^\.claude\//,                 // .claude/ 하위
  /^orchestrator\/logs\//,       // 로그 디렉토리
  /^orchestrator\/output\//,     // 출력 디렉토리
  /^src\//,                      // 레거시 src
  /^frontend\//,                 // 프론트엔드 코드
  /^backend\//,                  // 백엔드 코드
  /^docs\/cases\//,              // 케이스 산출물
  /^tests\//,                    // 테스트 코드
];

// 민감 정보 패턴
const SENSITIVE_PATTERNS = [
  { pattern: /sk-ant-[a-zA-Z0-9-]+/g, name: 'Anthropic API Key' },
  { pattern: /sk-[a-zA-Z0-9]{48}/g, name: 'OpenAI API Key' },
  { pattern: /AIza[a-zA-Z0-9_-]{35}/g, name: 'Google API Key' },
  { pattern: /ghp_[a-zA-Z0-9]{36}/g, name: 'GitHub Personal Token' },
  { pattern: /-----BEGIN (RSA |EC |)PRIVATE KEY-----/g, name: 'Private Key' },
  { pattern: /password\s*[:=]\s*["'][^"']{4,}["']/gi, name: 'Password' },
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, name: 'Credit Card' },
];

export class OutputSanitizer {
  constructor(config = {}) {
    this.projectRoot = config.projectRoot || process.cwd();
    this.forbiddenPaths = config.forbiddenPaths || FORBIDDEN_OUTPUT_PATHS;
    this.allowedPaths = config.allowedPaths || ALLOWED_OUTPUT_PATHS;
    this.sensitivePatterns = config.sensitivePatterns || SENSITIVE_PATTERNS;
    this.logger = getAuditLogger();
  }

  /**
   * 출력 경로 검증
   * @param {string} outputPath - 출력 경로
   * @returns {Object} - { allowed, reason, violations }
   */
  validateOutputPath(outputPath) {
    // 스텁 모드
    if (!isEnabled('MONITORING_OUTPUT_SANITIZER')) {
      this.logger.debug('OUTPUT_SANITIZER_STUB', `[STUB] Would validate output path: ${outputPath}`);
      return { allowed: true, stub: true };
    }

    const violations = [];
    const normalized = outputPath.replace(/\\/g, '/').replace(/^\//, '');

    // 1. 금지 경로 체크
    for (const pattern of this.forbiddenPaths) {
      if (pattern.test(normalized) || pattern.test(outputPath)) {
        violations.push({
          type: 'FORBIDDEN_PATH',
          pattern: pattern.toString(),
          message: `Output to forbidden path: ${outputPath}`,
        });
      }
    }

    // 2. 화이트리스트 체크 (금지 경로가 아니더라도 허용 목록에 있어야 함)
    const isAllowed = this.allowedPaths.some(pattern => pattern.test(normalized));
    if (!isAllowed && violations.length === 0) {
      violations.push({
        type: 'NOT_IN_WHITELIST',
        message: `Output path not in allowed list: ${outputPath}`,
      });
    }

    // 3. Path traversal 체크
    if (outputPath.includes('..')) {
      violations.push({
        type: 'PATH_TRAVERSAL',
        message: 'Path traversal detected in output path',
      });
    }

    const allowed = violations.length === 0;

    if (!allowed) {
      this.logger.security('OUTPUT_PATH_BLOCKED', 'Output path validation failed', {
        outputPath,
        violations,
      });
    }

    return { allowed, violations };
  }

  /**
   * 출력 내용 검증 (민감 정보 체크)
   * @param {string} content - 출력 내용
   * @returns {Object} - { safe, violations, sanitized }
   */
  validateContent(content) {
    // 스텁 모드
    if (!isEnabled('MONITORING_OUTPUT_SANITIZER')) {
      this.logger.debug('OUTPUT_SANITIZER_STUB', `[STUB] Would validate content (${content.length} chars)`);
      return { safe: true, stub: true, sanitized: content };
    }

    const violations = [];
    let sanitized = content;

    for (const { pattern, name } of this.sensitivePatterns) {
      // 정규식 재생성 (lastIndex 초기화)
      const regex = new RegExp(pattern.source, pattern.flags);
      const matches = content.match(regex);

      if (matches) {
        violations.push({
          type: 'SENSITIVE_DATA',
          name,
          count: matches.length,
          message: `${name} detected in output (${matches.length} occurrences)`,
        });

        // 마스킹
        sanitized = sanitized.replace(regex, `[${name.toUpperCase()}_MASKED]`);
      }
    }

    const safe = violations.length === 0;

    if (!safe) {
      this.logger.security('OUTPUT_CONTENT_SANITIZED', 'Sensitive data found in output', {
        violationCount: violations.length,
        types: violations.map(v => v.name),
      });
    }

    return { safe, violations, sanitized };
  }

  /**
   * 파일 쓰기 검증 (경로 + 내용)
   * @param {string} outputPath - 출력 경로
   * @param {string} content - 출력 내용
   * @returns {Object} - { allowed, maskedContent, sanitizedContent, violations }
   */
  validateFileWrite(outputPath, content) {
    const pathResult = this.validateOutputPath(outputPath);
    const contentResult = this.validateContent(content);

    const violations = [
      ...pathResult.violations || [],
      ...contentResult.violations || [],
    ];

    // 경로가 허용되어야만 allowed=true (민감정보는 마스킹 후 허용)
    const allowed = pathResult.allowed;
    const maskedContent = contentResult.sanitized || content;

    return {
      allowed,
      maskedContent,                              // subagent.js 호환용
      sanitizedContent: maskedContent,            // 명시적 별칭
      violations,
      pathBlocked: !pathResult.allowed,
      contentSanitized: !contentResult.safe,
    };
  }

  /**
   * 실시간 감사 로그
   * @param {string} operation - 작업 유형
   * @param {Object} details - 상세 정보
   */
  audit(operation, details) {
    this.logger.info('OUTPUT_AUDIT', `Output operation: ${operation}`, details);
  }

  /**
   * 이상 감지 시 SecurityMonitor 알림
   * @param {Object} violation - 위반 정보
   */
  reportAnomaly(violation) {
    this.logger.security('OUTPUT_ANOMALY', 'Output anomaly detected', violation);

    // SecurityMonitor 연동 (Phase C에서 구현)
    // TODO: SecurityMonitor.report(violation);

    return violation;
  }
}

// 싱글톤 인스턴스
let instance = null;

export function getOutputSanitizer(config = {}) {
  if (!instance) {
    instance = new OutputSanitizer(config);
  }
  return instance;
}

export { FORBIDDEN_OUTPUT_PATHS, ALLOWED_OUTPUT_PATHS, SENSITIVE_PATTERNS };
export default OutputSanitizer;
