/**
 * Session Store Unit Test Suite
 *
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SessionStore, SessionStatus, HITLCheckpoint } from '../../state/session-store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SESSIONS_DIR = path.join(__dirname, '../../state/sessions');
const HITL_DIR = path.join(__dirname, '../../logs/.hitl');
const RERUN_DIR = path.join(__dirname, '../../logs/.rerun');
const FEEDBACK_DIR = path.join(__dirname, '../../logs/.feedback');

describe('SessionStore', () => {
  let store;

  beforeEach(() => {
    // Clean up test directories before each test
    [SESSIONS_DIR, HITL_DIR, RERUN_DIR, FEEDBACK_DIR].forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    store = new SessionStore();
  });

  afterEach(() => {
    // Clean up after tests
    [SESSIONS_DIR, HITL_DIR, RERUN_DIR, FEEDBACK_DIR].forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  });

  describe('create', () => {
    it('should create a new session with default values', () => {
      const taskId = 'test-task-001';
      const prdPath = '/path/to/prd.md';

      const session = store.create(taskId, prdPath);

      expect(session.taskId).toBe(taskId);
      expect(session.prdPath).toBe(prdPath);
      expect(session.status).toBe(SessionStatus.INITIALIZED);
      expect(session.currentPhase).toBeNull();
      expect(session.currentCheckpoint).toBeNull();
      expect(session.retryCount).toBe(0);
      expect(session.maxRetries).toBe(3);
      expect(session.createdAt).toBeDefined();
      expect(session.updatedAt).toBeDefined();
      expect(session.history).toHaveLength(1);
      expect(session.history[0].event).toBe('SESSION_CREATED');
    });

    it('should create a session with custom metadata', () => {
      const taskId = 'test-task-002';
      const prdPath = '/path/to/prd.md';
      const metadata = { user: 'tester', priority: 'high' };

      const session = store.create(taskId, prdPath, metadata);

      expect(session.metadata).toEqual(metadata);
      expect(session.metadata.user).toBe('tester');
      expect(session.metadata.priority).toBe('high');
    });

    it('should save session to file system', () => {
      const taskId = 'test-task-003';
      const prdPath = '/path/to/prd.md';

      store.create(taskId, prdPath);

      const sessionPath = path.join(SESSIONS_DIR, `${taskId}.json`);
      expect(fs.existsSync(sessionPath)).toBe(true);

      const savedSession = JSON.parse(fs.readFileSync(sessionPath, 'utf-8'));
      expect(savedSession.taskId).toBe(taskId);
    });
  });

  describe('get', () => {
    it('should retrieve existing session', () => {
      const taskId = 'test-task-004';
      const prdPath = '/path/to/prd.md';

      store.create(taskId, prdPath);
      const retrieved = store.get(taskId);

      expect(retrieved).toBeDefined();
      expect(retrieved.taskId).toBe(taskId);
      expect(retrieved.prdPath).toBe(prdPath);
    });

    it('should return null for non-existent session', () => {
      const retrieved = store.get('non-existent-task');

      expect(retrieved).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update session status', () => {
      const taskId = 'test-task-005';
      store.create(taskId, '/path/to/prd.md');

      const updated = store.updateStatus(taskId, SessionStatus.RUNNING);

      expect(updated.status).toBe(SessionStatus.RUNNING);
      expect(updated.history).toHaveLength(2);
      expect(updated.history[1].event).toBe('STATUS_CHANGED');
    });

    it('should update status with additional details', () => {
      const taskId = 'test-task-006';
      store.create(taskId, '/path/to/prd.md');

      const details = { currentPhase: 'Planning', progress: 50 };
      const updated = store.updateStatus(taskId, SessionStatus.RUNNING, details);

      expect(updated.status).toBe(SessionStatus.RUNNING);
      expect(updated.currentPhase).toBe('Planning');
      expect(updated.progress).toBe(50);
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        store.updateStatus('non-existent-task', SessionStatus.RUNNING);
      }).toThrow('Session not found: non-existent-task');
    });

    it('should update timestamp on status change', () => {
      const taskId = 'test-task-007';
      store.create(taskId, '/path/to/prd.md');

      const originalUpdatedAt = store.get(taskId).updatedAt;

      // Wait a bit to ensure timestamp differs
      setTimeout(() => {
        const updated = store.updateStatus(taskId, SessionStatus.RUNNING);
        expect(updated.updatedAt).not.toBe(originalUpdatedAt);
      }, 10);
    });
  });

  describe('updatePhase', () => {
    it('should update current phase and set status to RUNNING', () => {
      const taskId = 'test-task-008';
      store.create(taskId, '/path/to/prd.md');

      const updated = store.updatePhase(taskId, 'Planning');

      expect(updated.status).toBe(SessionStatus.RUNNING);
      expect(updated.currentPhase).toBe('Planning');
    });

    it('should update phase from one to another', () => {
      const taskId = 'test-task-009';
      store.create(taskId, '/path/to/prd.md');

      store.updatePhase(taskId, 'Planning');
      const updated = store.updatePhase(taskId, 'Coding');

      expect(updated.currentPhase).toBe('Coding');
      expect(updated.status).toBe(SessionStatus.RUNNING);
    });
  });

  describe('pauseForHITL', () => {
    it('should pause session at HITL checkpoint', () => {
      const taskId = 'test-task-010';
      store.create(taskId, '/path/to/prd.md');

      const context = { reason: 'Dangerous query detected' };
      const paused = store.pauseForHITL(taskId, HITLCheckpoint.QUERY_REVIEW, context);

      expect(paused.status).toBe(SessionStatus.PAUSED_HITL);
      expect(paused.currentCheckpoint).toBe(HITLCheckpoint.QUERY_REVIEW);
      expect(paused.hitlContext.checkpoint).toBe(HITLCheckpoint.QUERY_REVIEW);
      expect(paused.hitlContext.context).toEqual(context);
      expect(paused.hitlContext.pausedAt).toBeDefined();
    });

    it('should create HITL request file', () => {
      const taskId = 'test-task-011';
      store.create(taskId, '/path/to/prd.md');

      store.pauseForHITL(taskId, HITLCheckpoint.DEPLOY_APPROVAL);

      const hitlPath = path.join(HITL_DIR, `${taskId}.json`);
      expect(fs.existsSync(hitlPath)).toBe(true);

      const hitlRequest = JSON.parse(fs.readFileSync(hitlPath, 'utf-8'));
      expect(hitlRequest.taskId).toBe(taskId);
      expect(hitlRequest.checkpoint).toBe(HITLCheckpoint.DEPLOY_APPROVAL);
    });

    it('should log HITL pause in history', () => {
      const taskId = 'test-task-012';
      store.create(taskId, '/path/to/prd.md');

      const paused = store.pauseForHITL(taskId, HITLCheckpoint.PRD_REVIEW);

      expect(paused.history).toHaveLength(2);
      expect(paused.history[1].event).toBe('PAUSED_FOR_HITL');
      expect(paused.history[1].data.checkpoint).toBe(HITLCheckpoint.PRD_REVIEW);
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        store.pauseForHITL('non-existent-task', HITLCheckpoint.QUERY_REVIEW);
      }).toThrow('Session not found: non-existent-task');
    });
  });

  describe('approve', () => {
    it('should approve paused HITL session', () => {
      const taskId = 'test-task-013';
      store.create(taskId, '/path/to/prd.md');
      store.pauseForHITL(taskId, HITLCheckpoint.DESIGN_APPROVAL);

      const approved = store.approve(taskId, 'Looks good');

      expect(approved.status).toBe(SessionStatus.APPROVED);
      expect(approved.hitlContext.approvedAt).toBeDefined();
      expect(approved.hitlContext.approverComment).toBe('Looks good');
    });

    it('should remove HITL request file on approval', () => {
      const taskId = 'test-task-014';
      store.create(taskId, '/path/to/prd.md');
      store.pauseForHITL(taskId, HITLCheckpoint.QUERY_REVIEW);

      const hitlPath = path.join(HITL_DIR, `${taskId}.json`);
      expect(fs.existsSync(hitlPath)).toBe(true);

      store.approve(taskId);

      expect(fs.existsSync(hitlPath)).toBe(false);
    });

    it('should log approval in history', () => {
      const taskId = 'test-task-015';
      store.create(taskId, '/path/to/prd.md');
      store.pauseForHITL(taskId, HITLCheckpoint.MANUAL_FIX);

      const approved = store.approve(taskId, 'Approved');

      expect(approved.history).toHaveLength(3);
      expect(approved.history[2].event).toBe('HITL_APPROVED');
    });

    it('should throw error if session is not paused', () => {
      const taskId = 'test-task-016';
      store.create(taskId, '/path/to/prd.md');

      expect(() => {
        store.approve(taskId);
      }).toThrow('Invalid session state for approval');
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        store.approve('non-existent-task');
      }).toThrow('Invalid session state for approval');
    });
  });

  describe('reject', () => {
    it('should reject paused HITL session', () => {
      const taskId = 'test-task-017';
      store.create(taskId, '/path/to/prd.md');
      store.pauseForHITL(taskId, HITLCheckpoint.DEPLOY_APPROVAL);

      const rejected = store.reject(taskId, 'Too risky');

      expect(rejected.status).toBe(SessionStatus.REJECTED);
      expect(rejected.hitlContext.rejectedAt).toBeDefined();
      expect(rejected.hitlContext.rejectionReason).toBe('Too risky');
    });

    it('should remove HITL request file on rejection', () => {
      const taskId = 'test-task-018';
      store.create(taskId, '/path/to/prd.md');
      store.pauseForHITL(taskId, HITLCheckpoint.QUERY_REVIEW);

      const hitlPath = path.join(HITL_DIR, `${taskId}.json`);
      expect(fs.existsSync(hitlPath)).toBe(true);

      store.reject(taskId);

      expect(fs.existsSync(hitlPath)).toBe(false);
    });

    it('should log rejection in history', () => {
      const taskId = 'test-task-019';
      store.create(taskId, '/path/to/prd.md');
      store.pauseForHITL(taskId, HITLCheckpoint.PRD_REVIEW);

      const rejected = store.reject(taskId, 'Needs revision');

      expect(rejected.history).toHaveLength(3);
      expect(rejected.history[2].event).toBe('HITL_REJECTED');
      expect(rejected.history[2].data.reason).toBe('Needs revision');
    });

    it('should throw error if session is not paused', () => {
      const taskId = 'test-task-020';
      store.create(taskId, '/path/to/prd.md');

      expect(() => {
        store.reject(taskId);
      }).toThrow('Invalid session state for rejection');
    });
  });

  describe('requestRerun', () => {
    it('should increment retry count on rerun request', () => {
      const taskId = 'test-task-021';
      store.create(taskId, '/path/to/prd.md');

      const rerun = store.requestRerun(taskId);

      expect(rerun.retryCount).toBe(1);
      expect(rerun.status).toBe(SessionStatus.INITIALIZED);
    });

    it('should set rerun phase from current phase', () => {
      const taskId = 'test-task-022';
      store.create(taskId, '/path/to/prd.md');
      store.updatePhase(taskId, 'Coding');

      const rerun = store.requestRerun(taskId);

      expect(rerun.rerunFrom).toBe('Coding');
    });

    it('should allow custom rerun phase', () => {
      const taskId = 'test-task-023';
      store.create(taskId, '/path/to/prd.md');
      store.updatePhase(taskId, 'Coding');

      const rerun = store.requestRerun(taskId, 'Planning');

      expect(rerun.rerunFrom).toBe('Planning');
    });

    it('should create rerun request file', () => {
      const taskId = 'test-task-024';
      store.create(taskId, '/path/to/prd.md');

      store.requestRerun(taskId);

      const rerunPath = path.join(RERUN_DIR, `${taskId}.json`);
      expect(fs.existsSync(rerunPath)).toBe(true);

      const rerunRequest = JSON.parse(fs.readFileSync(rerunPath, 'utf-8'));
      expect(rerunRequest.taskId).toBe(taskId);
      expect(rerunRequest.retryCount).toBe(1);
    });

    it('should log rerun request in history', () => {
      const taskId = 'test-task-025';
      store.create(taskId, '/path/to/prd.md');

      const rerun = store.requestRerun(taskId);

      expect(rerun.history).toHaveLength(2);
      expect(rerun.history[1].event).toBe('RERUN_REQUESTED');
    });

    it('should set USER_INTERVENTION_REQUIRED when MAX_RETRIES exceeded', () => {
      const taskId = 'test-task-026';
      store.create(taskId, '/path/to/prd.md');

      store.requestRerun(taskId); // retry 1
      store.requestRerun(taskId); // retry 2
      store.requestRerun(taskId); // retry 3
      const final = store.requestRerun(taskId); // retry 4 - exceeds max

      expect(final.retryCount).toBe(4);
      expect(final.status).toBe(SessionStatus.USER_INTERVENTION_REQUIRED);
    });

    it('should log max retries exceeded', () => {
      const taskId = 'test-task-027';
      store.create(taskId, '/path/to/prd.md');

      store.requestRerun(taskId);
      store.requestRerun(taskId);
      store.requestRerun(taskId);
      const final = store.requestRerun(taskId);

      const maxRetryEvent = final.history.find(h => h.event === 'MAX_RETRIES_EXCEEDED');
      expect(maxRetryEvent).toBeDefined();
      expect(maxRetryEvent.data.retryCount).toBe(4);
    });

    it('should not reset to INITIALIZED when max retries exceeded', () => {
      const taskId = 'test-task-028';
      store.create(taskId, '/path/to/prd.md');

      store.requestRerun(taskId);
      store.requestRerun(taskId);
      store.requestRerun(taskId);
      const final = store.requestRerun(taskId);

      expect(final.status).toBe(SessionStatus.USER_INTERVENTION_REQUIRED);
      expect(final.rerunFrom).toBeUndefined();
    });
  });

  describe('saveFeedback', () => {
    it('should save feedback to file system', () => {
      const taskId = 'test-task-029';
      store.create(taskId, '/path/to/prd.md');

      const feedback = { rating: 5, comment: 'Great work!' };
      const saved = store.saveFeedback(taskId, feedback);

      expect(saved.taskId).toBe(taskId);
      expect(saved.feedback).toEqual(feedback);
      expect(saved.createdAt).toBeDefined();
    });

    it('should create feedback file with timestamp', () => {
      const taskId = 'test-task-030';
      store.create(taskId, '/path/to/prd.md');

      store.saveFeedback(taskId, { comment: 'Test feedback' });

      const files = fs.readdirSync(FEEDBACK_DIR);
      const feedbackFile = files.find(f => f.startsWith(taskId));

      expect(feedbackFile).toBeDefined();
      expect(feedbackFile).toMatch(new RegExp(`${taskId}_\\d+\\.json`));
    });

    it('should log feedback in history', () => {
      const taskId = 'test-task-031';
      store.create(taskId, '/path/to/prd.md');

      const feedback = { rating: 4 };
      store.saveFeedback(taskId, feedback);

      const session = store.get(taskId);
      expect(session.history).toHaveLength(2);
      expect(session.history[1].event).toBe('FEEDBACK_SAVED');
    });
  });

  describe('complete', () => {
    it('should mark session as completed', () => {
      const taskId = 'test-task-032';
      store.create(taskId, '/path/to/prd.md');

      const result = { files: ['index.js', 'test.js'] };
      const completed = store.complete(taskId, result);

      expect(completed.status).toBe(SessionStatus.COMPLETED);
      expect(completed.completedAt).toBeDefined();
      expect(completed.result).toEqual(result);
    });

    it('should log completion in history', () => {
      const taskId = 'test-task-033';
      store.create(taskId, '/path/to/prd.md');

      const completed = store.complete(taskId);

      expect(completed.history).toHaveLength(2);
      expect(completed.history[1].event).toBe('SESSION_COMPLETED');
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        store.complete('non-existent-task');
      }).toThrow('Session not found: non-existent-task');
    });
  });

  describe('fail', () => {
    it('should mark session as failed with error message', () => {
      const taskId = 'test-task-034';
      store.create(taskId, '/path/to/prd.md');

      const error = new Error('Something went wrong');
      const failed = store.fail(taskId, error);

      expect(failed.status).toBe(SessionStatus.FAILED);
      expect(failed.failedAt).toBeDefined();
      expect(failed.error.message).toBe('Something went wrong');
      expect(failed.error.stack).toBeDefined();
    });

    it('should handle string error', () => {
      const taskId = 'test-task-035';
      store.create(taskId, '/path/to/prd.md');

      const failed = store.fail(taskId, 'Simple error message');

      expect(failed.status).toBe(SessionStatus.FAILED);
      expect(failed.error.message).toBe('Simple error message');
      expect(failed.error.stack).toBeNull();
    });

    it('should log failure in history', () => {
      const taskId = 'test-task-036';
      store.create(taskId, '/path/to/prd.md');

      const failed = store.fail(taskId, new Error('Test error'));

      expect(failed.history).toHaveLength(2);
      expect(failed.history[1].event).toBe('SESSION_FAILED');
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        store.fail('non-existent-task', new Error('Test'));
      }).toThrow('Session not found: non-existent-task');
    });
  });

  describe('getPendingHITLRequests', () => {
    it('should return empty array when no HITL requests', () => {
      const pending = store.getPendingHITLRequests();

      expect(pending).toEqual([]);
    });

    it('should return all pending HITL requests', () => {
      const taskId1 = 'test-task-037';
      const taskId2 = 'test-task-038';

      store.create(taskId1, '/path/to/prd1.md');
      store.create(taskId2, '/path/to/prd2.md');

      store.pauseForHITL(taskId1, HITLCheckpoint.QUERY_REVIEW);
      store.pauseForHITL(taskId2, HITLCheckpoint.DEPLOY_APPROVAL);

      const pending = store.getPendingHITLRequests();

      expect(pending).toHaveLength(2);
      expect(pending.map(p => p.taskId)).toContain(taskId1);
      expect(pending.map(p => p.taskId)).toContain(taskId2);
    });

    it('should not include approved HITL requests', () => {
      const taskId1 = 'test-task-039';
      const taskId2 = 'test-task-040';

      store.create(taskId1, '/path/to/prd1.md');
      store.create(taskId2, '/path/to/prd2.md');

      store.pauseForHITL(taskId1, HITLCheckpoint.QUERY_REVIEW);
      store.pauseForHITL(taskId2, HITLCheckpoint.DEPLOY_APPROVAL);

      store.approve(taskId1);

      const pending = store.getPendingHITLRequests();

      expect(pending).toHaveLength(1);
      expect(pending[0].taskId).toBe(taskId2);
    });

    it('should not include rejected HITL requests', () => {
      const taskId = 'test-task-041';

      store.create(taskId, '/path/to/prd.md');
      store.pauseForHITL(taskId, HITLCheckpoint.QUERY_REVIEW);
      store.reject(taskId);

      const pending = store.getPendingHITLRequests();

      expect(pending).toHaveLength(0);
    });
  });

  describe('getActiveSessions', () => {
    it('should return empty array when no sessions exist', () => {
      const active = store.getActiveSessions();

      expect(active).toEqual([]);
    });

    it('should return all active sessions', () => {
      const taskId1 = 'test-task-042';
      const taskId2 = 'test-task-043';

      store.create(taskId1, '/path/to/prd1.md');
      store.create(taskId2, '/path/to/prd2.md');

      const active = store.getActiveSessions();

      expect(active).toHaveLength(2);
      expect(active.map(s => s.taskId)).toContain(taskId1);
      expect(active.map(s => s.taskId)).toContain(taskId2);
    });

    it('should not include completed sessions', () => {
      const taskId1 = 'test-task-044';
      const taskId2 = 'test-task-045';

      store.create(taskId1, '/path/to/prd1.md');
      store.create(taskId2, '/path/to/prd2.md');

      store.complete(taskId1);

      const active = store.getActiveSessions();

      expect(active).toHaveLength(1);
      expect(active[0].taskId).toBe(taskId2);
    });

    it('should not include failed sessions', () => {
      const taskId1 = 'test-task-046';
      const taskId2 = 'test-task-047';

      store.create(taskId1, '/path/to/prd1.md');
      store.create(taskId2, '/path/to/prd2.md');

      store.fail(taskId1, new Error('Test error'));

      const active = store.getActiveSessions();

      expect(active).toHaveLength(1);
      expect(active[0].taskId).toBe(taskId2);
    });

    it('should include paused HITL sessions', () => {
      const taskId = 'test-task-048';

      store.create(taskId, '/path/to/prd.md');
      store.pauseForHITL(taskId, HITLCheckpoint.QUERY_REVIEW);

      const active = store.getActiveSessions();

      expect(active).toHaveLength(1);
      expect(active[0].status).toBe(SessionStatus.PAUSED_HITL);
    });

    it('should include running sessions', () => {
      const taskId = 'test-task-049';

      store.create(taskId, '/path/to/prd.md');
      store.updateStatus(taskId, SessionStatus.RUNNING);

      const active = store.getActiveSessions();

      expect(active).toHaveLength(1);
      expect(active[0].status).toBe(SessionStatus.RUNNING);
    });
  });

  describe('SessionStatus constants', () => {
    it('should have all required status constants', () => {
      expect(SessionStatus.INITIALIZED).toBe('INITIALIZED');
      expect(SessionStatus.RUNNING).toBe('RUNNING');
      expect(SessionStatus.PAUSED_HITL).toBe('PAUSED_HITL');
      expect(SessionStatus.APPROVED).toBe('APPROVED');
      expect(SessionStatus.REJECTED).toBe('REJECTED');
      expect(SessionStatus.COMPLETED).toBe('COMPLETED');
      expect(SessionStatus.FAILED).toBe('FAILED');
      expect(SessionStatus.USER_INTERVENTION_REQUIRED).toBe('USER_INTERVENTION_REQUIRED');
    });
  });

  describe('HITLCheckpoint constants', () => {
    it('should have all required checkpoint constants', () => {
      expect(HITLCheckpoint.PRD_REVIEW).toBe('PRD_REVIEW');
      expect(HITLCheckpoint.QUERY_REVIEW).toBe('QUERY_REVIEW');
      expect(HITLCheckpoint.DESIGN_APPROVAL).toBe('DESIGN_APPROVAL');
      expect(HITLCheckpoint.MANUAL_FIX).toBe('MANUAL_FIX');
      expect(HITLCheckpoint.DEPLOY_APPROVAL).toBe('DEPLOY_APPROVAL');
    });
  });
});
