#!/usr/bin/env node
/**
 * HITL CLI Tool v1.0.0
 *
 * Human-in-the-Loop 관리 CLI
 * - 대기 중인 HITL 요청 조회
 * - 세션 승인/거부
 * - 세션 상태 확인
 *
 * 사용법:
 *   node cli.js status              # 대기 중인 HITL 요청 목록
 *   node cli.js approve <taskId>    # 세션 승인
 *   node cli.js reject <taskId>     # 세션 거부
 *   node cli.js session <taskId>    # 세션 상세 정보
 *   node cli.js list                # 모든 활성 세션 목록
 *
 * @version 1.0.0
 */

import { sessionStore, SessionStatus, HITLCheckpoint, HITLDecision } from './state/session-store.js';

const COMMANDS = {
  status: 'status',
  approve: 'approve',
  reject: 'reject',
  session: 'session',
  list: 'list',
  help: 'help'
};

/**
 * --flag 또는 --flag=value 형태로 값을 추출
 */
function getFlagValue(args, flag) {
  const direct = args.find(a => a === flag);
  if (direct) {
    const idx = args.indexOf(direct);
    return args[idx + 1] && !args[idx + 1].startsWith('--') ? args[idx + 1] : null;
  }

  const withValue = args.find(a => a.startsWith(`${flag}=`));
  if (withValue) {
    return withValue.split('=').slice(1).join('=');
  }
  return null;
}

/**
 * --decision 플래그 파싱
 */
function parseDecisionArgs(args) {
  const decisionRaw = getFlagValue(args, '--decision');
  if (!decisionRaw) return null;

  const taskId = getFlagValue(args, '--taskId');
  const comment = getFlagValue(args, '--comment') || '';
  const ruleOverrideRaw = getFlagValue(args, '--rule-override');

  let ruleOverride = null;
  if (ruleOverrideRaw) {
    try {
      ruleOverride = JSON.parse(ruleOverrideRaw);
    } catch {
      ruleOverride = ruleOverrideRaw;
    }
  }

  return { decisionRaw, taskId, comment, ruleOverride };
}

function normalizeDecision(decisionRaw) {
  const value = (decisionRaw || '').toUpperCase();
  if (['EXCEPTION_APPROVAL', 'EXCEPTION', 'RISK_ACCEPTANCE', 'RISK_ACCEPT'].includes(value)) {
    return HITLDecision.EXCEPTION_APPROVAL;
  }
  if (value === 'RULE_OVERRIDE') {
    return HITLDecision.RULE_OVERRIDE;
  }
  if (value === 'REJECT') {
    return HITLDecision.REJECT;
  }
  throw new Error(`지원하지 않는 decision: ${decisionRaw}`);
}

function handleDecisionCommand({ taskId, decisionRaw, comment, ruleOverride }) {
  if (!taskId) {
    console.error('❌ 오류: --taskId가 필요합니다.');
    console.log('   예: node cli.js --decision EXCEPTION_APPROVAL --taskId case-123 --comment "긴급 승인"');
    process.exit(1);
  }

  const decision = normalizeDecision(decisionRaw);

  const session = sessionStore.handleHITLDecision(taskId, decision, {
    comment,
    ruleOverride
  });

  console.log(`✅ HITL 결정 적용: ${decision}`);
  console.log(`   Task ID: ${taskId}`);
  if (comment) {
    console.log(`   코멘트: ${comment}`);
  }
  if (decision === HITLDecision.RULE_OVERRIDE && ruleOverride) {
    console.log('   규칙 수정 요청:', ruleOverride);
  }
}

/**
 * 메인 CLI 엔트리포인트
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();
  const taskId = args[1];
  const reason = args.slice(2).join(' ');

  // --decision 플래그로 3-way 결정 처리
  const decisionArgs = parseDecisionArgs(args);
  if (decisionArgs) {
    try {
      handleDecisionCommand(decisionArgs);
    } catch (error) {
      console.error(`❌ 결정 처리 실패: ${error.message}`);
      process.exit(1);
    }
    return;
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎛️  HITL CLI Tool v1.0.0');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  switch (command) {
    case COMMANDS.status:
      showPendingRequests();
      break;

    case COMMANDS.approve:
      if (!taskId) {
        console.error('❌ 오류: taskId가 필요합니다.');
        console.log('   사용법: node cli.js approve <taskId> [comment]');
        process.exit(1);
      }
      approveSession(taskId, reason);
      break;

    case COMMANDS.reject:
      if (!taskId) {
        console.error('❌ 오류: taskId가 필요합니다.');
        console.log('   사용법: node cli.js reject <taskId> [reason]');
        process.exit(1);
      }
      rejectSession(taskId, reason);
      break;

    case COMMANDS.session:
      if (!taskId) {
        console.error('❌ 오류: taskId가 필요합니다.');
        console.log('   사용법: node cli.js session <taskId>');
        process.exit(1);
      }
      showSessionDetails(taskId);
      break;

    case COMMANDS.list:
      listActiveSessions();
      break;

    case COMMANDS.help:
    default:
      showHelp();
      break;
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * 대기 중인 HITL 요청 목록 출력
 */
function showPendingRequests() {
  const pending = sessionStore.getPendingHITLRequests();

  if (pending.length === 0) {
    console.log('📭 대기 중인 HITL 요청이 없습니다.');
    return;
  }

  console.log(`📬 대기 중인 HITL 요청: ${pending.length}개\n`);

  pending.forEach((req, index) => {
    console.log(`${index + 1}. [${req.checkpoint}] ${req.taskId}`);
    console.log(`   ⏰ 대기 시작: ${req.createdAt}`);
    if (req.context?.message) {
      console.log(`   📝 메시지: ${req.context.message}`);
    }
    console.log('');
  });

  console.log('💡 승인하려면: node cli.js approve <taskId>');
  console.log('💡 거부하려면: node cli.js reject <taskId> [reason]');
}

/**
 * 세션 승인
 */
function approveSession(taskId, comment = '') {
  try {
    const session = sessionStore.get(taskId);

    if (!session) {
      console.error(`❌ 세션을 찾을 수 없습니다: ${taskId}`);
      process.exit(1);
    }

    if (session.status !== SessionStatus.PAUSED_HITL) {
      console.error(`❌ 세션이 HITL 대기 상태가 아닙니다.`);
      console.log(`   현재 상태: ${session.status}`);
      process.exit(1);
    }

    sessionStore.approve(taskId, comment);

    console.log(`✅ 세션 승인 완료: ${taskId}`);
    console.log(`   체크포인트: ${session.currentCheckpoint}`);
    if (comment) {
      console.log(`   코멘트: ${comment}`);
    }
    console.log('\n🔄 다음 단계:');
    console.log(`   Orchestrator 재실행: node orchestrator.js --resume ${taskId}`);
  } catch (error) {
    console.error(`❌ 승인 실패: ${error.message}`);
    process.exit(1);
  }
}

/**
 * 세션 거부
 */
function rejectSession(taskId, reason = '') {
  try {
    const session = sessionStore.get(taskId);

    if (!session) {
      console.error(`❌ 세션을 찾을 수 없습니다: ${taskId}`);
      process.exit(1);
    }

    if (session.status !== SessionStatus.PAUSED_HITL) {
      console.error(`❌ 세션이 HITL 대기 상태가 아닙니다.`);
      console.log(`   현재 상태: ${session.status}`);
      process.exit(1);
    }

    sessionStore.reject(taskId, reason || '사용자에 의해 거부됨');

    console.log(`🚫 세션 거부 완료: ${taskId}`);
    console.log(`   체크포인트: ${session.currentCheckpoint}`);
    if (reason) {
      console.log(`   사유: ${reason}`);
    }
  } catch (error) {
    console.error(`❌ 거부 실패: ${error.message}`);
    process.exit(1);
  }
}

/**
 * 세션 상세 정보 출력
 */
function showSessionDetails(taskId) {
  const session = sessionStore.get(taskId);

  if (!session) {
    console.error(`❌ 세션을 찾을 수 없습니다: ${taskId}`);
    process.exit(1);
  }

  console.log(`📋 세션 상세 정보: ${taskId}\n`);

  // 기본 정보
  console.log(`상태: ${formatStatus(session.status)}`);
  console.log(`Phase: ${session.currentPhase || 'N/A'}`);
  console.log(`생성: ${session.createdAt}`);
  console.log(`수정: ${session.updatedAt}`);

  // HITL 정보
  if (session.hitlContext) {
    console.log(`\n🎯 HITL 정보:`);
    console.log(`   체크포인트: ${session.currentCheckpoint}`);
    console.log(`   대기 시작: ${session.hitlContext.pausedAt}`);
    if (session.hitlContext.context?.message) {
      console.log(`   메시지: ${session.hitlContext.context.message}`);
    }
    if (session.hitlContext.approvedAt) {
      console.log(`   승인 시각: ${session.hitlContext.approvedAt}`);
    }
    if (session.hitlContext.rejectedAt) {
      console.log(`   거부 시각: ${session.hitlContext.rejectedAt}`);
      console.log(`   거부 사유: ${session.hitlContext.rejectionReason}`);
    }
  }

  // 재시도 정보
  if (session.retryCount > 0) {
    console.log(`\n🔄 재시도: ${session.retryCount}/${session.maxRetries}`);
  }

  // 히스토리
  if (session.history && session.history.length > 0) {
    console.log(`\n📜 히스토리 (최근 5개):`);
    const recentHistory = session.history.slice(-5);
    recentHistory.forEach(h => {
      console.log(`   [${h.timestamp}] ${h.event}`);
    });
  }
}

/**
 * 모든 활성 세션 목록 출력
 */
function listActiveSessions() {
  const sessions = sessionStore.getActiveSessions();

  if (sessions.length === 0) {
    console.log('📭 활성 세션이 없습니다.');
    return;
  }

  console.log(`📋 활성 세션: ${sessions.length}개\n`);

  sessions.forEach((s, index) => {
    console.log(`${index + 1}. ${s.taskId}`);
    console.log(`   상태: ${formatStatus(s.status)}`);
    console.log(`   Phase: ${s.currentPhase || 'N/A'}`);
    console.log(`   수정: ${s.updatedAt}`);
    console.log('');
  });
}

/**
 * 상태 포맷팅
 */
function formatStatus(status) {
  const statusMap = {
    [SessionStatus.INITIALIZED]: '🔵 초기화됨',
    [SessionStatus.RUNNING]: '🟢 실행 중',
    [SessionStatus.PAUSED_HITL]: '🟡 HITL 대기',
    [SessionStatus.APPROVED]: '✅ 승인됨',
    [SessionStatus.REJECTED]: '🚫 거부됨',
    [SessionStatus.COMPLETED]: '✅ 완료',
    [SessionStatus.FAILED]: '❌ 실패',
    [SessionStatus.USER_INTERVENTION_REQUIRED]: '⚠️ 사용자 개입 필요'
  };
  return statusMap[status] || status;
}

/**
 * 도움말 출력
 */
function showHelp() {
  console.log('📖 사용법:\n');
  console.log('  node cli.js status              대기 중인 HITL 요청 목록');
  console.log('  node cli.js approve <taskId>    세션 승인');
  console.log('  node cli.js reject <taskId>     세션 거부');
  console.log('  node cli.js session <taskId>    세션 상세 정보');
  console.log('  node cli.js list                모든 활성 세션 목록');
  console.log('  node cli.js --decision <옵션> --taskId <id> [--comment "..."] [--rule-override "{...}"]');
  console.log('  node cli.js help                이 도움말 표시');
  console.log('\n📝 예시:\n');
  console.log('  node cli.js status');
  console.log('  node cli.js approve task-12345');
  console.log('  node cli.js reject task-12345 "설계 수정 필요"');
  console.log('  node cli.js session task-12345');
  console.log('  node cli.js --decision EXCEPTION_APPROVAL --taskId task-12345 --comment "위험 수용"');
  console.log('  node cli.js --decision RULE_OVERRIDE --taskId task-12345 --rule-override "{\\"rule\\":\\"sdd-check\\"}"');
}

// 실행
main().catch(error => {
  console.error('❌ CLI 오류:', error.message);
  process.exit(1);
});
