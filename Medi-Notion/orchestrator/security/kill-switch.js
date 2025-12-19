/**
 * KillSwitch - 긴급 시스템 중단
 *
 * 보안 기능:
 * - Critical 이상 위협 시 즉시 중단
 * - 상태 저장 후 안전한 종료
 * - 수동 복구 필요 플래그
 *
 * @see DOCUMENT_MANAGER_ARCHITECTURE.md 섹션 4.3
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';
import { isEnabled } from '../config/feature-flags.js';
import { getAuditLogger } from '../utils/audit-logger.js';

// KillSwitch 상태 파일
const KILLSWITCH_STATE_FILE = '.claude/.killswitch-state.json';

// 트리거 조건
const TRIGGER_CONDITIONS = {
  CHAIN_INTEGRITY_VIOLATION: 'CHANGELOG chain integrity violated',
  SECURITY_BREACH: 'Security breach detected',
  FORCE_LOCK_ABUSE: 'Multiple force lock releases detected',
  CRITICAL_ERROR: 'Critical system error',
  MANUAL_TRIGGER: 'Manual killswitch activation',
  ANOMALY_THRESHOLD: 'Anomaly threshold exceeded',
};

// 심각도 레벨
const SEVERITY = {
  WARNING: 'WARNING',       // 경고만
  HIGH: 'HIGH',             // 로깅 + 알림
  CRITICAL: 'CRITICAL',     // 시스템 중단
};

export class KillSwitch {
  constructor(config = {}) {
    this.projectRoot = config.projectRoot || process.cwd();
    this.stateFile = path.join(this.projectRoot, KILLSWITCH_STATE_FILE);
    this.logger = getAuditLogger();
    this.anomalyCount = 0;
    this.anomalyThreshold = config.anomalyThreshold || 5;
    this.lastAnomalyReset = Date.now();
    this.anomalyResetInterval = config.anomalyResetInterval || 60000; // 1분
  }

  /**
   * KillSwitch 활성화 (시스템 중단)
   * @param {string} reason - 중단 사유
   * @param {Object} context - 추가 컨텍스트
   * @param {string} severity - 심각도
   * @returns {Object} - 결과
   */
  halt(reason, context = {}, severity = SEVERITY.CRITICAL) {
    // 스텁 모드
    if (!isEnabled('MONITORING_KILL_SWITCH')) {
      this.logger.warn('KILLSWITCH_STUB', `[STUB] Would halt: ${reason}`, {
        severity,
        context,
      });
      return { halted: false, stub: true, reason };
    }

    // 상태 저장
    const state = {
      triggeredAt: new Date().toISOString(),
      reason,
      severity,
      context,
      pid: process.pid,
      recoveryRequired: true,
    };

    this._saveState(state);

    // 로깅
    this.logger.security('KILLSWITCH_ACTIVATED', `System halt: ${reason}`, {
      severity,
      context,
      state,
    });

    // 심각도에 따른 동작
    if (severity === SEVERITY.CRITICAL) {
      console.error('\n');
      console.error('='.repeat(60));
      console.error('🛑 KILLSWITCH ACTIVATED - SYSTEM HALT');
      console.error('='.repeat(60));
      console.error(`Reason: ${reason}`);
      console.error(`Time: ${state.triggeredAt}`);
      console.error(`Severity: ${severity}`);
      console.error('\nManual recovery required.');
      console.error('Run: node scripts/recovery.js');
      console.error('='.repeat(60));
      console.error('\n');

      // 실제 프로세스 종료
      process.exit(1);
    }

    return { halted: severity === SEVERITY.CRITICAL, state };
  }

  /**
   * 조건부 KillSwitch (조건 확인 후 결정)
   * @param {string} condition - 트리거 조건
   * @param {Object} context - 컨텍스트
   * @returns {Object} - 결과
   */
  trigger(condition, context = {}) {
    const reason = TRIGGER_CONDITIONS[condition] || condition;

    // 조건별 심각도 매핑
    const severityMap = {
      CHAIN_INTEGRITY_VIOLATION: SEVERITY.CRITICAL,
      SECURITY_BREACH: SEVERITY.CRITICAL,
      FORCE_LOCK_ABUSE: SEVERITY.HIGH,
      CRITICAL_ERROR: SEVERITY.CRITICAL,
      MANUAL_TRIGGER: SEVERITY.CRITICAL,
      ANOMALY_THRESHOLD: SEVERITY.HIGH,
    };

    const severity = severityMap[condition] || SEVERITY.WARNING;

    return this.halt(reason, context, severity);
  }

  /**
   * 이상 징후 보고 (누적 후 임계치 도달 시 트리거)
   * @param {Object} anomaly - 이상 징후 정보
   */
  reportAnomaly(anomaly) {
    // 리셋 간격 확인
    if (Date.now() - this.lastAnomalyReset > this.anomalyResetInterval) {
      this.anomalyCount = 0;
      this.lastAnomalyReset = Date.now();
    }

    this.anomalyCount++;

    this.logger.warn('KILLSWITCH_ANOMALY', `Anomaly reported (${this.anomalyCount}/${this.anomalyThreshold})`, anomaly);

    // 임계치 도달 시 트리거
    if (this.anomalyCount >= this.anomalyThreshold) {
      return this.trigger('ANOMALY_THRESHOLD', {
        anomalyCount: this.anomalyCount,
        lastAnomaly: anomaly,
      });
    }

    return { triggered: false, anomalyCount: this.anomalyCount };
  }

  /**
   * 시스템 중단 상태 확인 (Orchestrator 연동용)
   * @returns {boolean} - 중단 상태 여부
   */
  isHalted() {
    const state = this._loadState();
    return state?.recoveryRequired === true;
  }

  /**
   * 현재 상태 조회 (Orchestrator 연동용)
   * @returns {Object} - 상태 정보
   */
  getStatus() {
    const state = this._loadState();

    if (!state) {
      return {
        halted: false,
        haltReason: null,
        triggeredAt: null,
        recoveryRequired: false,
        anomalyCount: this.anomalyCount,
        anomalyThreshold: this.anomalyThreshold,
      };
    }

    return {
      halted: state.recoveryRequired === true,
      haltReason: state.reason,
      triggeredAt: state.triggeredAt,
      severity: state.severity,
      recoveryRequired: state.recoveryRequired,
      recoveredAt: state.recoveredAt,
      recoveredBy: state.recoveredBy,
      anomalyCount: this.anomalyCount,
      anomalyThreshold: this.anomalyThreshold,
    };
  }

  /**
   * 복구 상태 확인
   * @returns {Object} - 상태
   */
  checkRecoveryNeeded() {
    const state = this._loadState();

    if (!state) {
      return { recoveryNeeded: false };
    }

    return {
      recoveryNeeded: state.recoveryRequired === true,
      state,
    };
  }

  /**
   * 복구 완료 처리
   * @param {string} recoveredBy - 복구 수행자
   * @returns {Object} - 결과
   */
  markRecovered(recoveredBy = 'manual') {
    const state = this._loadState();

    if (!state) {
      return { success: false, message: 'No pending recovery' };
    }

    state.recoveryRequired = false;
    state.recoveredAt = new Date().toISOString();
    state.recoveredBy = recoveredBy;

    this._saveState(state);

    this.logger.info('KILLSWITCH_RECOVERED', 'System recovered from killswitch', state);

    return { success: true, state };
  }

  /**
   * 상태 저장
   */
  _saveState(state) {
    try {
      const dir = path.dirname(this.stateFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err) {
      this.logger.error('KILLSWITCH_STATE_SAVE_ERROR', 'Failed to save state', { error: err.message });
    }
  }

  /**
   * 상태 로드
   */
  _loadState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        return JSON.parse(fs.readFileSync(this.stateFile, 'utf-8'));
      }
    } catch (err) {
      this.logger.error('KILLSWITCH_STATE_LOAD_ERROR', 'Failed to load state', { error: err.message });
    }
    return null;
  }

  /**
   * 상태 초기화
   */
  clearState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        fs.unlinkSync(this.stateFile);
      }
      this.anomalyCount = 0;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

// 싱글톤 인스턴스
let instance = null;

export function getKillSwitch(config = {}) {
  if (!instance) {
    instance = new KillSwitch(config);
  }
  return instance;
}

// 정적 메서드 (빠른 접근용)
export function halt(reason, context = {}) {
  return getKillSwitch().halt(reason, context);
}

export function trigger(condition, context = {}) {
  return getKillSwitch().trigger(condition, context);
}

export { TRIGGER_CONDITIONS, SEVERITY };
export default KillSwitch;
