/**
 * Security Module - 보안 컴포넌트 통합 내보내기
 *
 * @see DOCUMENT_MANAGER_ARCHITECTURE.md 섹션 4
 * @version 1.0.0
 */

// Phase A: Security Layer
export { InputValidator, getInputValidator, INJECTION_PATTERNS, DANGEROUS_STRINGS, TOKEN_LIMITS } from './input-validator.js';
export { PathValidator, getPathValidator, ALLOWED_BASE_PATHS, FORBIDDEN_PATTERNS } from './path-validator.js';
export { Sandbox, getSandbox, ACCESS_RULES, AGENT_PERMISSIONS } from './sandbox.js';
export { RateLimiter, getRateLimiter, DEFAULT_LIMITS } from './rate-limiter.js';

// Phase C: Monitoring Layer
export { OutputSanitizer, getOutputSanitizer, SENSITIVE_PATTERNS, OUTPUT_PATH_RULES } from './output-sanitizer.js';
export { KillSwitch, getKillSwitch, SEVERITY as KILL_SWITCH_SEVERITY } from './kill-switch.js';
export { SecurityMonitor, getSecurityMonitor, EVENT_TYPES, EVENT_SEVERITY, THRESHOLDS } from './security-monitor.js';
