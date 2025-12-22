/**
 * Utils Module - 유틸리티 통합 내보내기
 *
 * 보안 기능 (v3.2.0 P2)
 * Phase E: 외부 연동 추가 (v3.3.0)
 */

export { AuditLogger, getAuditLogger, SECURITY_EVENTS, LOG_LEVELS } from './audit-logger.js';
export { RulebookValidator, PROTECTED_FILES } from './rulebook-validator.js';
export { HandoffValidator, REQUIRED_SECTIONS, DANGEROUS_PATTERNS } from './handoff-validator.js';
export { DocumentManager, getDocumentManager, DOC_GRADES, PATH_PATTERNS, CHANGE_RESULTS } from './document-manager.js';

// Phase E: 외부 연동
export { EnvProtector, getEnvProtector, PROTECTED_ENV_PATTERNS, MASKING_STRATEGY } from './env-protector.js';
export { NotionSync, getNotionSync, NOTION_CONFIG, ALLOWED_ENDPOINTS } from './notion-sync.js';
