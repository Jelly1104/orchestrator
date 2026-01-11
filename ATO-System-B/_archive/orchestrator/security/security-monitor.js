/**
 * SecurityMonitor - 통합 보안 모니터
 *
 * 보안 기능:
 * - 모든 보안 이벤트 중앙 집계
 * - 실시간 이상 감지
 * - KillSwitch 연동
 * - Shadow Checker 관리
 *
 * @see DOCUMENT_MANAGER_ARCHITECTURE.md 섹션 4.3
 * @version 1.0.0
 */

import { isEnabled } from '../config/feature-flags.js';
import { getAuditLogger } from '../utils/audit-logger.js';
import { getKillSwitch } from './kill-switch.js';
import { getOutputSanitizer } from './output-sanitizer.js';

// 이벤트 타입
const EVENT_TYPES = {
  // Security Layer
  INPUT_VALIDATION_FAIL: 'INPUT_VALIDATION_FAIL',
  PATH_VALIDATION_FAIL: 'PATH_VALIDATION_FAIL',
  SANDBOX_VIOLATION: 'SANDBOX_VIOLATION',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Integrity Layer
  RULEBOOK_VIOLATION: 'RULEBOOK_VIOLATION',
  LOCK_ANOMALY: 'LOCK_ANOMALY',
  CHANGELOG_VIOLATION: 'CHANGELOG_VIOLATION',

  // Monitoring Layer
  OUTPUT_BLOCKED: 'OUTPUT_BLOCKED',
  SENSITIVE_DATA_LEAK: 'SENSITIVE_DATA_LEAK',
  SHADOW_CHECK_FAIL: 'SHADOW_CHECK_FAIL',

  // Agent
  AGENT_PERMISSION_DENIED: 'AGENT_PERMISSION_DENIED',
  AGENT_ANOMALY: 'AGENT_ANOMALY',
};

// 이벤트 심각도
const EVENT_SEVERITY = {
  [EVENT_TYPES.INPUT_VALIDATION_FAIL]: 'MEDIUM',
  [EVENT_TYPES.PATH_VALIDATION_FAIL]: 'HIGH',
  [EVENT_TYPES.SANDBOX_VIOLATION]: 'CRITICAL',
  [EVENT_TYPES.RATE_LIMIT_EXCEEDED]: 'MEDIUM',
  [EVENT_TYPES.RULEBOOK_VIOLATION]: 'CRITICAL',
  [EVENT_TYPES.LOCK_ANOMALY]: 'HIGH',
  [EVENT_TYPES.CHANGELOG_VIOLATION]: 'CRITICAL',
  [EVENT_TYPES.OUTPUT_BLOCKED]: 'HIGH',
  [EVENT_TYPES.SENSITIVE_DATA_LEAK]: 'CRITICAL',
  [EVENT_TYPES.SHADOW_CHECK_FAIL]: 'HIGH',
  [EVENT_TYPES.AGENT_PERMISSION_DENIED]: 'MEDIUM',
  [EVENT_TYPES.AGENT_ANOMALY]: 'HIGH',
};

// 임계치 설정
const THRESHOLDS = {
  MEDIUM_PER_MINUTE: 10,      // 분당 MEDIUM 이벤트 임계치
  HIGH_PER_MINUTE: 5,         // 분당 HIGH 이벤트 임계치
  CRITICAL_IMMEDIATE: true,   // CRITICAL은 즉시 처리
};

export class SecurityMonitor {
  constructor(config = {}) {
    this.logger = getAuditLogger();
    this.killSwitch = getKillSwitch();
    this.outputSanitizer = getOutputSanitizer();

    // 이벤트 카운터
    this.eventCounts = {
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };
    this.lastReset = Date.now();
    this.resetInterval = config.resetInterval || 60000; // 1분

    // 이벤트 히스토리 (최근 100개)
    this.eventHistory = [];
    this.maxHistory = config.maxHistory || 100;
  }

  /**
   * 보안 이벤트 보고
   * @param {string} eventType - 이벤트 타입
   * @param {Object} details - 상세 정보
   * @returns {Object} - 처리 결과
   */
  report(eventType, details = {}) {
    // 스텁 모드
    if (!isEnabled('MONITORING_SECURITY_MONITOR')) {
      this.logger.debug('SECURITY_MONITOR_STUB', `[STUB] Would report: ${eventType}`, details);
      return { processed: false, stub: true };
    }

    const severity = EVENT_SEVERITY[eventType] || 'MEDIUM';
    const timestamp = new Date().toISOString();

    // 이벤트 기록
    const event = {
      timestamp,
      eventType,
      severity,
      details,
    };

    this._recordEvent(event);

    // 로깅
    this.logger.security('SECURITY_EVENT', `Security event: ${eventType}`, event);

    // 심각도별 처리
    return this._processEvent(event);
  }

  /**
   * 이벤트 처리
   */
  _processEvent(event) {
    const { eventType, severity, details } = event;

    // 카운터 업데이트
    this._updateCounters(severity);

    // CRITICAL: 즉시 KillSwitch 검토
    if (severity === 'CRITICAL' && THRESHOLDS.CRITICAL_IMMEDIATE) {
      this.logger.security('SECURITY_CRITICAL', `Critical security event: ${eventType}`, details);

      // 특정 CRITICAL 이벤트는 즉시 KillSwitch
      const immediateHaltEvents = [
        EVENT_TYPES.SANDBOX_VIOLATION,
        EVENT_TYPES.RULEBOOK_VIOLATION,
        EVENT_TYPES.CHANGELOG_VIOLATION,
        EVENT_TYPES.SENSITIVE_DATA_LEAK,
      ];

      if (immediateHaltEvents.includes(eventType)) {
        return this.killSwitch.halt(`Critical security event: ${eventType}`, details);
      }
    }

    // HIGH: 임계치 확인
    if (severity === 'HIGH' && this.eventCounts.HIGH >= THRESHOLDS.HIGH_PER_MINUTE) {
      this.logger.security('SECURITY_HIGH_THRESHOLD', 'High severity threshold exceeded');
      return this.killSwitch.reportAnomaly({
        type: 'HIGH_THRESHOLD_EXCEEDED',
        count: this.eventCounts.HIGH,
        threshold: THRESHOLDS.HIGH_PER_MINUTE,
      });
    }

    // MEDIUM: 임계치 확인
    if (severity === 'MEDIUM' && this.eventCounts.MEDIUM >= THRESHOLDS.MEDIUM_PER_MINUTE) {
      this.logger.warn('SECURITY_MEDIUM_THRESHOLD', 'Medium severity threshold exceeded');
    }

    return { processed: true, severity, action: 'logged' };
  }

  /**
   * Shadow Checker 검증
   * Leader가 SubAgent 작업을 재검증
   * @param {Object} subAgentOutput - SubAgent 출력
   * @param {Object} leaderContext - Leader 컨텍스트
   * @returns {Object} - 검증 결과
   */
  shadowCheck(subAgentOutput, leaderContext) {
    // 스텁 모드
    if (!isEnabled('MONITORING_SHADOW_CHECKER')) {
      this.logger.debug('SHADOW_CHECKER_STUB', '[STUB] Would perform shadow check');
      return { valid: true, stub: true };
    }

    const violations = [];

    // 1. 출력 경로 검증
    if (subAgentOutput.outputPath) {
      const pathResult = this.outputSanitizer.validateOutputPath(subAgentOutput.outputPath);
      if (!pathResult.allowed) {
        violations.push({
          type: 'OUTPUT_PATH_INVALID',
          details: pathResult.violations,
        });
      }
    }

    // 2. 출력 내용 검증
    if (subAgentOutput.content) {
      const contentResult = this.outputSanitizer.validateContent(subAgentOutput.content);
      if (!contentResult.safe) {
        violations.push({
          type: 'OUTPUT_CONTENT_UNSAFE',
          details: contentResult.violations,
        });
      }
    }

    // 3. 권한 검증 (Leader 컨텍스트와 비교)
    if (leaderContext.allowedOperations) {
      const requestedOp = subAgentOutput.operation;
      if (!leaderContext.allowedOperations.includes(requestedOp)) {
        violations.push({
          type: 'OPERATION_NOT_ALLOWED',
          requested: requestedOp,
          allowed: leaderContext.allowedOperations,
        });
      }
    }

    const valid = violations.length === 0;

    if (!valid) {
      this.report(EVENT_TYPES.SHADOW_CHECK_FAIL, {
        violations,
        subAgentOutput,
        leaderContext,
      });
    }

    return { valid, violations };
  }

  /**
   * 이벤트 기록
   */
  _recordEvent(event) {
    this.eventHistory.push(event);

    // 히스토리 크기 제한
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.shift();
    }
  }

  /**
   * 카운터 업데이트
   */
  _updateCounters(severity) {
    // 리셋 확인
    if (Date.now() - this.lastReset > this.resetInterval) {
      this.eventCounts = { MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
      this.lastReset = Date.now();
    }

    if (this.eventCounts[severity] !== undefined) {
      this.eventCounts[severity]++;
    }
  }

  /**
   * 현재 상태 조회
   */
  getStatus() {
    return {
      eventCounts: { ...this.eventCounts },
      lastReset: new Date(this.lastReset).toISOString(),
      recentEvents: this.eventHistory.slice(-10),
      thresholds: THRESHOLDS,
    };
  }

  /**
   * 이벤트 히스토리 조회
   * @param {Object} filter - 필터 옵션
   */
  getHistory(filter = {}) {
    let history = [...this.eventHistory];

    if (filter.eventType) {
      history = history.filter(e => e.eventType === filter.eventType);
    }

    if (filter.severity) {
      history = history.filter(e => e.severity === filter.severity);
    }

    if (filter.since) {
      const sinceTime = new Date(filter.since).getTime();
      history = history.filter(e => new Date(e.timestamp).getTime() >= sinceTime);
    }

    if (filter.limit) {
      history = history.slice(-filter.limit);
    }

    return history;
  }

  /**
   * 카운터 리셋 (테스트용)
   */
  reset() {
    this.eventCounts = { MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    this.eventHistory = [];
    this.lastReset = Date.now();
  }
}

// 싱글톤 인스턴스
let instance = null;

export function getSecurityMonitor(config = {}) {
  if (!instance) {
    instance = new SecurityMonitor(config);
  }
  return instance;
}

export { EVENT_TYPES, EVENT_SEVERITY, THRESHOLDS };
export default SecurityMonitor;
