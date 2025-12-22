#!/usr/bin/env node
/**
 * HITL Flow E2E Test Suite
 *
 * Human-in-the-Loop 전체 흐름 시뮬레이션 테스트
 * - Step 1: 작업 시작 (Start)
 * - Step 2: HITL 트리거 (Pause)
 * - Step 3: 사용자 승인 (Viewer Action)
 * - Step 4: 작업 재개 (Resume)
 *
 * @version 1.0.0
 * @see GEMINI_REPORT_PHASE10.md
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
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

// Console styling utilities
const log = {
  step: (num, msg) => console.log(`\n${'━'.repeat(60)}\n📌 Step ${num}: ${msg}\n${'━'.repeat(60)}`),
  info: (msg) => console.log(`   ℹ️  ${msg}`),
  success: (msg) => console.log(`   ✅ ${msg}`),
  warn: (msg) => console.log(`   ⚠️  ${msg}`),
  error: (msg) => console.log(`   ❌ ${msg}`),
  expectation: (msg) => console.log(`   🎯 Expectation: ${msg}`),
  result: (msg) => console.log(`   📊 Result: ${msg}`),
  divider: () => console.log(`\n${'─'.repeat(50)}`),
};

// Mock Orchestrator & LLM Provider
class MockOrchestrator {
  constructor(store) {
    this.store = store;
    this.currentPhase = null;
  }

  async startTask(taskId, prdPath, metadata = {}) {
    log.info(`Creating session for task: ${taskId}`);
    const session = this.store.create(taskId, prdPath, metadata);

    log.info(`Updating status to RUNNING`);
    this.store.updateStatus(taskId, SessionStatus.RUNNING);
    this.store.updatePhase(taskId, 'Planning');

    return session;
  }

  async simulateDesignPhase(taskId) {
    log.info(`Simulating Design phase (Mock LLM call)`);
    this.store.updatePhase(taskId, 'Design');

    // Mock design output
    const designOutput = {
      erd: '/docs/task/ERD.md',
      sequence: '/docs/task/SEQUENCE.md',
      spec: '/docs/task/SPEC.md'
    };

    log.info(`Design documents generated: ${Object.keys(designOutput).join(', ')}`);
    return designOutput;
  }

  async triggerHITL(taskId, checkpoint, context = {}) {
    log.info(`Triggering HITL checkpoint: ${checkpoint}`);
    const session = this.store.pauseForHITL(taskId, checkpoint, context);

    // Simulate graceful exit (in real scenario, process.exit(0) would be called)
    log.info(`Graceful exit triggered (simulated)`);

    return session;
  }

  async checkResumeCondition(taskId) {
    const session = this.store.get(taskId);
    if (!session) return { canResume: false, reason: 'Session not found' };

    if (session.status === SessionStatus.APPROVED) {
      return { canResume: true, checkpoint: session.currentCheckpoint };
    }

    if (session.status === SessionStatus.PAUSED_HITL) {
      return { canResume: false, reason: 'Awaiting HITL approval' };
    }

    if (session.status === SessionStatus.REJECTED) {
      return { canResume: false, reason: 'HITL rejected' };
    }

    return { canResume: false, reason: `Unexpected status: ${session.status}` };
  }

  async resumeTask(taskId) {
    const session = this.store.get(taskId);

    if (session.status !== SessionStatus.APPROVED) {
      throw new Error(`Cannot resume: Session status is ${session.status}`);
    }

    log.info(`🔄 HITL 승인 확인. 작업을 재개합니다.`);

    // Skip the approved phase and move to next
    const nextPhase = this.getNextPhase(session.currentCheckpoint);
    log.info(`Skipping to next phase: ${nextPhase}`);

    this.store.updateStatus(taskId, SessionStatus.RUNNING, { currentPhase: nextPhase });

    return this.store.get(taskId);
  }

  getNextPhase(checkpoint) {
    const phaseMap = {
      [HITLCheckpoint.PRD_REVIEW]: 'Planning',
      [HITLCheckpoint.DESIGN_APPROVAL]: 'Coding',
      [HITLCheckpoint.QUERY_REVIEW]: 'Execution',
      [HITLCheckpoint.MANUAL_FIX]: 'Retry',
      [HITLCheckpoint.DEPLOY_APPROVAL]: 'Deploy'
    };
    return phaseMap[checkpoint] || 'Unknown';
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
    log.info(`API Call: POST /api/tasks/${taskId}/approve`);
    const session = this.store.approve(taskId, comment);
    log.info(`Session approved with comment: "${comment || '(none)'}"`);
    return session;
  }

  async reject(taskId, reason = '') {
    log.info(`API Call: POST /api/tasks/${taskId}/reject`);
    const session = this.store.reject(taskId, reason);
    log.info(`Session rejected with reason: "${reason || '(none)'}"`);
    return session;
  }

  checkDashboardStatus(session) {
    const statusBadge = {
      [SessionStatus.PAUSED_HITL]: { color: 'amber', label: 'Waiting for Approval' },
      [SessionStatus.APPROVED]: { color: 'green', label: 'APPROVED' },
      [SessionStatus.REJECTED]: { color: 'red', label: 'REJECTED' },
      [SessionStatus.RUNNING]: { color: 'blue', label: 'RUNNING' }
    };
    return statusBadge[session.status] || { color: 'gray', label: session.status };
  }
}

describe('HITL Flow E2E Test', () => {
  let store;
  let orchestrator;
  let viewerAPI;
  const TEST_TASK_ID = 'e2e-hitl-test-001';
  const TEST_PRD_PATH = '/docs/test-app/PRD.md';

  beforeAll(() => {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║           HITL Flow E2E Test Suite v1.0.0                  ║');
    console.log('║           Human-in-the-Loop Integration Test               ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('\n');
  });

  beforeEach(() => {
    // Clean up test directories
    [SESSIONS_DIR, HITL_DIR, RERUN_DIR, FEEDBACK_DIR].forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    store = new SessionStore();
    orchestrator = new MockOrchestrator(store);
    viewerAPI = new MockViewerAPI(store);
  });

  afterEach(() => {
    // Clean up after tests
    [SESSIONS_DIR, HITL_DIR, RERUN_DIR, FEEDBACK_DIR].forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  });

  describe('Happy Path: Full HITL Cycle', () => {
    it('should complete full HITL cycle: Start → Pause → Approve → Resume', async () => {
      // ═══════════════════════════════════════════════════════════════
      // STEP 1: 작업 시작 (Start)
      // ═══════════════════════════════════════════════════════════════
      log.step(1, '작업 시작 (Start)');
      log.info(`Task: "Test App Creation"`);
      log.info(`PRD Path: ${TEST_PRD_PATH}`);

      const session = await orchestrator.startTask(TEST_TASK_ID, TEST_PRD_PATH, {
        description: 'Test App Creation',
        requestedBy: 'QA Engineer'
      });

      log.expectation('SessionStore에 세션이 생성되고, 상태가 RUNNING이 되어야 함');

      const createdSession = store.get(TEST_TASK_ID);
      expect(createdSession).toBeDefined();
      expect(createdSession.taskId).toBe(TEST_TASK_ID);
      expect(createdSession.status).toBe(SessionStatus.RUNNING);
      expect(createdSession.currentPhase).toBe('Planning');

      log.success(`Session created: ${createdSession.taskId}`);
      log.success(`Status: ${createdSession.status}`);
      log.success(`Phase: ${createdSession.currentPhase}`);
      log.result('✓ Step 1 PASSED');

      // ═══════════════════════════════════════════════════════════════
      // STEP 2: HITL 트리거 (Pause)
      // ═══════════════════════════════════════════════════════════════
      log.step(2, 'HITL 트리거 (Pause)');
      log.info('LeaderAgent가 설계를 마친 상황 (Mock)');

      // Simulate design phase completion
      const designOutput = await orchestrator.simulateDesignPhase(TEST_TASK_ID);
      log.info(`Design output: ${JSON.stringify(designOutput)}`);

      // Trigger HITL checkpoint
      const context = {
        message: '설계 문서가 생성되었습니다. 검토 후 승인해주세요.',
        files: designOutput,
        docsPath: '/docs/task'
      };

      const pausedSession = await orchestrator.triggerHITL(
        TEST_TASK_ID,
        HITLCheckpoint.DESIGN_APPROVAL,
        context
      );

      log.expectation('프로세스가 종료(process.exit)되어야 함 (시뮬레이션)');
      log.expectation('SessionStore 상태가 PAUSED_HITL로 저장되어야 함');
      log.expectation('Viewer 대시보드에 주황색 배지와 승인 카드가 나타나야 함');

      expect(pausedSession.status).toBe(SessionStatus.PAUSED_HITL);
      expect(pausedSession.currentCheckpoint).toBe(HITLCheckpoint.DESIGN_APPROVAL);
      expect(pausedSession.hitlContext).toBeDefined();
      expect(pausedSession.hitlContext.context.message).toContain('설계 문서');

      // Check HITL file created
      const hitlPath = path.join(HITL_DIR, `${TEST_TASK_ID}.json`);
      expect(fs.existsSync(hitlPath)).toBe(true);
      log.success(`HITL request file created: ${hitlPath}`);

      // Check Dashboard status
      const dashboardStatus = viewerAPI.checkDashboardStatus(pausedSession);
      expect(dashboardStatus.color).toBe('amber');
      expect(dashboardStatus.label).toBe('Waiting for Approval');
      log.success(`Dashboard badge: [${dashboardStatus.color}] ${dashboardStatus.label}`);

      // Check HITL queue
      const queue = await viewerAPI.getQueue();
      expect(queue.length).toBe(1);
      expect(queue[0].taskId).toBe(TEST_TASK_ID);
      expect(queue[0].checkpoint).toBe(HITLCheckpoint.DESIGN_APPROVAL);
      log.success(`HITL Queue: ${queue.length} pending request(s)`);

      log.result('✓ Step 2 PASSED');

      // ═══════════════════════════════════════════════════════════════
      // STEP 3: 사용자 승인 (Viewer Action)
      // ═══════════════════════════════════════════════════════════════
      log.step(3, '사용자 승인 (Viewer Action)');
      log.info('Simulating API call: POST /api/tasks/:id/approve');

      const approvedSession = await viewerAPI.approve(TEST_TASK_ID, 'LGTM! Proceeding to coding phase.');

      log.expectation('SessionStore 상태가 APPROVED로 변경되어야 함');
      log.expectation('Viewer에서 카드가 사라지거나 완료 상태로 바뀌어야 함');

      expect(approvedSession.status).toBe(SessionStatus.APPROVED);
      expect(approvedSession.hitlContext.approvedAt).toBeDefined();
      expect(approvedSession.hitlContext.approverComment).toBe('LGTM! Proceeding to coding phase.');

      log.success(`Status changed to: ${approvedSession.status}`);
      log.success(`Approved at: ${approvedSession.hitlContext.approvedAt}`);

      // Check HITL file removed
      expect(fs.existsSync(hitlPath)).toBe(false);
      log.success(`HITL request file removed`);

      // Check Dashboard status updated
      const updatedDashboardStatus = viewerAPI.checkDashboardStatus(approvedSession);
      expect(updatedDashboardStatus.color).toBe('green');
      log.success(`Dashboard badge updated: [${updatedDashboardStatus.color}] ${updatedDashboardStatus.label}`);

      // Check queue is empty
      const updatedQueue = await viewerAPI.getQueue();
      expect(updatedQueue.length).toBe(0);
      log.success(`HITL Queue cleared: ${updatedQueue.length} pending`);

      log.result('✓ Step 3 PASSED');

      // ═══════════════════════════════════════════════════════════════
      // STEP 4: 작업 재개 (Resume)
      // ═══════════════════════════════════════════════════════════════
      log.step(4, '작업 재개 (Resume)');
      log.info('CLI 재실행 시뮬레이션');

      // Check resume condition
      const resumeCheck = await orchestrator.checkResumeCondition(TEST_TASK_ID);
      log.info(`Resume check: canResume=${resumeCheck.canResume}, checkpoint=${resumeCheck.checkpoint}`);

      expect(resumeCheck.canResume).toBe(true);
      expect(resumeCheck.checkpoint).toBe(HITLCheckpoint.DESIGN_APPROVAL);

      log.expectation('"🔄 HITL 승인 확인. 작업을 재개합니다." 로그가 출력되어야 함');
      log.expectation('설계 단계를 건너뛰고 바로 다음 단계(Coding)로 진입해야 함');

      const resumedSession = await orchestrator.resumeTask(TEST_TASK_ID);

      expect(resumedSession.status).toBe(SessionStatus.RUNNING);
      expect(resumedSession.currentPhase).toBe('Coding');

      log.success(`Status: ${resumedSession.status}`);
      log.success(`Skipped to phase: ${resumedSession.currentPhase}`);

      // Verify history
      const history = resumedSession.history;
      const events = history.map(h => h.event);

      expect(events).toContain('SESSION_CREATED');
      expect(events).toContain('PAUSED_FOR_HITL');
      expect(events).toContain('HITL_APPROVED');

      log.success(`History events: ${events.join(' → ')}`);

      log.result('✓ Step 4 PASSED');

      // ═══════════════════════════════════════════════════════════════
      // Summary
      // ═══════════════════════════════════════════════════════════════
      console.log('\n');
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║                    TEST SUMMARY                            ║');
      console.log('╠════════════════════════════════════════════════════════════╣');
      console.log('║  ✅ Step 1: Start      - Session created, RUNNING          ║');
      console.log('║  ✅ Step 2: Pause      - PAUSED_HITL, Queue populated       ║');
      console.log('║  ✅ Step 3: Approve    - APPROVED, Queue cleared            ║');
      console.log('║  ✅ Step 4: Resume     - RUNNING, Coding phase              ║');
      console.log('╠════════════════════════════════════════════════════════════╣');
      console.log('║                 ALL TESTS PASSED ✓                         ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      console.log('\n');
    });
  });

  describe('Rejection Path: HITL Rejected', () => {
    it('should handle rejection flow correctly', async () => {
      log.divider();
      log.info('Testing Rejection Path');

      // Start and pause
      await orchestrator.startTask(TEST_TASK_ID, TEST_PRD_PATH);
      await orchestrator.triggerHITL(TEST_TASK_ID, HITLCheckpoint.QUERY_REVIEW, {
        message: '위험한 SQL 쿼리가 감지되었습니다.',
        dangerousQueries: [{ type: 'DELETE', query: 'DELETE FROM users WHERE 1=1' }]
      });

      // Reject
      const rejectedSession = await viewerAPI.reject(TEST_TASK_ID, 'Too dangerous, needs revision');

      expect(rejectedSession.status).toBe(SessionStatus.REJECTED);
      expect(rejectedSession.hitlContext.rejectionReason).toBe('Too dangerous, needs revision');

      // Resume should fail
      const resumeCheck = await orchestrator.checkResumeCondition(TEST_TASK_ID);
      expect(resumeCheck.canResume).toBe(false);
      expect(resumeCheck.reason).toBe('HITL rejected');

      log.success('Rejection flow handled correctly');
    });
  });

  describe('Multiple Checkpoints', () => {
    it('should handle sequential HITL checkpoints', async () => {
      log.divider();
      log.info('Testing Multiple Checkpoints');

      const checkpoints = [
        { checkpoint: HITLCheckpoint.PRD_REVIEW, nextPhase: 'Planning' },
        { checkpoint: HITLCheckpoint.DESIGN_APPROVAL, nextPhase: 'Coding' },
        { checkpoint: HITLCheckpoint.DEPLOY_APPROVAL, nextPhase: 'Deploy' }
      ];

      await orchestrator.startTask(TEST_TASK_ID, TEST_PRD_PATH);

      for (const { checkpoint, nextPhase } of checkpoints) {
        log.info(`Testing checkpoint: ${checkpoint}`);

        // Pause
        await orchestrator.triggerHITL(TEST_TASK_ID, checkpoint, { message: `Checkpoint: ${checkpoint}` });
        let session = store.get(TEST_TASK_ID);
        expect(session.status).toBe(SessionStatus.PAUSED_HITL);
        expect(session.currentCheckpoint).toBe(checkpoint);

        // Approve
        await viewerAPI.approve(TEST_TASK_ID, `Approved: ${checkpoint}`);

        // Resume
        session = await orchestrator.resumeTask(TEST_TASK_ID);
        expect(session.status).toBe(SessionStatus.RUNNING);
        expect(session.currentPhase).toBe(nextPhase);

        log.success(`Checkpoint ${checkpoint} → ${nextPhase} ✓`);
      }

      log.success('All checkpoints handled correctly');
    });
  });

  describe('HITL Queue Management', () => {
    it('should handle multiple tasks in queue', async () => {
      log.divider();
      log.info('Testing Multiple Tasks in Queue');

      const tasks = ['task-001', 'task-002', 'task-003'];

      // Create and pause multiple tasks
      for (const taskId of tasks) {
        await orchestrator.startTask(taskId, '/docs/test/PRD.md');
        await orchestrator.triggerHITL(taskId, HITLCheckpoint.DESIGN_APPROVAL, {
          message: `Design for ${taskId}`
        });
      }

      // Check queue
      let queue = await viewerAPI.getQueue();
      expect(queue.length).toBe(3);
      log.success(`Queue has ${queue.length} pending requests`);

      // Approve one
      await viewerAPI.approve('task-002', 'Approved');
      queue = await viewerAPI.getQueue();
      expect(queue.length).toBe(2);
      expect(queue.map(q => q.taskId)).not.toContain('task-002');
      log.success(`After approval: ${queue.length} pending`);

      // Reject one
      await viewerAPI.reject('task-001', 'Rejected');
      queue = await viewerAPI.getQueue();
      expect(queue.length).toBe(1);
      expect(queue[0].taskId).toBe('task-003');
      log.success(`After rejection: ${queue.length} pending`);
    });
  });

  describe('Edge Cases', () => {
    it('should handle approve on non-paused session', () => {
      log.divider();
      log.info('Testing: Approve on non-paused session');

      orchestrator.startTask(TEST_TASK_ID, TEST_PRD_PATH);
      // Don't pause, try to approve directly

      expect(() => {
        store.approve(TEST_TASK_ID);
      }).toThrow('Invalid session state for approval');

      log.success('Correctly rejected approval on non-paused session');
    });

    it('should handle non-existent session', () => {
      log.divider();
      log.info('Testing: Non-existent session');

      expect(() => {
        store.pauseForHITL('non-existent', HITLCheckpoint.DESIGN_APPROVAL);
      }).toThrow('Session not found: non-existent');

      log.success('Correctly handled non-existent session');
    });

    it('should track history correctly', async () => {
      log.divider();
      log.info('Testing: History tracking');

      await orchestrator.startTask(TEST_TASK_ID, TEST_PRD_PATH);
      await orchestrator.triggerHITL(TEST_TASK_ID, HITLCheckpoint.DESIGN_APPROVAL, {});
      await viewerAPI.approve(TEST_TASK_ID, 'Approved');

      const session = store.get(TEST_TASK_ID);
      const events = session.history.map(h => h.event);

      expect(events).toEqual([
        'SESSION_CREATED',
        'STATUS_CHANGED',  // RUNNING
        'STATUS_CHANGED',  // Phase: Planning
        'STATUS_CHANGED',  // Phase: Design
        'PAUSED_FOR_HITL',
        'HITL_APPROVED'
      ]);

      log.success(`History: ${events.join(' → ')}`);
    });
  });
});

// CLI runner (when executed directly)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('Running HITL Flow E2E Test directly...');
  console.log('Use: npx vitest run tests/e2e/hitl_flow.test.js');
}
