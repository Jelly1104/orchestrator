/**
 * Feature Flags - 피쳐 플래그 설정
 *
 * 스캐폴딩 전략에 따라 각 기능을 점진적으로 활성화합니다.
 * @see DOCUMENT_MANAGER_ARCHITECTURE.md 섹션 11.2
 *
 * @version 1.2.0 - Phase HITL 추가 (v3.5.0)
 */

export const FEATURES = {
  // ===== Phase A: Security Layer ===== (v3.4.0 활성화)
  SECURITY_INPUT_VALIDATION: true,     // 입력 검증 활성화
  SECURITY_PATH_VALIDATION: true,      // 경로 검증 활성화
  SECURITY_SANDBOX: true,              // 샌드박스 강제
  SECURITY_RATE_LIMIT: true,           // 요청 빈도 제한

  // ===== Phase B: Integrity Layer ===== (v3.4.0 활성화)
  INTEGRITY_RULEBOOK_CHECK: true,      // 룰북 해시 검증 (기존)
  INTEGRITY_MEMORY_LOCK: true,         // 원자적 잠금 (구현됨)
  INTEGRITY_DOC_SANITIZE: true,        // 문서 새니타이징
  INTEGRITY_CHANGELOG_VALIDATE: true,  // CHANGELOG 입력 검증

  // ===== Phase C: Monitoring Layer ===== (v3.4.0 활성화)
  MONITORING_OUTPUT_SANITIZER: true,   // 출력 경로 검증
  MONITORING_KILL_SWITCH: true,        // 긴급 중단
  MONITORING_SHADOW_CHECKER: true,     // Leader→Sub 이중 검증
  MONITORING_SECURITY_MONITOR: true,   // 통합 모니터

  // ===== Phase D: Agent Integration =====
  AGENT_DOC_MANAGE: false,             // DocManageAgent 활성화
  AGENT_SHADOW_CHECK: false,           // Shadow Checker 연동

  // ===== Phase HITL: Human-in-the-Loop ===== (v3.5.0)
  HITL_ENABLED: true,                  // HITL 체크포인트 활성화
  HITL_AUTO_APPROVE_DESIGN: false,     // 설계 승인 자동 통과 (false = 수동 승인 필요)
  HITL_AUTO_APPROVE_QUERY: false,      // 위험 쿼리 자동 통과 (false = 수동 승인 필요)
  HITL_GRACEFUL_EXIT: true,            // HITL pause 시 프로세스 종료
  HITL_RESUME_ENABLED: true,           // Resume 로직 활성화

  // ===== Phase E: External =====
  NOTION_SYNC_ENABLED: false,          // Notion 동기화
  NOTION_HMAC_VERIFY: false,           // HMAC 스냅샷 검증
};

/**
 * 피쳐 활성화 여부 확인
 * @param {string} feature - 피쳐 이름
 * @returns {boolean}
 */
export function isEnabled(feature) {
  return FEATURES[feature] === true;
}

/**
 * Phase별 일괄 활성화
 * @param {string} phase - Phase 이름 (A, B, C, D, E)
 */
export function enablePhase(phase) {
  const phaseMap = {
    A: ['SECURITY_INPUT_VALIDATION', 'SECURITY_PATH_VALIDATION', 'SECURITY_SANDBOX', 'SECURITY_RATE_LIMIT'],
    B: ['INTEGRITY_DOC_SANITIZE', 'INTEGRITY_CHANGELOG_VALIDATE'],
    C: ['MONITORING_OUTPUT_SANITIZER', 'MONITORING_KILL_SWITCH', 'MONITORING_SHADOW_CHECKER', 'MONITORING_SECURITY_MONITOR'],
    D: ['AGENT_DOC_MANAGE', 'AGENT_SHADOW_CHECK'],
    HITL: ['HITL_ENABLED', 'HITL_GRACEFUL_EXIT', 'HITL_RESUME_ENABLED'],
    E: ['NOTION_SYNC_ENABLED', 'NOTION_HMAC_VERIFY'],
  };

  const features = phaseMap[phase];
  if (features) {
    features.forEach(f => {
      FEATURES[f] = true;
    });
    console.log(`[FeatureFlags] Phase ${phase} enabled:`, features);
  }
}

/**
 * Phase별 일괄 비활성화
 * @param {string} phase - Phase 이름 (A, B, C, D, E)
 */
export function disablePhase(phase) {
  const phaseMap = {
    A: ['SECURITY_INPUT_VALIDATION', 'SECURITY_PATH_VALIDATION', 'SECURITY_SANDBOX', 'SECURITY_RATE_LIMIT'],
    B: ['INTEGRITY_DOC_SANITIZE', 'INTEGRITY_CHANGELOG_VALIDATE'],
    C: ['MONITORING_OUTPUT_SANITIZER', 'MONITORING_KILL_SWITCH', 'MONITORING_SHADOW_CHECKER', 'MONITORING_SECURITY_MONITOR'],
    D: ['AGENT_DOC_MANAGE', 'AGENT_SHADOW_CHECK'],
    HITL: ['HITL_ENABLED', 'HITL_GRACEFUL_EXIT', 'HITL_RESUME_ENABLED'],
    E: ['NOTION_SYNC_ENABLED', 'NOTION_HMAC_VERIFY'],
  };

  const features = phaseMap[phase];
  if (features) {
    features.forEach(f => {
      FEATURES[f] = false;
    });
    console.log(`[FeatureFlags] Phase ${phase} disabled:`, features);
  }
}

/**
 * 모든 피쳐 상태 출력
 */
export function printStatus() {
  console.log('\n📋 Feature Flags Status:');
  console.log('='.repeat(50));

  const phases = {
    'Phase A (Security)': ['SECURITY_INPUT_VALIDATION', 'SECURITY_PATH_VALIDATION', 'SECURITY_SANDBOX', 'SECURITY_RATE_LIMIT'],
    'Phase B (Integrity)': ['INTEGRITY_RULEBOOK_CHECK', 'INTEGRITY_MEMORY_LOCK', 'INTEGRITY_DOC_SANITIZE', 'INTEGRITY_CHANGELOG_VALIDATE'],
    'Phase C (Monitoring)': ['MONITORING_OUTPUT_SANITIZER', 'MONITORING_KILL_SWITCH', 'MONITORING_SHADOW_CHECKER', 'MONITORING_SECURITY_MONITOR'],
    'Phase D (Agent)': ['AGENT_DOC_MANAGE', 'AGENT_SHADOW_CHECK'],
    'Phase HITL (Human-in-the-Loop)': ['HITL_ENABLED', 'HITL_AUTO_APPROVE_DESIGN', 'HITL_AUTO_APPROVE_QUERY', 'HITL_GRACEFUL_EXIT', 'HITL_RESUME_ENABLED'],
    'Phase E (External)': ['NOTION_SYNC_ENABLED', 'NOTION_HMAC_VERIFY'],
  };

  for (const [phaseName, features] of Object.entries(phases)) {
    console.log(`\n${phaseName}:`);
    for (const f of features) {
      const status = FEATURES[f] ? '✅' : '❌';
      console.log(`  ${status} ${f}`);
    }
  }
  console.log('='.repeat(50));
}

// 환경변수로 Phase 활성화 지원
if (process.env.FEATURES_PHASE) {
  const phases = process.env.FEATURES_PHASE.split(',');
  phases.forEach(p => enablePhase(p.trim().toUpperCase()));
}

export default FEATURES;
