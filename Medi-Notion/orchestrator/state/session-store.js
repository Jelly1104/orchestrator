/**
 * Session Store v1.1
 *
 * Orchestrator의 상태 관리 및 HITL Pause/Resume 지원
 * ESM 버전 (package.json "type": "module" 호환)
 *
 * 관련 문서:
 * - AGENT_ARCHITECTURE.md: HITL 5 checkpoints
 * - INCIDENT_PLAYBOOK.md: 로그 저장 위치 (.hitl/, .rerun/, .feedback/)
 * - ERROR_HANDLING_GUIDE.md: FeedbackLoop 연동
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 세션 저장 디렉토리
const SESSIONS_DIR = path.join(__dirname, 'sessions');
const HITL_DIR = path.join(__dirname, '..', 'logs', '.hitl');
const RERUN_DIR = path.join(__dirname, '..', 'logs', '.rerun');
const FEEDBACK_DIR = path.join(__dirname, '..', 'logs', '.feedback');

/**
 * 디렉토리 초기화
 */
function ensureDirectories() {
  [SESSIONS_DIR, HITL_DIR, RERUN_DIR, FEEDBACK_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

/**
 * 세션 상태 Enum
 * AGENT_ARCHITECTURE.md의 HITL 체크포인트 기반
 */
export const SessionStatus = {
  INITIALIZED: 'INITIALIZED',
  RUNNING: 'RUNNING',
  PAUSED_HITL: 'PAUSED_HITL',      // HITL 체크포인트에서 대기
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  USER_INTERVENTION_REQUIRED: 'USER_INTERVENTION_REQUIRED'
};

/**
 * HITL 체크포인트 유형
 * AGENT_ARCHITECTURE.md 기반
 */
export const HITLCheckpoint = {
  PRD_REVIEW: 'PRD_REVIEW',           // 1. PRD 보완 필요 시
  QUERY_REVIEW: 'QUERY_REVIEW',       // 2. 쿼리 검토 (위험 쿼리)
  DESIGN_APPROVAL: 'DESIGN_APPROVAL', // 3. 설계 승인 필요 시
  MANUAL_FIX: 'MANUAL_FIX',           // 4. 수동 수정 필요 (3회 FAIL)
  DEPLOY_APPROVAL: 'DEPLOY_APPROVAL'  // 5. 배포 승인
};

/**
 * 세션 스토어 클래스
 */
export class SessionStore {
  constructor() {
    ensureDirectories();
  }

  /**
   * 세션 파일 경로 생성
   */
  _getSessionPath(taskId) {
    return path.join(SESSIONS_DIR, `${taskId}.json`);
  }

  /**
   * HITL 대기열 파일 경로
   */
  _getHITLPath(taskId) {
    return path.join(HITL_DIR, `${taskId}.json`);
  }

  /**
   * 새 세션 생성
   */
  create(taskId, prdPath, metadata = {}) {
    const session = {
      taskId,
      prdPath,
      status: SessionStatus.INITIALIZED,
      currentPhase: null,
      currentCheckpoint: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [],
      metadata,
      retryCount: 0,
      maxRetries: 3  // ERROR_HANDLING_GUIDE.md 기준
    };

    this._save(taskId, session);
    this._logHistory(taskId, 'SESSION_CREATED', { prdPath });

    return session;
  }

  /**
   * 세션 조회
   */
  get(taskId) {
    const sessionPath = this._getSessionPath(taskId);
    if (!fs.existsSync(sessionPath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(sessionPath, 'utf-8'));
  }

  /**
   * 세션 상태 업데이트
   */
  updateStatus(taskId, status, details = {}) {
    const session = this.get(taskId);
    if (!session) {
      throw new Error(`Session not found: ${taskId}`);
    }

    session.status = status;
    session.updatedAt = new Date().toISOString();
    Object.assign(session, details);

    this._save(taskId, session);
    this._logHistory(taskId, 'STATUS_CHANGED', { status, ...details });

    return session;
  }

  /**
   * Phase 업데이트 (Planning, Coding, Review 등)
   */
  updatePhase(taskId, phase) {
    return this.updateStatus(taskId, SessionStatus.RUNNING, { currentPhase: phase });
  }

  /**
   * HITL 체크포인트에서 일시 정지
   */
  pauseForHITL(taskId, checkpoint, context = {}) {
    const session = this.get(taskId);
    if (!session) {
      throw new Error(`Session not found: ${taskId}`);
    }

    session.status = SessionStatus.PAUSED_HITL;
    session.currentCheckpoint = checkpoint;
    session.hitlContext = {
      checkpoint,
      pausedAt: new Date().toISOString(),
      context
    };
    session.updatedAt = new Date().toISOString();

    this._save(taskId, session);
    this._saveHITLRequest(taskId, session);
    this._logHistory(taskId, 'PAUSED_FOR_HITL', { checkpoint, context });

    return session;
  }

  /**
   * HITL 승인
   */
  approve(taskId, approverComment = '') {
    const session = this.get(taskId);
    if (!session || session.status !== SessionStatus.PAUSED_HITL) {
      throw new Error(`Invalid session state for approval: ${taskId}`);
    }

    session.status = SessionStatus.APPROVED;
    session.hitlContext.approvedAt = new Date().toISOString();
    session.hitlContext.approverComment = approverComment;
    session.updatedAt = new Date().toISOString();

    this._save(taskId, session);
    this._removeHITLRequest(taskId);
    this._logHistory(taskId, 'HITL_APPROVED', { checkpoint: session.currentCheckpoint, approverComment });

    return session;
  }

  /**
   * HITL 거부
   */
  reject(taskId, reason = '') {
    const session = this.get(taskId);
    if (!session || session.status !== SessionStatus.PAUSED_HITL) {
      throw new Error(`Invalid session state for rejection: ${taskId}`);
    }

    session.status = SessionStatus.REJECTED;
    session.hitlContext.rejectedAt = new Date().toISOString();
    session.hitlContext.rejectionReason = reason;
    session.updatedAt = new Date().toISOString();

    this._save(taskId, session);
    this._removeHITLRequest(taskId);
    this._logHistory(taskId, 'HITL_REJECTED', { checkpoint: session.currentCheckpoint, reason });

    return session;
  }

  /**
   * 재실행 요청
   */
  requestRerun(taskId, fromPhase = null) {
    const session = this.get(taskId);
    if (!session) {
      throw new Error(`Session not found: ${taskId}`);
    }

    session.retryCount += 1;

    if (session.retryCount > session.maxRetries) {
      session.status = SessionStatus.USER_INTERVENTION_REQUIRED;
      this._save(taskId, session);
      this._logHistory(taskId, 'MAX_RETRIES_EXCEEDED', { retryCount: session.retryCount });
      return session;
    }

    session.status = SessionStatus.INITIALIZED;
    session.rerunFrom = fromPhase || session.currentPhase;
    session.updatedAt = new Date().toISOString();

    // 재실행 요청 파일 생성
    const rerunPath = path.join(RERUN_DIR, `${taskId}.json`);
    fs.writeFileSync(rerunPath, JSON.stringify({
      taskId,
      requestedAt: new Date().toISOString(),
      fromPhase: session.rerunFrom,
      retryCount: session.retryCount
    }, null, 2));

    this._save(taskId, session);
    this._logHistory(taskId, 'RERUN_REQUESTED', { fromPhase: session.rerunFrom, retryCount: session.retryCount });

    return session;
  }

  /**
   * 피드백 저장
   */
  saveFeedback(taskId, feedback) {
    const feedbackData = {
      taskId,
      feedback,
      createdAt: new Date().toISOString()
    };

    const feedbackPath = path.join(FEEDBACK_DIR, `${taskId}_${Date.now()}.json`);
    fs.writeFileSync(feedbackPath, JSON.stringify(feedbackData, null, 2));

    this._logHistory(taskId, 'FEEDBACK_SAVED', { feedback });

    return feedbackData;
  }

  /**
   * 세션 완료
   */
  complete(taskId, result = {}) {
    const session = this.get(taskId);
    if (!session) {
      throw new Error(`Session not found: ${taskId}`);
    }

    session.status = SessionStatus.COMPLETED;
    session.completedAt = new Date().toISOString();
    session.result = result;
    session.updatedAt = new Date().toISOString();

    this._save(taskId, session);
    this._logHistory(taskId, 'SESSION_COMPLETED', { result });

    return session;
  }

  /**
   * 세션 실패
   */
  fail(taskId, error) {
    const session = this.get(taskId);
    if (!session) {
      throw new Error(`Session not found: ${taskId}`);
    }

    session.status = SessionStatus.FAILED;
    session.failedAt = new Date().toISOString();
    session.error = {
      message: error.message || error,
      stack: error.stack || null
    };
    session.updatedAt = new Date().toISOString();

    this._save(taskId, session);
    this._logHistory(taskId, 'SESSION_FAILED', { error: session.error });

    return session;
  }

  /**
   * 대기 중인 HITL 요청 목록
   */
  getPendingHITLRequests() {
    if (!fs.existsSync(HITL_DIR)) {
      return [];
    }

    return fs.readdirSync(HITL_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => JSON.parse(fs.readFileSync(path.join(HITL_DIR, f), 'utf-8')));
  }

  /**
   * 모든 활성 세션 조회
   */
  getActiveSessions() {
    if (!fs.existsSync(SESSIONS_DIR)) {
      return [];
    }

    return fs.readdirSync(SESSIONS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => JSON.parse(fs.readFileSync(path.join(SESSIONS_DIR, f), 'utf-8')))
      .filter(s => ![SessionStatus.COMPLETED, SessionStatus.FAILED].includes(s.status));
  }

  // ===== Private Methods =====

  _save(taskId, session) {
    fs.writeFileSync(this._getSessionPath(taskId), JSON.stringify(session, null, 2));
  }

  _saveHITLRequest(taskId, session) {
    fs.writeFileSync(this._getHITLPath(taskId), JSON.stringify({
      taskId,
      checkpoint: session.currentCheckpoint,
      context: session.hitlContext,
      createdAt: new Date().toISOString()
    }, null, 2));
  }

  _removeHITLRequest(taskId) {
    const hitlPath = this._getHITLPath(taskId);
    if (fs.existsSync(hitlPath)) {
      fs.unlinkSync(hitlPath);
    }
  }

  _logHistory(taskId, event, data = {}) {
    const session = this.get(taskId);
    if (session) {
      session.history.push({
        event,
        data,
        timestamp: new Date().toISOString()
      });
      fs.writeFileSync(this._getSessionPath(taskId), JSON.stringify(session, null, 2));
    }
  }
}

// 싱글톤 인스턴스
export const sessionStore = new SessionStore();

// default export
export default {
  sessionStore,
  SessionStore,
  SessionStatus,
  HITLCheckpoint
};
