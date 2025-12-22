#!/usr/bin/env node
/**
 * HITL Flow E2E Test Runner
 *
 * Human-in-the-Loop 전체 흐름 시뮬레이션 테스트
 * vitest 없이 순수 Node.js로 실행
 *
 * 실행: node tests/e2e/hitl_flow_runner.js
 *
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SessionStore, SessionStatus, HITLCheckpoint } from '../../state/session-store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories
const SESSIONS_DIR = path.join(__dirname, '../../state/sessions');
const HITL_DIR = path.join(__dirname, '../../logs/.hitl');
const RERUN_DIR = path.join(__dirname, '../../logs/.rerun');
const FEEDBACK_DIR = path.join(__dirname, '../../logs/.feedback');

// Test results
let passed = 0;
let failed = 0;
const errors = [];

// Console styling utilities
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${'═'.repeat(60)}${colors.reset}`),
  step: (num, msg) => console.log(`\n${colors.bright}${colors.blue}━━━ Step ${num}: ${msg} ━━━${colors.reset}`),
  info: (msg) => console.log(`   ${colors.dim}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`   ${colors.green}✅ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`   ${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`   ${colors.red}❌ ${msg}${colors.reset}`),
  expectation: (msg) => console.log(`   ${colors.magenta}🎯 Expectation: ${msg}${colors.reset}`),
  result: (msg) => console.log(`   ${colors.bright}📊 ${msg}${colors.reset}`),
};

// Simple assertion
function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected} but got ${actual}`);
      }
    },
    toBeDefined() {
      if (actual === undefined || actual === null) {
        throw new Error(`Expected value to be defined but got ${actual}`);
      }
    },
    toContain(item) {
      if (!actual.includes(item)) {
        throw new Error(`Expected ${JSON.stringify(actual)} to contain ${item}`);
      }
    },
    toEqual(expected) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
      }
    },
    toHaveLength(length) {
      if (actual.length !== length) {
        throw new Error(`Expected length ${length} but got ${actual.length}`);
      }
    },
    toThrow(message) {
      // actual should be a function
      try {
        actual();
        throw new Error(`Expected function to throw but it did not`);
      } catch (e) {
        if (message && !e.message.includes(message)) {
          throw new Error(`Expected error message to include "${message}" but got "${e.message}"`);
        }
      }
    }
  };
}

// Clean directories
function cleanDirectories() {
  [SESSIONS_DIR, HITL_DIR, RERUN_DIR, FEEDBACK_DIR].forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
}

// Mock Orchestrator
class MockOrchestrator {
  constructor(store) {
    this.store = store;
  }

  async startTask(taskId, prdPath, metadata = {}) {
    log.info(`Creating session for task: ${taskId}`);
    this.store.create(taskId, prdPath, metadata);
    this.store.updateStatus(taskId, SessionStatus.RUNNING);
    this.store.updatePhase(taskId, 'Planning');
    return this.store.get(taskId);
  }

  async simulateDesignPhase(taskId) {
    log.info(`Simulating Design phase (Mock LLM call)`);
    this.store.updatePhase(taskId, 'Design');
    return { erd: '/docs/ERD.md', sequence: '/docs/SEQUENCE.md' };
  }

  async triggerHITL(taskId, checkpoint, context = {}) {
    log.info(`Triggering HITL checkpoint: ${checkpoint}`);
    return this.store.pauseForHITL(taskId, checkpoint, context);
  }

  async checkResumeCondition(taskId) {
    const session = this.store.get(taskId);
    if (!session) return { canResume: false, reason: 'Session not found' };
    if (session.status === SessionStatus.APPROVED) {
      return { canResume: true, checkpoint: session.currentCheckpoint };
    }
    if (session.status === SessionStatus.REJECTED) {
      return { canResume: false, reason: 'HITL rejected' };
    }
    return { canResume: false, reason: `Status: ${session.status}` };
  }

  async resumeTask(taskId) {
    const session = this.store.get(taskId);
    if (session.status !== SessionStatus.APPROVED) {
      throw new Error(`Cannot resume: Status is ${session.status}`);
    }
    log.info(`🔄 HITL 승인 확인. 작업을 재개합니다.`);
    const nextPhase = this.getNextPhase(session.currentCheckpoint);
    log.info(`Skipping to next phase: ${nextPhase}`);
    this.store.updateStatus(taskId, SessionStatus.RUNNING, { currentPhase: nextPhase });
    return this.store.get(taskId);
  }

  getNextPhase(checkpoint) {
    const map = {
      [HITLCheckpoint.PRD_REVIEW]: 'Planning',
      [HITLCheckpoint.DESIGN_APPROVAL]: 'Coding',
      [HITLCheckpoint.QUERY_REVIEW]: 'Execution',
      [HITLCheckpoint.MANUAL_FIX]: 'Retry',
      [HITLCheckpoint.DEPLOY_APPROVAL]: 'Deploy'
    };
    return map[checkpoint] || 'Unknown';
  }
}

// Mock Viewer API
class MockViewerAPI {
  constructor(store) {
    this.store = store;
  }

  async getQueue() {
    return this.store.getPendingHITLRequests();
  }

  async approve(taskId, comment = '') {
    log.info(`API: POST /api/tasks/${taskId}/approve`);
    return this.store.approve(taskId, comment);
  }

  async reject(taskId, reason = '') {
    log.info(`API: POST /api/tasks/${taskId}/reject`);
    return this.store.reject(taskId, reason);
  }

  checkDashboardStatus(session) {
    const map = {
      [SessionStatus.PAUSED_HITL]: { color: 'amber', label: 'Waiting for Approval' },
      [SessionStatus.APPROVED]: { color: 'green', label: 'APPROVED' },
      [SessionStatus.REJECTED]: { color: 'red', label: 'REJECTED' },
      [SessionStatus.RUNNING]: { color: 'blue', label: 'RUNNING' }
    };
    return map[session.status] || { color: 'gray', label: session.status };
  }
}

// Test runner
async function runTest(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`${colors.green}✓${colors.reset} ${name}`);
  } catch (e) {
    failed++;
    errors.push({ name, error: e.message });
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    console.log(`  ${colors.red}Error: ${e.message}${colors.reset}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN TEST
// ═══════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         HITL Flow E2E Test Runner v1.0.0                       ║');
  console.log('║         Human-in-the-Loop Integration Test                     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  const TEST_TASK_ID = 'e2e-hitl-test-001';
  const TEST_PRD_PATH = '/docs/test-app/PRD.md';

  // Setup
  cleanDirectories();
  const store = new SessionStore();
  const orchestrator = new MockOrchestrator(store);
  const viewerAPI = new MockViewerAPI(store);

  // ═══════════════════════════════════════════════════════════════════════
  // HAPPY PATH TEST
  // ═══════════════════════════════════════════════════════════════════════
  console.log(`${colors.bright}${colors.cyan}━━━ Test Suite: Happy Path (Full HITL Cycle) ━━━${colors.reset}\n`);

  // Step 1: 작업 시작
  log.step(1, '작업 시작 (Start)');
  log.info(`Task: "Test App Creation"`);

  await runTest('Session should be created with RUNNING status', async () => {
    const session = await orchestrator.startTask(TEST_TASK_ID, TEST_PRD_PATH, {
      description: 'Test App Creation'
    });

    const retrieved = store.get(TEST_TASK_ID);
    expect(retrieved).toBeDefined();
    expect(retrieved.taskId).toBe(TEST_TASK_ID);
    expect(retrieved.status).toBe(SessionStatus.RUNNING);
    expect(retrieved.currentPhase).toBe('Planning');

    log.success(`Session: ${retrieved.taskId}, Status: ${retrieved.status}`);
  });

  // Step 2: HITL 트리거
  log.step(2, 'HITL 트리거 (Pause)');
  log.info('LeaderAgent 설계 완료 시뮬레이션');

  await runTest('Session should pause at DESIGN_APPROVAL checkpoint', async () => {
    await orchestrator.simulateDesignPhase(TEST_TASK_ID);
    const paused = await orchestrator.triggerHITL(TEST_TASK_ID, HITLCheckpoint.DESIGN_APPROVAL, {
      message: '설계 문서가 생성되었습니다.',
      files: { erd: '/docs/ERD.md', sequence: '/docs/SEQUENCE.md' }
    });

    expect(paused.status).toBe(SessionStatus.PAUSED_HITL);
    expect(paused.currentCheckpoint).toBe(HITLCheckpoint.DESIGN_APPROVAL);
    expect(paused.hitlContext).toBeDefined();

    log.success(`Status: ${paused.status}, Checkpoint: ${paused.currentCheckpoint}`);
  });

  await runTest('HITL request file should be created', async () => {
    const hitlPath = path.join(HITL_DIR, `${TEST_TASK_ID}.json`);
    expect(fs.existsSync(hitlPath)).toBe(true);
    log.success(`HITL file: ${hitlPath}`);
  });

  await runTest('Dashboard should show amber badge', async () => {
    const session = store.get(TEST_TASK_ID);
    const badge = viewerAPI.checkDashboardStatus(session);
    expect(badge.color).toBe('amber');
    expect(badge.label).toBe('Waiting for Approval');
    log.success(`Badge: [${badge.color}] ${badge.label}`);
  });

  await runTest('HITL queue should have 1 pending request', async () => {
    const queue = await viewerAPI.getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].taskId).toBe(TEST_TASK_ID);
    log.success(`Queue: ${queue.length} pending`);
  });

  // Step 3: 사용자 승인
  log.step(3, '사용자 승인 (Viewer Action)');
  log.info('POST /api/tasks/:id/approve 호출');

  await runTest('Session should be APPROVED after API call', async () => {
    const approved = await viewerAPI.approve(TEST_TASK_ID, 'LGTM!');

    expect(approved.status).toBe(SessionStatus.APPROVED);
    expect(approved.hitlContext.approvedAt).toBeDefined();
    expect(approved.hitlContext.approverComment).toBe('LGTM!');

    log.success(`Status: ${approved.status}`);
  });

  await runTest('HITL request file should be removed', async () => {
    const hitlPath = path.join(HITL_DIR, `${TEST_TASK_ID}.json`);
    expect(fs.existsSync(hitlPath)).toBe(false);
    log.success('HITL file removed');
  });

  await runTest('HITL queue should be empty', async () => {
    const queue = await viewerAPI.getQueue();
    expect(queue).toHaveLength(0);
    log.success(`Queue: ${queue.length} pending`);
  });

  // Step 4: 작업 재개
  log.step(4, '작업 재개 (Resume)');
  log.info('CLI 재실행 시뮬레이션');

  await runTest('Resume check should return canResume=true', async () => {
    const check = await orchestrator.checkResumeCondition(TEST_TASK_ID);
    expect(check.canResume).toBe(true);
    expect(check.checkpoint).toBe(HITLCheckpoint.DESIGN_APPROVAL);
    log.success(`canResume: ${check.canResume}`);
  });

  await runTest('Session should resume to Coding phase', async () => {
    const resumed = await orchestrator.resumeTask(TEST_TASK_ID);

    expect(resumed.status).toBe(SessionStatus.RUNNING);
    expect(resumed.currentPhase).toBe('Coding');

    log.success(`Status: ${resumed.status}, Phase: ${resumed.currentPhase}`);
  });

  await runTest('History should contain all events', async () => {
    const session = store.get(TEST_TASK_ID);
    const events = session.history.map(h => h.event);

    expect(events).toContain('SESSION_CREATED');
    expect(events).toContain('PAUSED_FOR_HITL');
    expect(events).toContain('HITL_APPROVED');

    log.success(`Events: ${events.join(' → ')}`);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // REJECTION PATH TEST
  // ═══════════════════════════════════════════════════════════════════════
  console.log(`\n${colors.bright}${colors.cyan}━━━ Test Suite: Rejection Path ━━━${colors.reset}\n`);

  cleanDirectories();
  const store2 = new SessionStore();
  const orchestrator2 = new MockOrchestrator(store2);
  const viewerAPI2 = new MockViewerAPI(store2);

  await runTest('Rejection flow should work correctly', async () => {
    await orchestrator2.startTask('reject-test', '/docs/PRD.md');
    await orchestrator2.triggerHITL('reject-test', HITLCheckpoint.QUERY_REVIEW, {
      message: '위험한 SQL 쿼리 감지',
      dangerousQueries: [{ type: 'DELETE', query: 'DELETE FROM users' }]
    });

    const rejected = await viewerAPI2.reject('reject-test', 'Too dangerous');

    expect(rejected.status).toBe(SessionStatus.REJECTED);
    expect(rejected.hitlContext.rejectionReason).toBe('Too dangerous');

    const check = await orchestrator2.checkResumeCondition('reject-test');
    expect(check.canResume).toBe(false);
    expect(check.reason).toBe('HITL rejected');

    log.success('Rejection handled correctly');
  });

  // ═══════════════════════════════════════════════════════════════════════
  // EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════
  console.log(`\n${colors.bright}${colors.cyan}━━━ Test Suite: Edge Cases ━━━${colors.reset}\n`);

  cleanDirectories();
  const store3 = new SessionStore();

  await runTest('Approve on non-paused session should throw', async () => {
    store3.create('edge-test', '/docs/PRD.md');
    expect(() => store3.approve('edge-test')).toThrow('Invalid session state');
  });

  await runTest('Pause on non-existent session should throw', async () => {
    expect(() => store3.pauseForHITL('non-existent', HITLCheckpoint.DESIGN_APPROVAL)).toThrow('Session not found');
  });

  // ═══════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST SUMMARY                              ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║  ${colors.green}Passed: ${passed}${colors.reset}                                                    ║`);
  console.log(`║  ${failed > 0 ? colors.red : colors.dim}Failed: ${failed}${colors.reset}                                                    ║`);
  console.log('╠════════════════════════════════════════════════════════════════╣');

  if (failed === 0) {
    console.log(`║  ${colors.green}${colors.bright}ALL TESTS PASSED ✓${colors.reset}                                        ║`);
  } else {
    console.log(`║  ${colors.red}SOME TESTS FAILED${colors.reset}                                          ║`);
    errors.forEach(e => {
      console.log(`║  ${colors.red}- ${e.name}${colors.reset}`);
    });
  }

  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // Cleanup
  cleanDirectories();

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run
main().catch(e => {
  console.error('Test runner failed:', e);
  process.exit(1);
});
