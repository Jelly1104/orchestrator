/**
 * Orchestrator - 메인 오케스트레이션 로직
 *
 * Leader ↔ Sub-agent 자동 협업 시스템
 *
 * 흐름:
 * 1. Task 입력 (또는 HITL Resume)
 * 2. (Auto) Leader Planning
 * 3. (Auto) Sub-agent Coding
 * 4. (Auto) Leader Review
 * 5. FAIL 시 재시도 (최대 5회 - 하드코딩 상한)
 * 6. 완료 또는 사용자 개입 요청
 *
 * 보안 기능 (v3.2.0):
 * - 입력 검증 (taskId, taskDescription)
 * - Path Traversal 방지
 * - API 키 보호
 * - Rate Limiting
 *
 * HITL 지원 (v3.5.0):
 * - Session Store 연동
 * - Pause/Resume 메커니즘
 * - HITL 체크포인트 (5종)
 * - Resume 로직 (APPROVED 세션 재개)
 * - Graceful Exit (process.exit)
 * - Feature Flag 연동
 *
 * Phase 3: Skill-Centric Architecture (v4.0.0):
 * - SkillRegistry 연동 (DI 패턴)
 * - 동적 스킬 로딩
 * - 스킬 기반 에이전트 조회
 *
 * P1-1: Phase B Reviewer (v4.1.0):
 * - 설계 문서 품질 검증 추가
 * - ReviewerSkill을 Phase B 완료 후 호출
 *
 * P1-2: Auto-Routing (v4.2.0):
 * - PRD type 기반 파이프라인 자동 선택
 * - QUANTITATIVE → Analysis, QUALITATIVE → Design, MIXED → Mixed
 * - 명시적 라우팅 결정 로깅
 *
 * P2-2: Doc-Sync (v4.3.0):
 * - Phase B 완료 후 Notion 문서 동기화 자동 호출
 * - Reviewer PASS 시에만 동기화 실행
 *
 * @version 4.3.0
 * @updated 2025-12-26 - [P2-2] Doc-Sync Notion 자동 동기화 추가 (Milestone 3)
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { LeaderAgent } from './agents/leader.js';
import { DesignAgent } from './agents/design-agent.js';
import { CodeAgent } from './agents/code-agent.js';
import { AnalysisAgent } from './agents/analysis-agent.js';
import { MetricsTracker } from './metrics/tracker.js';
import { FeedbackLoopController } from './agents/feedback-loop.js';
import { PRDAnalyzer } from './agents/prd-analyzer.js';

// Phase 3: SkillRegistry 연동 (DI 패턴)
import { SkillRegistry, SkillType, getSkillRegistry } from './tools/tool-registry.js';

// Phase D: Security Layer 연동
import { isEnabled } from './config/feature-flags.js';
import { getKillSwitch } from './security/kill-switch.js';
import { getRateLimiter } from './security/rate-limiter.js';
import { getSecurityMonitor, EVENT_TYPES } from './security/security-monitor.js';
import { getAuditLogger } from './utils/audit-logger.js';

// P1-1: Phase B Reviewer 연동
import { ReviewerSkill } from './tools/reviewer/index.js';

// P2-2: Doc-Sync 연동 (Milestone 3)
import { DocSyncSkill } from './tools/doc-sync/index.js';

// P0-3: SQL Validator 연동 (보안 검증)
import { SQLValidator } from './security/sql-validator.js';

// Phase 0: Session Store 연동 (Pause/Resume 지원)
const require = createRequire(import.meta.url);
const { sessionStore, SessionStatus, HITLCheckpoint, HITLDecision } = require('./state/session-store.js');

// ========== 보안 상수 (하드코딩 - 사용자 설정 무시) ==========
const SECURITY_LIMITS = {
  MAX_RETRIES: 5,                    // 최대 재시도 횟수 (하드코딩 상한)
  MAX_RETRIES_PER_HOUR: 20,          // 시간당 최대 재시도
  MAX_TASK_DESCRIPTION_LENGTH: 10000, // taskDescription 최대 길이
  MAX_PRD_CONTENT_LENGTH: 50000,     // prdContent 최대 길이
  TASK_ID_PATTERN: /^[a-zA-Z0-9_-]+$/, // taskId 허용 패턴
  MAX_FEATURES_PER_ITERATION: 50,    // 단일 iteration 최대 기능 수
  TOKEN_WARNING_THRESHOLD: 80000,    // 토큰 경고 임계값
};

// 보호된 경로 목록 (Constitution 보호)
const PROTECTED_PATHS = [
  '.claude/rules/',
  '.claude/workflows/',
  '.claude/context/',
  'CLAUDE.md',
  '.env',
  '/.ssh/',
  '/etc/',
  'System32',
];

// Rate Limiting 상태
const rateLimitState = {
  retryCount: 0,
  windowStart: Date.now(),
};

export class Orchestrator {
  constructor(config = {}) {
    this.projectRoot = path.resolve(config.projectRoot || process.cwd());
    // maxRetries는 하드코딩 상한 적용
    this.maxRetries = Math.min(config.maxRetries || 3, SECURITY_LIMITS.MAX_RETRIES);
    this.autoApprove = config.autoApprove !== false; // 기본값 true
    this.saveFiles = config.saveFiles !== false; // 기본값 true
    // Pre-Step: 로그 경로를 workspace/logs로 변경 (2025-12-22)
    this.logDir = path.join(this.projectRoot, 'workspace/logs');

    // [New] Case-Centric Path Helpers (v4.3.0)
    // [Fix v4.3.14] 모든 산출물을 docs/cases/{caseId}/ 하위에 통합 저장
    // extractCaseId()로 날짜/타임스탬프 제거하여 Phase A/B/C 산출물이 같은 폴더에 저장되도록 함
    this.caseOutputDir = (taskId) => path.join(this.projectRoot, 'docs/cases', this.extractCaseId(taskId));
    this.analysisDir = (taskId) => path.join(this.caseOutputDir(taskId), 'analysis');
    this.visualsDir = (taskId) => path.join(this.caseOutputDir(taskId), 'visuals');

    // Multi-LLM Provider 설정
    this.providerConfig = {
      provider: config.provider || 'anthropic',
      providerConfig: config.providerConfig || {},
      fallbackOrder: config.fallbackOrder || ['anthropic', 'openai', 'gemini'],
      useFallback: config.useFallback !== false // 기본값 true
    };

    // 에이전트 초기화 (Provider 설정 전달)
    this.leader = new LeaderAgent({
      projectRoot: this.projectRoot,
      ...this.providerConfig
    });
    this.designAgent = new DesignAgent({
      projectRoot: this.projectRoot,
      ...this.providerConfig
    });
    // Note: SubAgent는 더 이상 사용하지 않음 (tools 개념으로 대체)

    // Code Agent 초기화 (v1.0.0 - 코드 구현 전담)
    this.codeAgent = new CodeAgent({
      projectRoot: this.projectRoot,
      ...this.providerConfig
    });

    // Feedback Loop Controller 초기화
    this.feedbackLoop = new FeedbackLoopController(this.projectRoot, {
      maxRetries: this.maxRetries
    });

    // PRD Analyzer 초기화 (v2 유형 판별용)
    this.prdAnalyzer = new PRDAnalyzer();

    // AnalysisAgent 초기화 (정량적 PRD용)
    this.analysisAgent = new AnalysisAgent({
      projectRoot: this.projectRoot,
      ...this.providerConfig,
      dbConfig: config.dbConfig,
      // Pre-Step: 분석 출력 경로를 workspace/analysis로 변경 (2025-12-22)
      outputDir: config.analysisOutputDir || path.join(this.projectRoot, 'workspace', 'analysis')
    });

    // ============================================================
    // Phase 3: SkillRegistry 초기화 (DI 패턴)
    // 기존 에이전트(leader, subagent 등)는 호환성을 위해 유지
    // 새로운 스킬 기반 에이전트는 SkillRegistry를 통해 조회
    // ============================================================
    this.skillRegistry = new SkillRegistry({
      projectRoot: this.projectRoot,
      providerConfig: this.providerConfig,
    });

    // 스킬 초기화 상태 (lazy loading)
    this.skillsInitialized = false;
  }

  // ========== 보안: 입력 검증 ==========

  /**
   * taskId에서 순수 케이스명 추출 (날짜/타임스탬프 제거)
   * @param {string} taskId - 태스크 ID (예: case5-dormancy-20251222, case5-dormancy-1766037994472)
   * @returns {string} - 순수 케이스명 (예: case5-dormancy)
   */
  extractCaseId(taskId) {
    // 날짜(8자리) 또는 타임스탬프(13자리 이상) 접미사 제거
    return taskId.replace(/-(\d{8}|\d{13,})$/, '');
  }

  /**
   * taskId 검증 (Path Traversal 방지)
   */
  validateTaskId(taskId) {
    if (!taskId || typeof taskId !== 'string') {
      throw new Error('[SECURITY] Invalid taskId: must be a non-empty string');
    }
    if (!SECURITY_LIMITS.TASK_ID_PATTERN.test(taskId)) {
      throw new Error(`[SECURITY] Invalid taskId format: only alphanumeric, underscore, hyphen allowed`);
    }
    if (taskId.includes('..') || taskId.includes('/') || taskId.includes('\\')) {
      throw new Error('[SECURITY] Path traversal detected in taskId');
    }
    return taskId;
  }

  /**
   * taskDescription 검증 및 새니타이징
   */
  sanitizeTaskDescription(description) {
    if (!description || typeof description !== 'string') {
      throw new Error('[SECURITY] Invalid taskDescription: must be a non-empty string');
    }

    // 길이 제한
    if (description.length > SECURITY_LIMITS.MAX_TASK_DESCRIPTION_LENGTH) {
      console.warn(`[SECURITY] taskDescription truncated from ${description.length} to ${SECURITY_LIMITS.MAX_TASK_DESCRIPTION_LENGTH} chars`);
      description = description.substring(0, SECURITY_LIMITS.MAX_TASK_DESCRIPTION_LENGTH);
    }

    return description;
  }

  /**
   * prdContent 검증
   */
  sanitizePrdContent(content) {
    if (!content) return '';
    if (typeof content !== 'string') {
      throw new Error('[SECURITY] Invalid prdContent: must be a string');
    }

    // 길이 제한 (토큰 예산 초과 방지 - DoS 방어)
    if (content.length > SECURITY_LIMITS.MAX_PRD_CONTENT_LENGTH) {
      console.warn(`[SECURITY] prdContent truncated from ${content.length} to ${SECURITY_LIMITS.MAX_PRD_CONTENT_LENGTH} chars`);
      content = content.substring(0, SECURITY_LIMITS.MAX_PRD_CONTENT_LENGTH);
    }

    return content;
  }

  /**
   * 파일 경로 검증 (Path Traversal 방지)
   */
  validateFilePath(filePath) {
    const resolved = path.resolve(this.projectRoot, filePath);
    if (!resolved.startsWith(this.projectRoot)) {
      throw new Error(`[SECURITY] Path traversal detected: ${filePath}`);
    }
    return resolved;
  }

  /**
   * Rate Limiting 체크
   * Security Layer 연동 (Phase D)
   */
  checkRateLimit() {
    // Security Layer 활성화 시 RateLimiter 사용
    if (isEnabled('SECURITY_RATE_LIMIT')) {
      const rateLimiter = getRateLimiter();
      const result = rateLimiter.checkLimit('orchestrator', 'execute');

      if (!result.allowed) {
        const securityMonitor = getSecurityMonitor();
        securityMonitor.report(EVENT_TYPES.RATE_LIMIT_EXCEEDED, {
          agent: 'Orchestrator',
          operation: 'execute',
          retryAfter: result.retryAfter,
        });

        const logger = getAuditLogger();
        logger.security('RATE_LIMIT_EXCEEDED', 'Orchestrator rate limit exceeded', result);

        throw new Error(`[SECURITY] Rate limit exceeded. Retry after ${result.retryAfter}ms`);
      }
      return;
    }

    // 레거시 방식 (fallback)
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    // 1시간 윈도우 리셋
    if (now - rateLimitState.windowStart > oneHour) {
      rateLimitState.retryCount = 0;
      rateLimitState.windowStart = now;
    }

    if (rateLimitState.retryCount >= SECURITY_LIMITS.MAX_RETRIES_PER_HOUR) {
      throw new Error(`[SECURITY] Rate limit exceeded: ${SECURITY_LIMITS.MAX_RETRIES_PER_HOUR} retries per hour`);
    }

    rateLimitState.retryCount++;
  }

  // ========== Phase 3: Skill-Centric Methods ==========

  /**
   * 스킬 레지스트리 초기화 (Lazy Loading)
   * @param {string[]} skillTypes - 로드할 스킬 목록 (옵션)
   * @returns {Promise<Object>} 로드 결과
   */
  async initializeSkills(skillTypes = null) {
    if (this.skillsInitialized) {
      return this.skillRegistry.getStatus();
    }

    const result = await this.skillRegistry.loadAll(skillTypes);
    this.skillsInitialized = true;

    return result;
  }

  /**
   * 스킬 기반 에이전트 조회 (DI 패턴)
   * @param {string} skillType - 스킬 유형 (SkillType enum 사용)
   * @param {Object} config - 추가 설정 (옵션)
   * @returns {Promise<Object>} 에이전트 인스턴스
   */
  async getSkillAgent(skillType, config = {}) {
    // 스킬이 초기화되지 않은 경우 자동 초기화
    if (!this.skillsInitialized) {
      await this.initializeSkills();
    }

    return this.skillRegistry.getAgent(skillType, config);
  }

  /**
   * ReviewAgent 조회 (스킬 기반)
   * @returns {Promise<Object>} ReviewAgent 인스턴스
   */
  async getReviewAgent() {
    return this.getSkillAgent(SkillType.REVIEW);
  }

  /**
   * 스킬 레지스트리 상태 조회
   * @returns {Object} 상태 정보
   */
  getSkillStatus() {
    return this.skillRegistry.getStatus();
  }

  /**
   * 로그 데이터에서 민감 정보 마스킹
   */
  maskSensitiveData(data) {
    const masked = JSON.stringify(data);
    // API 키 패턴 마스킹
    return masked
      .replace(/sk-ant-[a-zA-Z0-9-]+/g, 'sk-ant-***')
      .replace(/sk-[a-zA-Z0-9-]+/g, 'sk-***')
      .replace(/"apiKey"\s*:\s*"[^"]+"/g, '"apiKey": "***"');
  }

  // ========== Phase 0: Session Store 연동 (Pause/Resume) ==========

  /**
   * 세션 생성 및 초기화
   * @param {string} taskId - 태스크 ID
   * @param {string} prdPath - PRD 파일 경로 또는 내용
   * @param {Object} metadata - 추가 메타데이터
   * @returns {Object} - 생성된 세션
   */
  createSession(taskId, prdPath, metadata = {}) {
    return sessionStore.create(taskId, prdPath, {
      ...metadata,
      projectRoot: this.projectRoot,
      maxRetries: this.maxRetries,
      autoApprove: this.autoApprove
    });
  }

  /**
   * 세션 상태 조회
   * @param {string} taskId - 태스크 ID
   * @returns {Object|null} - 세션 정보
   */
  getSession(taskId) {
    return sessionStore.get(taskId);
  }

  /**
   * HITL 체크포인트에서 일시 정지
   * @param {string} taskId - 태스크 ID
   * @param {string} checkpoint - 체크포인트 유형
   * @param {Object} context - 체크포인트 컨텍스트 (검토 대상 등)
   * @returns {Object} - 업데이트된 세션
   */
  pauseForHITL(taskId, checkpoint, context = {}) {
    console.log(`\n⏸️  HITL 체크포인트 도달: ${checkpoint}`);
    console.log(`   → 사용자 승인 대기 중... (taskId: ${taskId})`);

    return sessionStore.pauseForHITL(taskId, checkpoint, context);
  }

  /**
   * HITL 승인 대기 (폴링 방식)
   * @param {string} taskId - 태스크 ID
   * @param {number} timeout - 타임아웃 (ms), 0이면 무한 대기
   * @param {number} pollInterval - 폴링 간격 (ms)
   * @returns {Promise<Object>} - 승인 결과
   */
  async waitForApproval(taskId, timeout = 0, pollInterval = 2000) {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkApproval = () => {
        const session = sessionStore.get(taskId);

        if (!session) {
          return reject(new Error(`Session not found: ${taskId}`));
        }

        // 승인됨
        if (session.status === SessionStatus.APPROVED) {
          console.log(`\n✅ HITL 승인됨: ${taskId}`);
          return resolve({ approved: true, session });
        }

        // 거부됨
        if (session.status === SessionStatus.REJECTED) {
          console.log(`\n❌ HITL 거부됨: ${taskId}`);
          console.log(`   사유: ${session.hitlContext?.rejectionReason || 'N/A'}`);
          return resolve({ approved: false, rejected: true, session });
        }

        // 타임아웃 체크
        if (timeout > 0 && (Date.now() - startTime) > timeout) {
          return reject(new Error(`HITL approval timeout: ${timeout}ms`));
        }

        // 다음 폴링
        setTimeout(checkApproval, pollInterval);
      };

      checkApproval();
    });
  }

  /**
   * 세션 재개 (Pause 후 Resume)
   * @param {string} taskId - 태스크 ID
   * @returns {Object} - 재개된 세션
   */
  resumeSession(taskId) {
    const session = sessionStore.get(taskId);

    if (!session) {
      throw new Error(`Session not found: ${taskId}`);
    }

    if (session.status !== SessionStatus.APPROVED) {
      throw new Error(`Cannot resume: session status is ${session.status}`);
    }

    console.log(`\n▶️  세션 재개: ${taskId}`);
    console.log(`   Phase: ${session.currentPhase}`);
    console.log(`   Checkpoint: ${session.currentCheckpoint}`);

    // 상태를 RUNNING으로 변경
    return sessionStore.updateStatus(taskId, SessionStatus.RUNNING);
  }

  /**
   * 세션 완료 처리
   * @param {string} taskId - 태스크 ID
   * @param {Object} result - 실행 결과
   */
  completeSession(taskId, result = {}) {
    return sessionStore.complete(taskId, result);
  }

  /**
   * 세션 실패 처리
   * @param {string} taskId - 태스크 ID
   * @param {Error|string} error - 오류 정보
   */
  failSession(taskId, error) {
    return sessionStore.fail(taskId, error);
  }

  /**
   * HITL 체크포인트가 필요한지 확인
   * v1.2.0: missing 배열 체크 개선, review_score 추가
   * @param {string} phase - 현재 phase
   * @param {Object} context - 컨텍스트 정보
   * @returns {string|null} - 필요한 체크포인트 또는 null
   */
  checkHITLRequired(phase, context = {}) {
    // AGENT_ARCHITECTURE.md 기반 HITL 체크포인트
    switch (phase) {
      case 'planning':
        // 1. PRD 보완 필요 시 (v1.2.0: missing 배열 체크 개선)
        // v1.3.0: HIGH severity gap이 있으면 autoApprove를 무시하고 반드시 HITL 트리거
        // 단, hasHighSeverityGaps가 true면 autoApprove와 상관없이 체크포인트 반환
        if (context.gapCheck?.hasHighSeverityGaps) {
          return HITLCheckpoint.PRD_REVIEW;
        }
        // 일반 missing은 autoApprove 시 스킵
        if (!this.autoApprove && context.gapCheck?.missing?.length > 0) {
          return HITLCheckpoint.PRD_REVIEW;
        }
        break;

      case 'query':
        // 2. 위험 쿼리 검토
        if (context.isDangerous) {
          return HITLCheckpoint.QUERY_REVIEW;
        }
        break;

      case 'design':
        // 3. 설계 승인 필요 시
        if (context.requiresApproval) {
          return HITLCheckpoint.DESIGN_APPROVAL;
        }
        break;

      case 'review_fail':
        // 4. 3회 FAIL 시 수동 수정
        if (context.retryCount >= 3) {
          return HITLCheckpoint.MANUAL_FIX;
        }
        break;

      case 'review_score':
        // 4-1. Review Score 80점 미만 시 수동 수정 (v1.2.0 신규)
        if (context.score !== undefined && context.score < 80) {
          return HITLCheckpoint.MANUAL_FIX;
        }
        break;

      case 'deploy':
        // 5. 배포 승인
        return HITLCheckpoint.DEPLOY_APPROVAL;
    }

    return null;
  }

  /**
   * 대기 중인 HITL 요청 목록 조회
   * @returns {Array} - 대기 중인 HITL 요청 목록
   */
  getPendingHITLRequests() {
    return sessionStore.getPendingHITLRequests();
  }

  /**
   * 활성 세션 목록 조회
   * @returns {Array} - 활성 세션 목록
   */
  getActiveSessions() {
    return sessionStore.getActiveSessions();
  }

  /**
   * 오케스트레이션 실행
   * v3.5.0: Resume 로직 추가 - 기존 세션 재개 지원
   * @param {string} taskDescription - 작업 설명
   * @param {Object} options - 추가 옵션
   * @returns {Object} - 실행 결과
   */
  async run(taskDescription, options = {}) {
    // ========== KillSwitch 체크 (Phase D) ==========
    if (isEnabled('MONITORING_KILL_SWITCH')) {
      const killSwitch = getKillSwitch();
      if (killSwitch.isHalted()) {
        const status = killSwitch.getStatus();
        const logger = getAuditLogger();
        logger.security('ORCHESTRATOR_BLOCKED', 'System is halted by KillSwitch', status);
        throw new Error(`[SECURITY] System halted: ${status.haltReason}. Recovery required.`);
      }
    }

    // ========== 보안: 입력 검증 (P0) ==========
    const rawTaskId = options.taskId || `task-${Date.now()}`;
    // 친화적 Task ID 생성 (v3.3.0)
    const friendlyTaskId = this.generateFriendlyTaskId(rawTaskId, taskDescription);
    const taskId = this.validateTaskId(friendlyTaskId);
    const sanitizedDescription = this.sanitizeTaskDescription(taskDescription);
    const prdContent = this.sanitizePrdContent(options.prdContent || '');

    // Rate Limiting 체크
    this.checkRateLimit();

    // ========== Phase 0: Resume 로직 (v3.5.1) ==========
    // Gemini 조언: PAUSED_HITL 상태이고 approvedAt 값이 존재하면 재개
    if (isEnabled('HITL_RESUME_ENABLED')) {
      const existingSession = sessionStore.get(taskId);

      // 조건: PAUSED_HITL + approvedAt 존재 (승인 완료된 HITL)
      // 또는 APPROVED 상태 (approve() 메서드로 상태 전환된 경우)
      const isApprovedHITL = existingSession && (
        existingSession.status === SessionStatus.APPROVED ||
        (existingSession.status === SessionStatus.PAUSED_HITL &&
         existingSession.hitlContext?.approvedAt)
      );

      if (isApprovedHITL) {
        console.log('\n🔄 HITL 승인 확인. 작업을 재개합니다.');
        console.log(`   Task ID: ${taskId}`);
        console.log(`   중단 지점: ${existingSession.currentCheckpoint}`);
        console.log(`   Phase: ${existingSession.currentPhase}`);
        console.log(`   승인 시각: ${existingSession.hitlContext?.approvedAt || 'N/A'}`);

        // 세션 재개
        this.resumeSession(taskId);

        // 중단 지점에 따라 적절한 위치부터 재개
        return await this._resumeFromCheckpoint(taskId, existingSession, options);
      }
    }

    // 메트릭 트래커 초기화
    const metrics = new MetricsTracker(taskId);

    console.log(`\n🚀 Task: ${taskId}`);

    // ========== Phase 0: 세션 생성 ==========
    const session = this.createSession(taskId, prdContent || sanitizedDescription, {
      pipeline: options.pipeline || 'auto',
      mode: options.mode || null
    });
    sessionStore.updatePhase(taskId, 'initialized');

    let retryCount = 0;
    let currentFiles = {};
    let sdd = '';
    let result = null;

    try {
      // ========== Phase 0: PRD 파이프라인 판별 (v2.0.0: type 제거) ==========
      const prdClassification = this.prdAnalyzer.classifyPRDv2(prdContent);
      const pipeline = prdClassification?.pipeline || 'design';

      // P1-2: 명시적 라우팅 결정 (type 제거됨)
      const routingDecision = this._determineRoutingDecision(pipeline, options);

      // ========== 잘못된 파이프라인 검사 - FAIL 처리 ==========
      if (routingDecision.invalidPipeline) {
        console.log(`   Pipeline: ${routingDecision.invalidPipeline} (INVALID)`);

        // FAIL 리포트 출력
        this._printInvalidPipelineFailReport(taskId, routingDecision.invalidPipeline, metrics);

        metrics.endPhase('planning', 'fail');

        return {
          success: false,
          taskId,
          error: `유효하지 않은 파이프라인: ${routingDecision.invalidPipeline}`,
          suggestion: '유효한 파이프라인: analysis, design, analyzed_design, code, ui_mockup, full'
        };
      }

      console.log(`   Pipeline: ${routingDecision.selectedPipeline}`);

      // ========== v1.3.0: PRD Gap Check - HIGH severity gap 강제 FAIL ==========
      // 빈 PRD나 필수 항목 대부분 누락 시 autoApprove와 상관없이 즉시 FAIL
      const gapCheck = prdClassification?.gapCheck;
      if (gapCheck?.hasHighSeverityGaps) {
        // 즉시 FAIL 리포트 출력 (중복 메시지 없이 리포트만)
        this._printGapCheckFailReport(taskId, routingDecision.selectedPipeline, gapCheck, metrics);

        metrics.endPhase('planning', 'fail');

        return {
          success: false,
          taskId,
          error: 'PRD Gap Check 실패 - 필수 섹션 누락',
          gapCheck,
          suggestion: 'PRD에 필수 4개 섹션을 추가해주세요: 목적, 타겟유저, 핵심기능, 성공지표'
        };
      }

      // ========== HITL: PRD_REVIEW 체크포인트 (Graceful Exit 패턴) ==========
      // PRD Gap Check 결과가 불완전할 경우 (LOW/MEDIUM severity) 사람의 검토 필요
      if (gapCheck?.missing?.length > 0) {
        const prdCheckpoint = this.checkHITLRequired('planning', {
          gapCheck: gapCheck
        });

        if (prdCheckpoint) {
          sessionStore.updatePhase(taskId, 'prd_review');
          await this.pauseForHITL(taskId, prdCheckpoint, {
            missing: gapCheck.missing,
            pipeline,
            message: 'PRD에 필수 항목이 누락되었습니다. 검토 후 승인하거나 PRD를 보완해주세요.'
          });

          // Graceful Exit: 프로세스 종료 후 재실행 시 Resume 로직에서 처리
          if (isEnabled('HITL_GRACEFUL_EXIT')) {
            console.log('\n⏸️ [PRD 검토 필요] Viewer에서 승인해주세요.');
            return this._gracefulExitForHITL(taskId, prdCheckpoint);
          }

          // Fallback: 폴링 방식 (HITL_GRACEFUL_EXIT=false일 때)
          const approval = await this.waitForApproval(taskId);
          if (!approval.approved) {
            throw new Error(`PRD Review 거부됨: ${approval.session?.hitlContext?.rejectionReason || '사유 없음'}`);
          }
          this.resumeSession(taskId);
          console.log('✅ PRD Review 승인됨 - 계속 진행');
        }
      }

      // ========== P1-2: 유형별 파이프라인 Auto-Routing ==========
      // routingDecision 기반으로 파이프라인 선택 (명시적 결정)
      const selectedPipeline = routingDecision.selectedPipeline;

      if (selectedPipeline === 'analysis') {
        return await this.runAnalysisPipeline(taskId, sanitizedDescription, prdContent, options);
      }

      if (selectedPipeline === 'analyzed_design') {
        return await this.runAnalyzedDesignPipeline(taskId, sanitizedDescription, prdContent, options);
      }

      if (selectedPipeline === 'full') {
        return await this.runFullPipeline(taskId, sanitizedDescription, prdContent, options);
      }

      if (selectedPipeline === 'code') {
        return await this.runCodePipeline(taskId, sanitizedDescription, prdContent, options);
      }

      if (selectedPipeline === 'ui_mockup') {
        return await this.runUiMockupPipeline(taskId, sanitizedDescription, prdContent, options);
      }

      // QUALITATIVE → Design 파이프라인 (기본)
      // selectedPipeline === 'design' 또는 options.mode === 'design'이면 Phase B에서 종료
      const isDesignOnly = selectedPipeline === 'design' || options.mode === 'design';

      // ========== Case 09: 보호된 경로 검증 ==========
      const protectedPathCheck = this._validateProtectedPaths(prdContent);
      if (!protectedPathCheck.passed) {
        metrics.endPhase('planning', 'fail');
        this._printProtectedPathFailReport(taskId, protectedPathCheck.violations, metrics);
        return {
          success: false,
          taskId,
          pipeline: 'design',
          error: `보안 정책 위반 - ${protectedPathCheck.blockedCount}개 보호된 경로 접근 차단됨`,
          securityViolations: protectedPathCheck.violations,
          metrics: metrics.generateReport()
        };
      }

      // ========== Phase 1: Planning ==========
      console.log('\n📋 Phase B: Design...');
      metrics.startPhase('planning');

      const parsedPRD = this.prdAnalyzer.parsePRD(prdContent);
      const planResult = await this.designAgent.generateDesignDocs(parsedPRD, taskId);
      const designUsage = planResult?.usage || { inputTokens: 0, outputTokens: 0 };
      metrics.addTokens('designagent', designUsage.inputTokens, designUsage.outputTokens);
      // P1-3: Phase B 토큰 추적 (Design Pipeline)
      metrics.addPhaseTokens('phase_b', designUsage.inputTokens, designUsage.outputTokens);

      sdd = planResult?.sdd;

      // 설계 문서 저장
      if (this.saveFiles) {
        await this.savePlanningDocs(taskId, planResult);
      }

      console.log(`   ✅ Design 완료 (${designUsage.inputTokens + designUsage.outputTokens} tokens)`);

      // HANDOFF 누락 시 자동 생성 (fallback)
      if (!planResult.handoff && planResult.sdd) {
        console.log('\n⚠️  HANDOFF.md 누락 - 자동 생성 중...');
        planResult.handoff = this.generateFallbackHandoff(planResult, sanitizedDescription, prdContent);
        console.log('   ✅ HANDOFF.md fallback 생성 완료');
      }

      // Gap Check 결과 로깅
      if (planResult.gapCheck) {
        console.log(`   - Pipeline: ${planResult.gapCheck.pipeline}`);
        console.log(`   - 산출물 체크리스트: ${planResult.gapCheck.deliverables?.length || 0}개`);
      }

      metrics.endPhase('planning', 'success');

      // ========== HITL: DESIGN_APPROVAL 체크포인트 (Graceful Exit 패턴) ==========
      // Gemini 조언: AUTO_APPROVE가 false면 무조건 멈춤
      const autoApproveDesign = isEnabled('HITL_AUTO_APPROVE_DESIGN');

      if (!autoApproveDesign && isEnabled('HITL_ENABLED')) {
        sessionStore.updatePhase(taskId, 'design_approval');
        await this.pauseForHITL(taskId, HITLCheckpoint.DESIGN_APPROVAL, {
          files: {
            ia: planResult.ia ? 'IA.md 생성됨' : null,
            wireframe: planResult.wireframe ? 'Wireframe.md 생성됨' : null,
            sdd: planResult.sdd ? 'SDD.md 생성됨' : null,
            handoff: planResult.handoff ? 'HANDOFF.md 생성됨' : null
          },
          gapCheck: planResult.gapCheck,
          message: '설계 문서가 생성되었습니다. 검토 후 승인하거나 수정을 요청해주세요.',
          docsPath: `docs/cases/${this.extractCaseId(taskId)}/`
        });

        // Graceful Exit: 프로세스 종료 후 재실행 시 Resume 로직에서 처리
        if (isEnabled('HITL_GRACEFUL_EXIT')) {
          console.log('\n⏸️ [설계 승인 대기] Viewer에서 설계를 확인하고 승인해주세요.');
          return this._gracefulExitForHITL(taskId, HITLCheckpoint.DESIGN_APPROVAL);
        }

        // Fallback: 폴링 방식 (HITL_GRACEFUL_EXIT=false일 때)
        const designApproval = await this.waitForApproval(taskId);
        if (!designApproval.approved) {
          throw new Error(`설계 승인 거부됨: ${designApproval.session?.hitlContext?.rejectionReason || '사유 없음'}`);
        }
        this.resumeSession(taskId);
        console.log('✅ Design Approval 승인됨 - 구현 단계로 진행');
      } else if (autoApproveDesign) {
        console.log('   ⏩ 설계 자동 승인 (HITL_AUTO_APPROVE_DESIGN=true)');
      }

      // ========== Design Only 모드: Leader 설계 문서 사용 ==========
      if (isDesignOnly) {
        console.log('\n📝 [Phase 2] Design Mode: Leader 설계 문서 구성...');
        metrics.startPhase('design_docs');

        // Leader 설계 문서 구성
        const leaderDocs = {
          'IA.md': planResult.ia,
          'Wireframe.md': planResult.wireframe,
          'SDD.md': planResult.sdd
        };

        // Leader 결과를 currentFiles에 추가
        for (const [fileName, content] of Object.entries(leaderDocs)) {
          if (content) {
            currentFiles[fileName] = content;
            console.log(`   - ${fileName}: Leader 결과 사용 (${content.length} chars)`);
          }
        }

        // HANDOFF.md 추가
        if (planResult.handoff) {
          currentFiles['HANDOFF.md'] = planResult.handoff;
        }

        metrics.endPhase('design_docs', 'success');

        // Output Validation (인라인)
        console.log('\n🔍 [Phase 3] Design Output Validation...');
        const outputs = this._filesToOutputs(currentFiles);
        const validationResult = this._validateOutputs(outputs, planResult.gapCheck);

        const passed = validationResult.passed;
        console.log(`   - 전체 통과: ${passed ? '✅' : '❌'}`);
        console.log(`   - PRD 매칭: ${validationResult.prdMatch?.matched || 0}/${validationResult.prdMatch?.total || 0}`);

        // 파일 저장
        if (this.saveFiles) {
          const caseId = this.extractCaseId(taskId);
          const docsDir = path.join(this.projectRoot, 'docs', 'cases', caseId);
          if (!fs.existsSync(docsDir)) {
            fs.mkdirSync(docsDir, { recursive: true });
          }
          for (const [fileName, content] of Object.entries(currentFiles)) {
            fs.writeFileSync(path.join(docsDir, fileName), content);
          }
          console.log(`   📁 설계 문서 저장: ${docsDir}`);
        }

        // 로그 저장
        const report = metrics.generateReport();
        await this.saveLog(taskId, report, {
          planning: planResult,
          files: currentFiles,
          validation: validationResult
        });

        metrics.printReport();

        return {
          success: passed,
          taskId,
          mode: 'design',
          files: currentFiles,
          planning: {
            ia: currentFiles['IA.md'] || planResult.ia,
            wireframe: currentFiles['Wireframe.md'] || planResult.wireframe,
            sdd: currentFiles['SDD.md'] || planResult.sdd,
            handoff: planResult.handoff
          },
          validation: validationResult,
          metrics: report
        };
      }

      // ========== Phase 2-3: Coding + Review Loop (with Output Validation) ==========
      while (retryCount < this.maxRetries) {
        // ========== Phase 2: Coding ==========
        const codingPhase = retryCount === 0 ? 'coding' : `coding_retry_${retryCount}`;
        console.log(`\n⚙️  [Phase 2] CodeAgent Coding 시작... (시도 ${retryCount + 1}/${this.maxRetries})`);
        metrics.startPhase(codingPhase);

        let codingResult;
        if (retryCount === 0) {
          // 최초 구현 - CodeAgent 사용 (v1.0.0)
          codingResult = await this.codeAgent.implement({
            sdd: planResult.sdd,
            wireframe: planResult.wireframe,
            ia: planResult.ia,
            handoff: planResult.handoff
          });
        } else {
          // 재시도 (피드백 반영) - CodeAgent 사용
          codingResult = await this.codeAgent.revise(result.feedback, currentFiles);
        }

        metrics.addTokens('codeagent', codingResult.usage.inputTokens, codingResult.usage.outputTokens);
        currentFiles = { ...currentFiles, ...codingResult.files };

        console.log('✅ Coding 완료');
        console.log(`   - 생성 파일: ${Object.keys(codingResult.files).length}개`);
        Object.keys(codingResult.files).forEach(f => console.log(`     - ${f}`));
        console.log(`   - 토큰: ${codingResult.usage.inputTokens + codingResult.usage.outputTokens}`);

        // 파일 저장
        if (this.saveFiles) {
          await this._saveFiles(codingResult.files, taskId);
        }

        metrics.endPhase(codingPhase, 'success');

        // ========== Phase 2.5: Output Validation (Gap Check 결과 기반) ==========
        let validationResult = null;
        let validationFeedback = '';

        if (planResult.gapCheck && planResult.gapCheck.deliverables?.length > 0) {
          console.log('\n🔍 [Phase 2.5] Output Validation 시작...');
          const outputs = this._filesToOutputs(currentFiles);
          validationResult = this._validateOutputs(outputs, planResult.gapCheck);

          if (!validationResult.passed) {
            console.log(`   ⚠️ PRD 체크리스트 매칭: ${validationResult.prdMatch?.matched || 0}/${validationResult.prdMatch?.total || 0}`);
            if (validationResult.prdMatch?.missing?.length > 0) {
              console.log('   누락 항목:');
              validationResult.prdMatch.missing.forEach(m => console.log(`     - ${m}`));

              // Output Validation 실패 시 피드백 생성
              validationFeedback = `\n\n## Output Validation 결과 (PRD 체크리스트)\n` +
                `- 매칭: ${validationResult.prdMatch.matched}/${validationResult.prdMatch.total}\n` +
                `- 누락 항목:\n${validationResult.prdMatch.missing.map(m => `  - ${m}`).join('\n')}\n` +
                `\n⚠️ 위 누락 항목을 반드시 구현에 포함해야 합니다.`;
            }
          } else {
            console.log(`   ✅ PRD 체크리스트 100% 매칭 (${validationResult.prdMatch?.matched}/${validationResult.prdMatch?.total})`);
          }
        }

        // ========== Phase 3: Review ==========
        const reviewPhase = retryCount === 0 ? 'review' : `review_retry_${retryCount}`;
        console.log(`\n🔍 [Phase 3] Leader Review 시작...`);
        metrics.startPhase(reviewPhase);

        // 코드를 문자열로 변환
        const codeForReview = Object.entries(currentFiles)
          .map(([path, content]) => `### ${path}\n\`\`\`\n${content}\n\`\`\``)
          .join('\n\n');

        // Output Validation 피드백을 Review에 전달
        try {
          result = await this.leader.review(codeForReview, sdd, validationFeedback);
          metrics.addTokens('leader', result.usage?.inputTokens || 0, result.usage?.outputTokens || 0);
        } catch (reviewError) {
          console.error(`   ❌ Review 호출 실패: ${reviewError.message}`);
          result = {
            passed: false,
            verdict: 'ERROR',
            feedback: `Review 실패: ${reviewError.message}`,
            usage: { inputTokens: 0, outputTokens: 0 }
          };
        }

        console.log(`${result.passed ? '✅' : '❌'} Review 결과: ${result.verdict}`);
        console.log(`   - 토큰: ${result.usage.inputTokens + result.usage.outputTokens}`);

        if (result.passed) {
          metrics.endPhase(reviewPhase, 'success');
          console.log('\n🎉 Review PASS - 작업 완료!');
          break;
        } else {
          metrics.endPhase(reviewPhase, 'fail');
          metrics.incrementRetry();
          retryCount++;

          if (retryCount < this.maxRetries) {
            console.log(`\n🔄 Review FAIL - 재시도 예정 (${retryCount}/${this.maxRetries})`);
            console.log('📝 피드백 요약:');
            console.log(result.feedback.substring(0, 500) + (result.feedback.length > 500 ? '...' : ''));

            // ========== HITL: MANUAL_FIX 체크포인트 (3회 연속 FAIL, Graceful Exit 패턴) ==========
            const manualFixCheckpoint = this.checkHITLRequired('review_fail', {
              retryCount
            });

            if (manualFixCheckpoint) {
              sessionStore.updatePhase(taskId, 'manual_fix');
              await this.pauseForHITL(taskId, manualFixCheckpoint, {
                retryCount,
                maxRetries: this.maxRetries,
                feedback: result.feedback,
                currentFiles: Object.keys(currentFiles),
                message: `${retryCount}회 연속 Review 실패. 직접 수정하거나 방향을 조정해주세요.`
              });

              // Graceful Exit: 프로세스 종료 후 재실행 시 Resume 로직에서 처리
              if (isEnabled('HITL_GRACEFUL_EXIT')) {
                console.log('\n⏸️ [수동 수정 요청] AI가 해결하지 못했습니다. 개입이 필요합니다.');
                return this._gracefulExitForHITL(taskId, manualFixCheckpoint);
              }

              // Fallback: 폴링 방식 (HITL_GRACEFUL_EXIT=false일 때)
              const manualApproval = await this.waitForApproval(taskId);
              if (!manualApproval.approved) {
                throw new Error(`수동 수정 거부됨: ${manualApproval.session?.hitlContext?.rejectionReason || '작업 중단'}`);
              }
              this.resumeSession(taskId);
              console.log('✅ Manual Fix 승인됨 - 재시도 진행');
            }
          } else {
            console.log('\n❌ 최대 재시도 횟수 초과 - 사용자 개입 필요');
            metrics.addError('review', `최대 재시도 횟수(${this.maxRetries}회) 초과`);
          }
        }
      }

      // 로그 저장
      const report = metrics.generateReport();
      await this.saveLog(taskId, report, {
        planning: planResult,
        files: currentFiles,
        review: result
      });

      // 리포트 출력
      metrics.printReport();

      const finalResult = {
        success: result?.passed || false,
        taskId,
        pipeline: 'design',
        files: currentFiles,
        planning: {
          ia: planResult.ia,
          wireframe: planResult.wireframe,
          sdd: planResult.sdd,
          handoff: planResult.handoff
        },
        review: result,
        metrics: report
      };

      // ========== HITL: DEPLOY_APPROVAL 체크포인트 (Graceful Exit 패턴) ==========
      // 최종 결과가 성공일 때 배포 승인 필요
      if (finalResult.success) {
        const deployCheckpoint = this.checkHITLRequired('deploy', {});

        if (deployCheckpoint) {
          sessionStore.updatePhase(taskId, 'deploy_approval');
          await this.pauseForHITL(taskId, deployCheckpoint, {
            taskId,
            pipeline: 'design',
            filesCount: Object.keys(currentFiles).length,
            reviewScore: result?.score || 0,
            message: '모든 작업이 완료되었습니다. 배포를 승인해주세요.'
          });

          // Graceful Exit: 프로세스 종료 후 재실행 시 Resume 로직에서 처리
          if (isEnabled('HITL_GRACEFUL_EXIT')) {
            return this._gracefulExitForHITL(taskId, deployCheckpoint);
          }

          // Fallback: 폴링 방식 (HITL_GRACEFUL_EXIT=false일 때)
          const deployApproval = await this.waitForApproval(taskId);
          if (!deployApproval.approved) {
            throw new Error(`배포 승인 거부됨: ${deployApproval.session?.hitlContext?.rejectionReason || '사유 없음'}`);
          }
          this.resumeSession(taskId);
          console.log('✅ Deploy Approval 승인됨 - 배포 완료');
        }

        this.completeSession(taskId, finalResult);
      } else {
        this.failSession(taskId, 'Review failed after max retries');
      }

      // 실행 완료 보고서 출력 (v3.3.0)
      this.printCompletionReport(finalResult);

      return finalResult;

    } catch (error) {
      console.error('\n❌ Orchestrator 에러:', error.message);
      metrics.addError('orchestrator', error.message);
      metrics.printReport();

      // 세션 실패 처리
      this.failSession(taskId, error);

      return {
        success: false,
        taskId,
        error: error.message,
        metrics: metrics.generateReport()
      };
    }
  }

  // ========== 파이프라인 메서드 ==========

  /**
   * Analysis 파이프라인 실행 (정량적 PRD용)
   * v3.5.0: QUERY_REVIEW 체크포인트 연동
   * @param {string} taskId - 태스크 ID
   * @param {string} taskDescription - 작업 설명
   * @param {string} prdContent - PRD 내용
   * @param {Object} options - 추가 옵션
   * @returns {Object} - 분석 결과
   */
  async runAnalysisPipeline(taskId, taskDescription, prdContent, options = {}) {
    console.log('   → Analysis 파이프라인 실행\n');

    const metrics = new MetricsTracker(taskId);
    metrics.startPhase('analysis');
    sessionStore.updatePhase(taskId, 'analysis');

    try {
      // PRD 파싱
      const parsedPRD = this.prdAnalyzer.parsePRD(prdContent);
      parsedPRD.pipeline = 'analysis';
      // [P2-1] Query Library를 위해 원본 텍스트 보존
      parsedPRD.originalText = prdContent;

      // DB 연결 정보 추가 (옵션 또는 PRD에서)
      if (options.dbConfig) {
        parsedPRD.dbConnection = options.dbConfig;
      }

      // ========== PRD 내 SQL Injection / 위험 쿼리 사전 검증 (Case 04) ==========
      console.log('📊 Phase A: Analysis...');
      const prdSecurityCheck = this._validatePRDSecurity(prdContent, taskId);
      if (!prdSecurityCheck.passed) {
        // 보안 위반 발견 - FAIL 처리
        metrics.endPhase('analysis', 'fail');

        // 보안 FAIL 리포트 출력
        this._printSecurityFailReport(taskId, prdSecurityCheck, metrics);

        return {
          success: false,
          taskId,
          pipeline: 'analysis',
          error: `보안 정책 위반 - ${prdSecurityCheck.blockedCount}개 위험 쿼리 차단됨`,
          securityViolations: prdSecurityCheck.violations,
          metrics: metrics.generateReport()
        };
      }

      // ========== Phase 7-2: QUERY_REVIEW 체크포인트 (v3.5.0) ==========
      // 쿼리 생성 단계에서 위험 쿼리 감지 시 HITL 트리거
      console.log('📊 [Analysis] 쿼리 생성 중...');
      const generatedQueries = await this.analysisAgent.generateQueries(parsedPRD);

      // 위험 쿼리 검사
      const dangerousQueries = this._detectDangerousQueries(generatedQueries);

      if (dangerousQueries.length > 0 && !isEnabled('HITL_AUTO_APPROVE_QUERY') && !this.autoApprove) {
        console.log(`\n⚠️  위험 쿼리 감지: ${dangerousQueries.length}개`);
        dangerousQueries.forEach((q, i) => {
          console.log(`   ${i + 1}. ${q.type}: ${q.query.substring(0, 100)}...`);
        });

        const queryCheckpoint = this.checkHITLRequired('query', { isDangerous: true });

        if (queryCheckpoint) {
          sessionStore.updatePhase(taskId, 'query_review');
          await this.pauseForHITL(taskId, queryCheckpoint, {
            dangerousQueries,
            allQueries: generatedQueries,
            message: '위험한 SQL 쿼리가 감지되었습니다. 검토 후 승인하거나 수정을 요청해주세요.',
            warning: 'DELETE, DROP, TRUNCATE, UPDATE 등의 구문이 포함되어 있습니다.'
          });

          // Graceful Exit
          if (isEnabled('HITL_GRACEFUL_EXIT')) {
            console.log('\n⏸️ [SQL 검증 필요] 위험한 쿼리가 감지되었습니다. Viewer에서 승인해주세요.');
            return this._gracefulExitForHITL(taskId, 'QUERY_REVIEW');
          }

          // Exit 없이 대기
          const approval = await this.waitForApproval(taskId);
          if (!approval.approved) {
            throw new Error(`Query Review 거부됨: ${approval.session?.hitlContext?.rejectionReason}`);
          }
          this.resumeSession(taskId);
          console.log('✅ Query Review 승인됨 - 쿼리 실행 진행');
        }
      }

      // AnalysisAgent 실행 (승인된 쿼리로)
      console.log('📊 [Analysis] AnalysisAgent 시작...');
      // [Fix v4.3.0] Case-Centric 경로 주입
      const analysisOutputPath = this.analysisDir(taskId);
      const analysisResult = await this.analysisAgent.analyze(parsedPRD, taskId, {
        outputDir: analysisOutputPath
      });

      metrics.endPhase('analysis', analysisResult.success ? 'success' : 'fail');

      // P1-3: Phase A 토큰 추적
      if (analysisResult.usage) {
        metrics.addPhaseTokens('phase_a', analysisResult.usage.inputTokens, analysisResult.usage.outputTokens);
      }

      // 결과 로그 저장
      const report = metrics.generateReport();
      await this.saveLog(taskId, report, {
        analysis: analysisResult
      });

      console.log('\n📊 Analysis 파이프라인 완료');
      console.log(`   - 성공: ${analysisResult.success}`);
      console.log(`   - 산출물: ${analysisResult.outputs?.length || 0}개`);

      if (analysisResult.summary) {
        console.log(`   - 쿼리 성공: ${analysisResult.summary.queriesSuccess}/${analysisResult.summary.queriesTotal}`);
        console.log(`   - 총 데이터 행: ${analysisResult.summary.totalRows}`);
        if (analysisResult.summary.insightsFound > 0) {
          console.log(`   - 인사이트: ${analysisResult.summary.insightsFound}개`);
        }
      }

      const finalResult = {
        success: analysisResult.success,
        taskId,
        pipeline: 'analysis',
        outputs: analysisResult.outputs,
        queries: analysisResult.queries,
        data: analysisResult.data,
        insights: analysisResult.insights,
        summary: analysisResult.summary,
        errors: analysisResult.errors,
        metrics: report
      };

      // 실행 완료 보고서 출력 (v3.3.0)
      this.printCompletionReport(finalResult);

      return finalResult;

    } catch (error) {
      console.error('\n❌ Analysis 파이프라인 에러:', error.message);
      metrics.addError('analysis', error.message);

      return {
        success: false,
        taskId,
        pipeline: 'analysis',
        error: error.message,
        metrics: metrics.generateReport()
      };
    }
  }

  /**
   * Analyzed Design 파이프라인 실행 (Phase A → Phase B)
   *
   * ROLE_ARCHITECTURE.md 정의:
   * - analyzed_design: Phase A(분석) → Phase B(설계)에서 종료
   *
   * @param {string} taskId - 태스크 ID
   * @param {string} taskDescription - 작업 설명
   * @param {string} prdContent - PRD 내용
   * @param {Object} options - 추가 옵션
   * @returns {Object} - 통합 결과
   */
  async runAnalyzedDesignPipeline(taskId, taskDescription, prdContent, options = {}) {
    const metrics = new MetricsTracker(taskId);

    try {
      // ========== Phase A: Analysis ==========
      console.log('\n📊 Phase A: Analysis...');
      metrics.startPhase('analysis');

      const parsedPRD = this.prdAnalyzer.parsePRD(prdContent);
      parsedPRD.pipeline = 'analyzed_design';
      // [P2-1] Query Library를 위해 원본 텍스트 보존
      parsedPRD.originalText = prdContent;

      if (options.dbConfig) {
        parsedPRD.dbConnection = options.dbConfig;
      }

      // [Fix v4.3.0] Case-Centric 경로 주입
      const analysisOutputPath = this.analysisDir(taskId);
      const analysisResult = await this.analysisAgent.analyze(parsedPRD, taskId, {
        outputDir: analysisOutputPath
      });
      metrics.endPhase('analysis', analysisResult.success ? 'success' : 'partial');

      // P1-3: Phase A 토큰 추적
      if (analysisResult.usage) {
        metrics.addPhaseTokens('phase_a', analysisResult.usage.inputTokens, analysisResult.usage.outputTokens);
      }

      console.log(`   ✅ Analysis 완료`);

      // [Fix v4.3.3] Empty Analysis Guard
      const hasValidInsights = analysisResult.insights?.insights?.length > 0 ||
                               analysisResult.insights?.patterns?.length > 0;
      const totalRows = analysisResult.data?.reduce((sum, d) => sum + (d.rowCount || 0), 0) || 0;

      if (totalRows === 0 || !hasValidInsights) {
        console.warn('   ⚠️ Empty data - Design will use mock context');
      }

      // ========== Phase B: Design (분석 결과 기반) ==========
      console.log('\n📋 Phase B: Design...');
      metrics.startPhase('design');

      // 분석 결과를 PRD에 추가하여 설계에 활용
      const enrichedPrdContent = this.enrichPRDWithAnalysis(prdContent, analysisResult);

      const parsedDesignPRD = this.prdAnalyzer.parsePRD(enrichedPrdContent);
      const planResult = await this.designAgent.generateDesignDocs(parsedDesignPRD, taskId);
      const designUsage = planResult?.usage || { inputTokens: 0, outputTokens: 0 };
      metrics.addTokens('designagent', designUsage.inputTokens, designUsage.outputTokens);
      // P1-3: Phase B 토큰 추적
      metrics.addPhaseTokens('phase_b', designUsage.inputTokens, designUsage.outputTokens);
      metrics.endPhase('design', 'success');

      // 설계 문서 저장
      if (this.saveFiles) {
        await this.savePlanningDocs(taskId, planResult);
      }

      // ========== Phase B Reviewer (P1-1) ==========
      const phaseBReviewResult = await this._validateDesignDocuments(planResult, prdContent);

      // ========== Case 05: Reviewer가 감지한 초대형 PRD 처리 ==========
      const prdScopeResult = phaseBReviewResult.details?.prd_scope;
      if (prdScopeResult && !prdScopeResult.passed) {
        console.warn(`   ⚠️ ${prdScopeResult.message}`);
        metrics.addError('oversized_prd', prdScopeResult.message);

        // Partial 상태로 보고서 출력
        const report = metrics.generateReport();
        this._printOversizedPRDReport(taskId, prdScopeResult, phaseBReviewResult, report);

        return {
          success: false,
          partial: true,
          taskId,
          pipeline: 'analyzed_design',
          error: `PRD 범위 과다 - ${prdScopeResult.featureCount}개 기능 (최대 ${prdScopeResult.maxFeatures}개)`,
          prdScopeResult,
          metrics: report
        };
      }

      if (!phaseBReviewResult.passed) {
        console.warn(`   ⚠️ Review FAIL (${phaseBReviewResult.score}/100)`);
        metrics.addError('design_review', phaseBReviewResult.summary);
      } else {
        console.log(`   ✅ Design 완료 (${phaseBReviewResult.score}/100)`);
        await this._triggerDocSync(taskId);
      }

      const hitlRoute = await this.routeByValidationResult(taskId, phaseBReviewResult, 'B');
      if (hitlRoute?.status === 'PAUSED_HITL') {
        return hitlRoute;
      }

      planResult.reviewResult = phaseBReviewResult;

      // Analyzed Design Pipeline은 Phase B에서 종료
      const report = metrics.generateReport();
      await this.saveLog(taskId, report, {
        analysis: analysisResult,
        planning: planResult
      });

      const finalResult = {
        success: true,
        taskId,
        pipeline: 'analyzed_design',
        // Phase A 결과
        analysis: {
          outputs: analysisResult.outputs,
          queries: analysisResult.queries,
          data: analysisResult.data,
          insights: analysisResult.insights,
          summary: analysisResult.summary
        },
        // Phase B 결과
        planning: {
          ia: planResult.ia,
          wireframe: planResult.wireframe,
          sdd: planResult.sdd,
          handoff: planResult.handoff,
          reviewResult: phaseBReviewResult
        },
        metrics: report
      };

      // 실행 완료 보고서 출력 (v3.3.0)
      this.printCompletionReport(finalResult);

      return finalResult;

    } catch (error) {
      console.error('\n❌ Analyzed Design 파이프라인 에러:', error.message);
      metrics.addError('analyzed_design', error.message);

      return {
        success: false,
        taskId,
        pipeline: 'analyzed_design',
        error: error.message,
        metrics: metrics.generateReport()
      };
    }
  }

  /**
   * Full 파이프라인 실행 (Phase A → Phase B → Phase C)
   *
   * ROLE_ARCHITECTURE.md 정의:
   * - Full: Phase A → B → C 전체 (End-to-End)
   *
   * @param {string} taskId - 태스크 ID
   * @param {string} taskDescription - 작업 설명
   * @param {string} prdContent - PRD 내용
   * @param {Object} options - 추가 옵션
   * @returns {Object} - 통합 결과
   */
  async runFullPipeline(taskId, taskDescription, prdContent, options = {}) {
    const metrics = new MetricsTracker(taskId);

    try {
      // ========== Phase A: Analysis ==========
      console.log('\n📊 Phase A: Analysis...');
      metrics.startPhase('analysis');

      const parsedPRD = this.prdAnalyzer.parsePRD(prdContent);
      parsedPRD.pipeline = 'full';
      parsedPRD.originalText = prdContent;

      if (options.dbConfig) {
        parsedPRD.dbConnection = options.dbConfig;
      }

      const analysisOutputPath = this.analysisDir(taskId);
      const analysisResult = await this.analysisAgent.analyze(parsedPRD, taskId, {
        outputDir: analysisOutputPath
      });
      metrics.endPhase('analysis', analysisResult.success ? 'success' : 'partial');

      if (analysisResult.usage) {
        metrics.addPhaseTokens('phase_a', analysisResult.usage.inputTokens, analysisResult.usage.outputTokens);
      }

      console.log(`   ✅ Analysis 완료`);

      // ========== Phase B: Design ==========
      console.log('\n📋 Phase B: Design...');
      metrics.startPhase('design');

      const enrichedPrdContent = this.enrichPRDWithAnalysis(prdContent, analysisResult);
      const planResult = await this.leader.plan(taskDescription, enrichedPrdContent);
      metrics.addTokens('leader', planResult.usage.inputTokens, planResult.usage.outputTokens);
      metrics.addPhaseTokens('phase_b', planResult.usage.inputTokens, planResult.usage.outputTokens);
      metrics.endPhase('design', 'success');

      if (this.saveFiles) {
        await this.savePlanningDocs(taskId, planResult);
      }

      // Phase B Reviewer
      const phaseBReviewResult = await this._validateDesignDocuments(planResult, prdContent);

      if (!phaseBReviewResult.passed) {
        console.warn(`   ⚠️ Review FAIL (${phaseBReviewResult.score}/100)`);
        metrics.addError('design_review', phaseBReviewResult.summary);
      } else {
        console.log(`   ✅ Design 완료 (${phaseBReviewResult.score}/100)`);
        await this._triggerDocSync(taskId);
      }

      const hitlRoute = await this.routeByValidationResult(taskId, phaseBReviewResult, 'B');
      if (hitlRoute?.status === 'PAUSED_HITL') {
        return hitlRoute;
      }

      planResult.reviewResult = phaseBReviewResult;

      // ========== Phase C: Code Implementation ==========
      let codeResult = null;

      if (phaseBReviewResult.passed && planResult.handoff) {
        console.log('\n⚙️  Phase C: Code...');
        metrics.startPhase('coding');

        try {
          // CodeAgent 사용 (SubAgent 대체)
          codeResult = await this.codeAgent.implement({
            sdd: planResult.sdd,
            wireframe: planResult.wireframe,
            ia: planResult.ia,
            handoff: planResult.handoff
          });

          if (codeResult?.usage) {
            metrics.addPhaseTokens('phase_c', codeResult.usage.inputTokens, codeResult.usage.outputTokens);
          }

          if (codeResult?.success) {
            const fileCount = codeResult.files ? Object.keys(codeResult.files).length : 0;
            console.log(`\n✅ Phase C 완료: ${fileCount}개 파일 생성`);
            metrics.endPhase('coding', 'success');
          } else {
            console.warn('\n⚠️ Phase C: 코드 생성 결과 없음');
            metrics.endPhase('coding', 'partial');
          }

        } catch (codeError) {
          console.error('\n❌ Phase C 에러:', codeError.message);
          metrics.addError('coding', codeError.message);
          metrics.endPhase('coding', 'fail');
        }
      } else {
        console.log('\n⏭️  Phase C 스킵 (Phase B Reviewer FAIL 또는 HANDOFF 누락)');
      }

      // 결과 통합
      const report = metrics.generateReport();
      await this.saveLog(taskId, report, {
        analysis: analysisResult,
        planning: planResult,
        coding: codeResult
      });


      const finalResult = {
        success: true,
        taskId,
        pipeline: 'full',
        // Phase A 결과
        analysis: {
          outputs: analysisResult.outputs,
          queries: analysisResult.queries,
          data: analysisResult.data,
          insights: analysisResult.insights,
          summary: analysisResult.summary
        },
        // Phase B 결과
        planning: {
          ia: planResult.ia,
          wireframe: planResult.wireframe,
          sdd: planResult.sdd,
          handoff: planResult.handoff,
          reviewResult: phaseBReviewResult
        },
        // Phase C 결과
        coding: codeResult ? {
          files: codeResult.files,
          report: codeResult.report,
          generatedFiles: codeResult.metadata?.generatedFiles || []
        } : null,
        metrics: report
      };

      this.printCompletionReport(finalResult);

      return finalResult;

    } catch (error) {
      console.error('\n❌ Full 파이프라인 에러:', error.message);
      metrics.addError('full', error.message);

      return {
        success: false,
        taskId,
        pipeline: 'full',
        error: error.message,
        metrics: metrics.generateReport()
      };
    }
  }

  /**
   * Code Only 파이프라인 실행 (Phase C만)
   *
   * ROLE_ARCHITECTURE.md 정의:
   * - code: Phase C만 실행 (기존 SDD/HANDOFF 필수)
   *
   * @param {string} taskId - 태스크 ID
   * @param {string} taskDescription - 작업 설명
   * @param {string} prdContent - PRD 내용 (SDD/HANDOFF 포함)
   * @param {Object} options - 추가 옵션
   * @returns {Object} - 코딩 결과
   */
  async runCodePipeline(taskId, taskDescription, prdContent, options = {}) {
    const metrics = new MetricsTracker(taskId);

    try {
      console.log('\n⚙️  Phase C: Code Only...');
      metrics.startPhase('coding');

      // PRD에서 SDD/HANDOFF 추출 (이미 설계 완료된 상태)
      const parsedPRD = this.prdAnalyzer.parsePRD(prdContent);

      // SDD와 HANDOFF가 필수
      if (!parsedPRD.sdd && !options.sdd) {
        throw new Error('Code 파이프라인은 SDD가 필수입니다. PRD에 SDD를 포함하거나 options.sdd를 전달하세요.');
      }

      const sdd = options.sdd || parsedPRD.sdd;
      const handoff = options.handoff || parsedPRD.handoff;
      const wireframe = options.wireframe || parsedPRD.wireframe;
      const ia = options.ia || parsedPRD.ia;

      // CodeAgent 실행
      const codeResult = await this.codeAgent.implement({
        sdd,
        wireframe,
        ia,
        handoff
      });

      if (codeResult?.usage) {
        metrics.addPhaseTokens('phase_c', codeResult.usage.inputTokens, codeResult.usage.outputTokens);
      }

      if (codeResult?.success) {
        const fileCount = codeResult.files ? Object.keys(codeResult.files).length : 0;
        console.log(`   ✅ Phase C 완료: ${fileCount}개 파일 생성`);
        metrics.endPhase('coding', 'success');
      } else {
        console.warn('   ⚠️ Phase C: 코드 생성 결과 없음');
        metrics.endPhase('coding', 'partial');
      }

      const report = metrics.generateReport();
      await this.saveLog(taskId, report, { coding: codeResult });

      const finalResult = {
        success: true,
        taskId,
        pipeline: 'code',
        coding: codeResult ? {
          files: codeResult.files,
          report: codeResult.report,
          generatedFiles: codeResult.metadata?.generatedFiles || []
        } : null,
        metrics: report
      };

      this.printCompletionReport(finalResult);
      return finalResult;

    } catch (error) {
      console.error('\n❌ Code 파이프라인 에러:', error.message);
      metrics.addError('code', error.message);

      return {
        success: false,
        taskId,
        pipeline: 'code',
        error: error.message,
        metrics: metrics.generateReport()
      };
    }
  }

  /**
   * UI Mockup 파이프라인 실행 (Phase B → Phase C)
   *
   * ROLE_ARCHITECTURE.md 정의:
   * - ui_mockup: Phase B(설계) → Phase C(구현)
   *
   * @param {string} taskId - 태스크 ID
   * @param {string} taskDescription - 작업 설명
   * @param {string} prdContent - PRD 내용
   * @param {Object} options - 추가 옵션
   * @returns {Object} - 통합 결과
   */
  async runUiMockupPipeline(taskId, taskDescription, prdContent, options = {}) {
    const metrics = new MetricsTracker(taskId);

    try {
      // ========== Phase B: Design ==========
      console.log('\n📋 Phase B: Design...');
      metrics.startPhase('design');

      const parsedPRD = this.prdAnalyzer.parsePRD(prdContent);
      const planResult = await this.designAgent.generateDesignDocs(parsedPRD, taskId);
      const designUsage = planResult?.usage || { inputTokens: 0, outputTokens: 0 };
      metrics.addTokens('designagent', designUsage.inputTokens, designUsage.outputTokens);
      metrics.addPhaseTokens('phase_b', designUsage.inputTokens, designUsage.outputTokens);
      metrics.endPhase('design', 'success');

      if (this.saveFiles) {
        await this.savePlanningDocs(taskId, planResult);
      }

      // Phase B Reviewer
      const phaseBReviewResult = await this._validateDesignDocuments(planResult, prdContent);

      if (!phaseBReviewResult.passed) {
        console.warn(`   ⚠️ Review FAIL (${phaseBReviewResult.score}/100)`);
        metrics.addError('design_review', phaseBReviewResult.summary);
      } else {
        console.log(`   ✅ Design 완료 (${phaseBReviewResult.score}/100)`);
        await this._triggerDocSync(taskId);
      }

      const hitlRoute = await this.routeByValidationResult(taskId, phaseBReviewResult, 'B');
      if (hitlRoute?.status === 'PAUSED_HITL') {
        return hitlRoute;
      }

      planResult.reviewResult = phaseBReviewResult;

      // ========== Phase C: Code Implementation ==========
      let codeResult = null;

      if (phaseBReviewResult.passed && planResult.handoff) {
        console.log('\n⚙️  Phase C: Code...');
        metrics.startPhase('coding');

        try {
          codeResult = await this.codeAgent.implement({
            sdd: planResult.sdd,
            wireframe: planResult.wireframe,
            ia: planResult.ia,
            handoff: planResult.handoff
          });

          if (codeResult?.usage) {
            metrics.addPhaseTokens('phase_c', codeResult.usage.inputTokens, codeResult.usage.outputTokens);
          }

          if (codeResult?.success) {
            const fileCount = codeResult.files ? Object.keys(codeResult.files).length : 0;
            console.log(`   ✅ Phase C 완료: ${fileCount}개 파일 생성`);
            metrics.endPhase('coding', 'success');
          } else {
            console.warn('   ⚠️ Phase C: 코드 생성 결과 없음');
            metrics.endPhase('coding', 'partial');
          }

        } catch (codeError) {
          console.error('\n❌ Phase C 에러:', codeError.message);
          metrics.addError('coding', codeError.message);
          metrics.endPhase('coding', 'fail');
        }
      } else {
        console.log('\n⏭️  Phase C 스킵 (Phase B Reviewer FAIL 또는 HANDOFF 누락)');
      }

      const report = metrics.generateReport();
      await this.saveLog(taskId, report, {
        planning: planResult,
        coding: codeResult
      });

      const finalResult = {
        success: true,
        taskId,
        pipeline: 'ui_mockup',
        // Phase B 결과
        planning: {
          ia: planResult.ia,
          wireframe: planResult.wireframe,
          sdd: planResult.sdd,
          handoff: planResult.handoff,
          reviewResult: phaseBReviewResult
        },
        // Phase C 결과
        coding: codeResult ? {
          files: codeResult.files,
          report: codeResult.report,
          generatedFiles: codeResult.metadata?.generatedFiles || []
        } : null,
        metrics: report
      };

      this.printCompletionReport(finalResult);
      return finalResult;

    } catch (error) {
      console.error('\n❌ UI Mockup 파이프라인 에러:', error.message);
      metrics.addError('ui_mockup', error.message);

      return {
        success: false,
        taskId,
        pipeline: 'ui_mockup',
        error: error.message,
        metrics: metrics.generateReport()
      };
    }
  }

  /**
   * 병렬 파이프라인 실행 (Design + Code 동시 실행)
   * @param {string} taskId - 태스크 ID
   * @param {string} taskDescription - 작업 설명
   * @param {string} prdContent - PRD 내용
   * @param {Object} options - 추가 옵션
   * @returns {Object} - 통합 결과
   */
  async runParallelPipeline(taskId, taskDescription, prdContent, options = {}) {
    const metrics = new MetricsTracker(taskId);

    try {
      // ========== Phase 1: Leader Planning ==========
      console.log('\n📋 Phase 1: Planning...');
      metrics.startPhase('planning');

      const planResult = await this.leader.plan(taskDescription, prdContent);
      metrics.addTokens('leader', planResult.usage.inputTokens, planResult.usage.outputTokens);
      metrics.endPhase('planning', 'success');

      // HANDOFF 누락 시 자동 생성
      if (!planResult.handoff && planResult.sdd) {
        planResult.handoff = this.generateFallbackHandoff(planResult, taskDescription, prdContent);
      }

      // ========== Phase 2: 병렬 실행 (Design + Code) ==========
      console.log('\n🚀 Phase 2: Parallel (Design || Code)...');
      metrics.startPhase('parallel_execution');

      const parallelStart = Date.now();

      // Code Agent 실행 (Design은 Leader 결과 사용)
      const codeSettled = await Promise.allSettled([
        // Code Agent
        (async () => {
          const result = await this.codeAgent.implement({
            sdd: planResult.sdd,
            wireframe: planResult.wireframe,
            ia: planResult.ia,
            handoff: planResult.handoff
          });
          return result;
        })()
      ]);

      // Design 결과는 Leader 결과에서 구성
      const designResult = {
        files: {
          'IA.md': planResult.ia,
          'Wireframe.md': planResult.wireframe,
          'SDD.md': planResult.sdd,
          'HANDOFF.md': planResult.handoff
        },
        usage: { inputTokens: 0, outputTokens: 0 },
        success: true
      };

      const codeResult = codeSettled[0].status === 'fulfilled'
        ? codeSettled[0].value
        : { files: {}, usage: { inputTokens: 0, outputTokens: 0 }, success: false };

      // 코드 실패 로깅
      if (codeSettled[0].status === 'rejected') {
        console.error(`   ❌ [Code Agent] 실패: ${codeSettled[0].reason?.message || codeSettled[0].reason}`);
      }

      // Code Agent 실패한 경우 조기 종료
      if (codeSettled[0].status === 'rejected') {
        const errorMsg = `Code Agent 실패: ${codeSettled[0].reason?.message || codeSettled[0].reason}`;
        console.error(`\n❌ 실행 실패: ${errorMsg}`);
        metrics.endPhase('parallel_execution', 'fail');
        metrics.addError('parallel_execution', errorMsg);
        throw new Error(errorMsg);
      }

      const parallelDuration = ((Date.now() - parallelStart) / 1000).toFixed(2);
      console.log(`   ✅ 실행 완료 (${parallelDuration}s)`);

      metrics.addTokens('leader', designResult.usage?.inputTokens || 0, designResult.usage?.outputTokens || 0);
      metrics.addTokens('codeagent', codeResult.usage?.inputTokens || 0, codeResult.usage?.outputTokens || 0);

      const parallelStatus = codeSettled[0].status === 'fulfilled' ? 'success' : 'partial';
      metrics.endPhase('parallel_execution', parallelStatus);

      // ========== Phase 3: 결과 병합 ==========

      // 설계 문서 병합
      const designFiles = {};
      const leaderDocs = {
        'IA.md': planResult.ia,
        'Wireframe.md': planResult.wireframe,
        'SDD.md': planResult.sdd,
        'HANDOFF.md': planResult.handoff
      };

      for (const [fileName, content] of Object.entries(designResult.files)) {
        const leaderContent = leaderDocs[fileName];
        if (!leaderContent || content.length > leaderContent.length) {
          designFiles[fileName] = content;
        } else {
          designFiles[fileName] = leaderContent;
        }
      }

      // Leader 문서 중 누락된 것 추가
      for (const [fileName, content] of Object.entries(leaderDocs)) {
        if (content && !designFiles[fileName]) {
          designFiles[fileName] = content;
        }
      }

      // 최종 파일 목록
      const allFiles = {
        ...designFiles,
        ...codeResult.files
      };

      // ========== Phase 4: Output Validation ==========
      const outputs = this._filesToOutputs(allFiles);
      const validationResult = this._validateOutputs(outputs, planResult.gapCheck);

      // 파일 저장
      if (this.saveFiles) {
        const caseId = this.extractCaseId(taskId);
        const docsDir = path.join(this.projectRoot, 'docs', 'cases', caseId);
        if (!fs.existsSync(docsDir)) {
          fs.mkdirSync(docsDir, { recursive: true });
        }
        for (const [fileName, content] of Object.entries(designFiles)) {
          fs.writeFileSync(path.join(docsDir, fileName), content);
        }
        await this.codeAgent.saveFiles(codeResult.files);
      }

      // 결과 리포트
      const report = metrics.generateReport();
      await this.saveLog(taskId, report, {
        planning: planResult,
        design: designResult,
        code: codeResult,
        validation: validationResult
      });

      return {
        success: validationResult.passed,
        taskId,
        pipeline: 'parallel',
        parallelDuration: `${parallelDuration}s`,
        files: allFiles,
        planning: {
          ia: designFiles['IA.md'] || planResult.ia,
          wireframe: designFiles['Wireframe.md'] || planResult.wireframe,
          sdd: designFiles['SDD.md'] || planResult.sdd,
          handoff: planResult.handoff
        },
        code: {
          files: codeResult.files,
          report: codeResult.report
        },
        validation: validationResult,
        metrics: report
      };

    } catch (error) {
      console.error('\n❌ Parallel 파이프라인 에러:', error.message);
      metrics.addError('parallel', error.message);

      return {
        success: false,
        taskId,
        pipeline: 'parallel',
        error: error.message,
        metrics: metrics.generateReport()
      };
    }
  }

  /**
   * HANDOFF.md Fallback 생성 (Leader가 누락했을 때)
   * @param {Object} planResult - Leader Planning 결과
   * @param {string} taskDescription - 작업 설명
   * @param {string} prdContent - PRD 내용
   * @returns {string} - 생성된 HANDOFF.md 내용
   */
  generateFallbackHandoff(planResult, taskDescription, prdContent) {
    const gapCheck = planResult.gapCheck;
    const deliverables = gapCheck?.deliverables || [];

    let handoff = `# HANDOFF.md - Sub-agent 작업 지시서\n\n`;
    handoff += `> 이 문서는 Leader Agent의 HANDOFF 누락으로 인해 자동 생성되었습니다.\n\n`;

    // PRD 산출물 체크리스트 매핑
    if (deliverables.length > 0) {
      handoff += `## PRD 산출물 체크리스트 매핑\n\n`;
      handoff += `| # | 항목 | 유형 | 구현 방식 |\n`;
      handoff += `|---|------|------|----------|\n`;
      deliverables.forEach((d, i) => {
        handoff += `| ${i + 1} | ${d.item} | ${d.type} | 참조: SDD.md |\n`;
      });
      handoff += `\n`;
    }

    // Pipeline (v2.0.0: Mode → Pipeline 변경)
    const pipelineValue = gapCheck?.pipeline || 'design';
    const pipelineLabels = {
      'analysis': 'Analysis (A)',
      'design': 'Design (B)',
      'code': 'Code (C)',
      'analyzed_design': 'Analyzed Design (A→B)',
      'ui_mockup': 'UI Mockup (B→C)',
      'full': 'Full (A→B→C)'
    };
    const mode = pipelineLabels[pipelineValue] || 'Design (B)';
    handoff += `## Pipeline\n${mode}\n\n`;

    // Required Outputs
    handoff += `## Required Outputs\n`;
    if (deliverables.length > 0) {
      deliverables.forEach(d => {
        handoff += `- ${d.item}\n`;
      });
    } else {
      handoff += `- 설계 문서 (IA.md, Wireframe.md, SDD.md)\n`;
    }
    handoff += `\n`;

    // Input Documents
    handoff += `## Input Documents\n`;
    handoff += `- IA.md: ${planResult.ia ? '생성됨' : '없음'}\n`;
    handoff += `- Wireframe.md: ${planResult.wireframe ? '생성됨' : '없음'}\n`;
    handoff += `- SDD.md: ${planResult.sdd ? '생성됨' : '없음'}\n`;
    handoff += `\n`;

    // Task Description
    handoff += `## Task Description\n${taskDescription}\n\n`;

    // Completion Criteria
    handoff += `## Completion Criteria\n`;
    handoff += `- PRD 산출물 체크리스트 100% 충족\n`;
    handoff += `- SDD.md 명세 준수\n`;
    handoff += `- Output Validation 통과\n\n`;

    // Constraints
    handoff += `## Constraints\n`;
    handoff += `- DOMAIN_SCHEMA.md의 실제 컬럼명 사용\n`;
    handoff += `- CODE_STYLE.md 코딩 규칙 준수\n`;
    handoff += `- 보안 취약점 방지\n`;

    return handoff;
  }

  /**
   * 분석 결과를 PRD에 추가하여 풍부화
   * [Fix v4.3.5] 컨텍스트 다이어트 - LLM 요약만 주입 (상세 통계 제거)
   *
   * PO 지시: "분석 결과는 보조 참고자료일 뿐, PRD가 법이다"
   * - Executive Summary만 유지
   * - Key Findings (상위 3개만)
   * - Recommendations (상위 2개만)
   * - 상세 통계, 패턴, 쿼리 결과 제거
   */
  enrichPRDWithAnalysis(originalPrd, analysisResult) {
    let enriched = originalPrd;

    // [Fix v4.3.5] 분석 컨텍스트는 "보조 참고자료"임을 명시
    enriched += `\n\n---\n## 📊 분석 결과 참고 (보조 자료 - PRD가 우선입니다)\n\n`;
    enriched += `> ⚠️ **주의**: 아래 분석 결과는 **참고용**입니다. 설계는 반드시 **PRD의 요구사항**을 기반으로 하세요.\n\n`;

    // 분석 결과 유효성 체크
    const hasLLMInsights = analysisResult.insights?.llmInsights && !analysisResult.insights.llmInsights.error;
    const hasMockData = analysisResult.data?.some(d => d.mock === true);

    // 데이터가 전혀 없는 경우
    if (!hasLLMInsights) {
      if (hasMockData) {
        enriched += `분석 결과 없음 (DB 연결 실패). PRD 기반으로 설계를 진행하세요.\n\n`;
      } else {
        enriched += `분석 결과 없음. PRD 기반으로 설계를 진행하세요.\n\n`;
      }
      return enriched;
    }

    // [Fix v4.3.5] LLM 인사이트만 간략히 주입 (다이어트)
    const llm = analysisResult.insights.llmInsights;

    // 1. Executive Summary (필수)
    enriched += `**요약**: ${llm.executiveSummary || '(요약 없음)'}\n\n`;

    // 2. Key Findings (상위 3개만)
    if (llm.keyFindings && llm.keyFindings.length > 0) {
      enriched += `**핵심 발견사항**:\n`;
      const topFindings = llm.keyFindings.slice(0, 3);
      for (const finding of topFindings) {
        enriched += `- ${finding.finding}\n`;
      }
      enriched += `\n`;
    }

    // 3. Recommendations (상위 2개만)
    if (llm.recommendations && llm.recommendations.length > 0) {
      enriched += `**권장사항**:\n`;
      const topRecs = llm.recommendations.slice(0, 2);
      for (const rec of topRecs) {
        enriched += `- [${rec.priority}] ${rec.action}\n`;
      }
      enriched += `\n`;
    }

    // [제거됨] 상세 통계, 패턴, 쿼리 결과, 트렌드, 데이터 품질
    // → 토큰 절약 + PRD 집중도 향상

    enriched += `---\n`;

    return enriched;
  }

  /**
   * Planning 문서 저장
   */
  async savePlanningDocs(taskId, planResult) {
    // 보안: taskId 재검증 (Path Traversal 방지)
    const validatedTaskId = this.validateTaskId(taskId);
    const caseId = this.extractCaseId(validatedTaskId);
    const docsDir = this.validateFilePath(path.join('docs', 'cases', caseId));

    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    if (planResult.ia) {
      fs.writeFileSync(this.validateFilePath(path.join('docs', 'cases', caseId, 'IA.md')), planResult.ia);
    }
    if (planResult.wireframe) {
      fs.writeFileSync(this.validateFilePath(path.join('docs', 'cases', caseId, 'Wireframe.md')), planResult.wireframe);
    }
    if (planResult.sdd) {
      fs.writeFileSync(this.validateFilePath(path.join('docs', 'cases', caseId, 'SDD.md')), planResult.sdd);
    }
    if (planResult.handoff) {
      fs.writeFileSync(this.validateFilePath(path.join('docs', 'cases', caseId, 'HANDOFF.md')), planResult.handoff);
    }

    console.log(`   📁 문서 저장: ${docsDir}`);
  }

  /**
   * 실행 로그 저장
   */
  async saveLog(taskId, report, details) {
    // 보안: taskId 재검증 (Path Traversal 방지)
    const validatedTaskId = this.validateTaskId(taskId);

    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    const logPath = this.validateFilePath(path.join('orchestrator/logs', `${validatedTaskId}.json`));
    const logData = {
      ...report,
      details: {
        planningRaw: details.planning?.raw?.substring(0, 1000),
        fileCount: Object.keys(details.files || {}).length,
        reviewVerdict: details.review?.verdict
      }
    };

    // 보안: 민감 정보 마스킹 후 저장
    const maskedLogData = this.maskSensitiveData(logData);
    fs.writeFileSync(logPath, maskedLogData);
    console.log(`\n📝 로그 저장: ${logPath}`);
  }

  // ========== Phase B Reviewer (P1-1) ==========

  /**
   * 설계 문서 품질 검증 (Phase B Reviewer)
   * @param {Object} planResult - Leader Agent 설계 결과
   * @param {string} prdContent - PRD 원문
   * @returns {Object} { passed, score, summary, issues }
   */
  async _validateDesignDocuments(planResult, prdContent) {
    try {
      const reviewer = new ReviewerSkill({
        projectRoot: this.projectRoot
      });
      await reviewer.initialize();

      // 설계 문서 내용 추출
      const designDocuments = {
        ia: planResult.ia || '',
        wireframe: planResult.wireframe || '',
        sdd: planResult.sdd || '',
        handoff: planResult.handoff || ''
      };

      // 문서 존재 여부 확인
      const docCount = Object.values(designDocuments).filter(d => d && d.length > 0).length;
      if (docCount === 0) {
        return {
          passed: false,
          score: 0,
          summary: '설계 문서가 생성되지 않음',
          issues: [{ severity: 'HIGH', description: '4개 설계 문서 모두 비어있음' }]
        };
      }

      // ReviewerSkill 호출 (design_documents 스코프 + prd_scope)
      const reviewResult = await reviewer.review({
        prd: { content: prdContent },
        outputs: designDocuments,
        validationScope: ['structure', 'completeness', 'prd_match', 'prd_scope']
      });

      // 추가 검증: 문서 구조 확인
      const structureIssues = this._checkDesignDocumentStructure(designDocuments);

      // 최종 점수 계산
      let finalScore = reviewResult.score || 70;

      // 문서 개수에 따른 가산/감점
      finalScore += (docCount - 2) * 10; // 4개면 +20, 3개면 +10, 2개면 0

      // 구조 이슈 감점
      finalScore -= structureIssues.length * 5;

      const passed = finalScore >= 80;

      return {
        passed,
        score: Math.max(0, Math.min(100, finalScore)),
        summary: passed
          ? `설계 문서 품질 검증 통과 (${docCount}/4 문서 생성)`
          : `설계 문서 품질 미달 (${structureIssues.length}개 구조 이슈)`,
        docCount,
        issues: [...(reviewResult.issues || []), ...structureIssues],
        details: reviewResult.details || {},
        hitlRequired: reviewResult.hitlRequired,
        hitlTrigger: reviewResult.hitlTrigger,
        hitl3WayOptions: reviewResult.hitl3WayOptions
      };

    } catch (error) {
      console.warn(`  [Phase B Reviewer] 검증 중 오류: ${error.message}`);

      // Fallback: 기본 검증
      return this._fallbackDesignValidation(planResult);
    }
  }

  /**
   * 설계 문서 구조 확인
   */
  _checkDesignDocumentStructure(documents) {
    const issues = [];

    // IA.md 구조 확인
    if (documents.ia && !documents.ia.includes('#')) {
      issues.push({
        severity: 'MEDIUM',
        category: 'structure',
        description: 'IA.md에 마크다운 헤딩이 없음'
      });
    }

    // Wireframe.md 구조 확인
    if (documents.wireframe && !documents.wireframe.includes('```')) {
      issues.push({
        severity: 'LOW',
        category: 'structure',
        description: 'Wireframe.md에 ASCII 다이어그램이 없음'
      });
    }

    // SDD.md 구조 확인 (API 정의 포함 여부)
    if (documents.sdd && !documents.sdd.toLowerCase().includes('api')) {
      issues.push({
        severity: 'MEDIUM',
        category: 'completeness',
        description: 'SDD.md에 API 정의가 없음'
      });
    }

    // HANDOFF.md 구조 확인 (작업 지시 포함 여부)
    if (documents.handoff && documents.handoff.length < 500) {
      issues.push({
        severity: 'MEDIUM',
        category: 'completeness',
        description: 'HANDOFF.md가 너무 짧음 (< 500자)'
      });
    }

    return issues;
  }

  /**
   * Fallback 설계 문서 검증
   */
  _fallbackDesignValidation(planResult) {
    const docs = [planResult.ia, planResult.wireframe, planResult.sdd, planResult.handoff];
    const docCount = docs.filter(d => d && d.length > 0).length;

    const score = (docCount / 4) * 100;
    const passed = docCount >= 3; // 최소 3개 문서 필요

    return {
      passed,
      score: Math.round(score),
      summary: passed
        ? `Fallback 검증 통과 (${docCount}/4 문서)`
        : `Fallback 검증 실패 (${docCount}/4 문서)`,
      docCount,
      issues: [],
      fallback: true
    };
  }

  // ========== 실행 완료 보고 템플릿 (v3.3.0) ==========

  /**
   * 파이프라인 시각화 문자열 생성
   */
  _getPipelineVisual(pipelineType) {
    const visuals = {
      'analysis': '📊 Analysis Only (Phase A)',
      'design': '🎨 Design Only (Phase B)',
      'code': '⚙️ Code Only (Phase C)',
      'analyzed_design': '🔀 Analyzed Design (Phase A → B)',
      'ui_mockup': '🎨 UI Mockup (Phase B → C)',
      'full': '🔀 Full Pipeline (Phase A → B → C)'
    };
    return visuals[pipelineType] || `🔄 Custom Pipeline (${pipelineType})`;
  }

  /**
   * 에러 원인 분석 및 해결책 제안
   */
  _analyzeFailureRootCause(error) {
    const errorMsg = typeof error === 'string' ? error : error?.message || '';

    if (/ECONNREFUSED|Access denied|connection/i.test(errorMsg)) {
      return {
        issue: 'DB 연결 실패',
        suggestion: '.env의 DB 정보와 VPN/방화벽을 확인하세요.'
      };
    }
    if (/Review failed|max retries/i.test(errorMsg)) {
      return {
        issue: '품질 기준 미달',
        suggestion: 'PRD 요구사항이 너무 복잡하거나 모호합니다. Task를 쪼개거나 PRD를 구체화하세요.'
      };
    }
    if (/Token limit|context length/i.test(errorMsg)) {
      return {
        issue: '토큰 초과',
        suggestion: 'CONTEXT_MODE를 변경하거나 불필요한 문서를 로딩에서 제외하세요.'
      };
    }
    if (/OUTPUT_PATH_BLOCKED|SANDBOX_VIOLATION/i.test(errorMsg)) {
      return {
        issue: '보안 차단',
        suggestion: 'orchestrator/security/path-validator.js의 허용 경로를 확인하세요.'
      };
    }
    return {
      issue: '런타임 에러',
      suggestion: '로그 상세(workspace/logs/)를 확인하세요.'
    };
  }

  /**
   * 실행 가능한 명령어 생성
   */
  _generateRunCommands(result, caseId) {
    const commands = [];
    const files = result.coding?.files || result.files || {};
    const fileKeys = Object.keys(files);

    // Backend 감지
    if (fileKeys.some(f => f.includes('backend') || f.includes('package.json'))) {
      commands.push({ type: 'Backend', cmd: 'cd backend && npm install && npm run dev' });
    }

    // Frontend 감지
    if (fileKeys.some(f => f.includes('frontend') || f.includes('public/index.html'))) {
      commands.push({ type: 'Frontend', cmd: 'cd frontend && npm install && npm run dev' });
    }

    // SQL 파일 감지
    if (fileKeys.some(f => f.endsWith('.sql'))) {
      commands.push({ type: 'SQL', cmd: `SQL 클라이언트에서 docs/cases/${caseId}/analysis/results/ 내 쿼리 실행` });
    }

    return commands.length > 0 ? commands : null;
  }

  /**
   * 실행 완료 보고서 출력 (v4.0.0 - CLI UX 개편)
   */
  printCompletionReport(result) {
    const divider = '━'.repeat(68);
    const taskId = result.taskId;
    const caseId = this.extractCaseId(taskId);
    const pipelineType = result.pipeline || 'design';
    const pipelineVisual = this._getPipelineVisual(pipelineType);

    // 토큰 및 시간 계산
    let totalTokens = 0;
    let duration = 'N/A';
    if (result.metrics) {
      const m = result.metrics;
      // generateReport()의 summary.totalDuration 사용 (포맷된 문자열)
      duration = m.summary?.totalDuration || m.duration || 'N/A';
      // 토큰 합산: tokens.grandTotal 또는 개별 합산
      if (m.tokens?.grandTotal) {
        totalTokens = m.tokens.grandTotal;
      } else if (m.tokens) {
        totalTokens = (m.tokens.leader?.total || 0) + (m.tokens.codeagent?.total || 0);
      }
      // Phase별 토큰 (phaseUsage)
      if (m.phaseUsage) {
        const phaseTotal = (m.phaseUsage.phase_a_usage?.total || 0) +
                          (m.phaseUsage.phase_b_usage?.total || 0) +
                          (m.phaseUsage.phase_c_usage?.total || 0);
        if (phaseTotal > totalTokens) totalTokens = phaseTotal;
      }
    }

    // ========== 헤더 ==========
    console.log(`\n${divider}`);
    console.log(`🚀 [System B] Execution Report`);
    console.log(divider);

    console.log(`🏷️  Task     : ${taskId}`);
    console.log(`🌊  Pipeline : ${pipelineVisual}`);
    console.log(`⏱️  Duration : ${duration} (${totalTokens.toLocaleString()} tokens)`);
    console.log(`🏁  Status   : ${result.success ? '✅ Success' : '❌ Failed'}`);

    // ========== 1. Phase Execution Summary ==========
    console.log(`\n1️⃣  Phase Execution Summary`);

    // Phase A
    if (result.analysis || pipelineType === 'analysis' || pipelineType === 'analyzed_design' || pipelineType === 'full') {
      const analysisStatus = result.analysis?.success !== false ? '✅ Pass' : '⚠️ Partial';
      const analysisDetail = result.analysis?.summary
        ? `${result.analysis.summary.totalRows?.toLocaleString() || 0}행 분석`
        : 'N/A';
      console.log(`   • 📊 Phase A (Analysis) : ${analysisStatus} - ${analysisDetail}`);
    } else {
      console.log(`   • 📊 Phase A (Analysis) : ⏭️ Skip`);
    }

    // Phase B
    if (result.planning || pipelineType !== 'analysis') {
      const designStatus = result.planning?.reviewResult?.passed !== false ? '✅ Pass' : '⚠️ Fail';
      const designDetail = result.planning?.sdd ? 'SDD, IA, Wireframe 생성됨' : 'N/A';
      console.log(`   • 🎨 Phase B (Design)   : ${designStatus} - ${designDetail}`);
    } else {
      console.log(`   • 🎨 Phase B (Design)   : ⏭️ Skip`);
    }

    // Phase C
    if (result.coding || pipelineType === 'full') {
      const codingStatus = result.coding?.files ? '✅ Pass' : '⏭️ Skip';
      const fileCount = result.coding?.files ? Object.keys(result.coding.files).length : 0;
      const codingDetail = fileCount > 0 ? `${fileCount}개 파일 생성` : 'N/A';
      console.log(`   • ⚙️  Phase C (Coding)   : ${codingStatus} - ${codingDetail}`);
    } else {
      console.log(`   • ⚙️  Phase C (Coding)   : ⏭️ Skip`);
    }

    // ========== 2. Artifacts & Locations ==========
    console.log(`\n2️⃣  Artifacts & Locations`);
    console.log(`   • 📂 Docs     : ./docs/cases/${caseId}/  (SDD, IA, Wireframe)`);

    if (pipelineType === 'analysis' || pipelineType === 'analyzed_design' || pipelineType === 'full') {
      console.log(`   • 💾 Data     : ./docs/cases/${caseId}/analysis/  (SQL Results)`);
    }

    if (pipelineType === 'full' && result.coding?.files) {
      console.log(`   • 💻 Code     : ./backend/src/, ./frontend/src/`);
    }

    // ========== 3. Next Actions & Commands ==========
    console.log(`\n3️⃣  Next Actions & Commands`);

    if (!result.success) {
      const rootCause = this._analyzeFailureRootCause(result.error);
      console.log(`   🔴 [Suspected Issue] ${rootCause.issue}`);
      console.log(`   🛠️  [Suggestion]      ${rootCause.suggestion}`);
    } else {
      const runCommands = this._generateRunCommands(result, caseId);

      if (runCommands && runCommands.length > 0) {
        runCommands.forEach(c => {
          console.log(`   👉 [${c.type}]  ${c.cmd}`);
        });
      } else if (pipelineType === 'analysis') {
        console.log(`   👉 [Check]    open docs/cases/${caseId}/analysis/analysis_report.md`);
      } else if (pipelineType === 'analyzed_design') {
        console.log(`   👉 [Check]    open docs/cases/${caseId}/HANDOFF.md`);
        console.log(`   👉 [Next]     Full 파이프라인으로 구현 진행 (pipeline: full)`);
      } else {
        console.log(`   👉 [Check]    open docs/cases/${caseId}/HANDOFF.md`);
      }
    }

    console.log(divider);
    console.log('');
  }

  /**
   * 생성된 Task ID를 사용자 친화적 형식으로 변환
   * @param {string} rawTaskId - 원본 Task ID
   * @param {string} taskDescription - 작업 설명 (키워드 추출용)
   * @returns {string} - 친화적 Task ID
   */
  generateFriendlyTaskId(rawTaskId, taskDescription) {
    // 이미 친화적 형식이면 그대로 반환
    if (rawTaskId && !rawTaskId.startsWith('task-')) {
      return rawTaskId;
    }

    // 날짜 생성 (YYYYMMDD)
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

    // 설명에서 키워드 추출
    let shortName = 'task';

    // Case 번호 추출
    const caseMatch = taskDescription.match(/case\s*#?(\d+)/i);
    if (caseMatch) {
      shortName = `case${caseMatch[1]}`;
    }

    // 주요 키워드 추출
    const keywords = [
      { pattern: /채용|recruit|job/i, name: 'recruit' },
      { pattern: /휴면|dormancy|dormant/i, name: 'dormancy' },
      { pattern: /활성|active|heavy/i, name: 'active-user' },
      { pattern: /분석|analysis|analyze/i, name: 'analysis' },
      { pattern: /설계|design/i, name: 'design' },
      { pattern: /예측|predict/i, name: 'predict' },
      { pattern: /추천|recommend/i, name: 'recommend' },
    ];

    for (const kw of keywords) {
      if (kw.pattern.test(taskDescription)) {
        shortName += `-${kw.name}`;
        break;
      }
    }

    return `${shortName}-${dateStr}`;
  }

  // ========== HITL Resume & Graceful Exit (v3.5.0) ==========

  /**
   * HITL 체크포인트에서 중단된 세션 재개
   * @param {string} taskId - 태스크 ID
   * @param {Object} session - 저장된 세션 정보
   * @param {Object} options - 실행 옵션
   * @returns {Object} - 실행 결과
   */
  async _resumeFromCheckpoint(taskId, session, options = {}) {
    const checkpoint = session.currentCheckpoint;
    const phase = session.currentPhase;
    const context = session.hitlContext?.context || {};

    console.log(`\n🔄 Resume 시작: ${checkpoint} → ${phase}`);

    const metrics = new MetricsTracker(taskId);

    try {
      switch (checkpoint) {
        case HITLCheckpoint.PRD_REVIEW:
          // PRD Review 승인 후 → 파이프라인 분기부터 재개
          console.log('   → PRD Review 승인됨, 파이프라인 실행 재개');
          sessionStore.updatePhase(taskId, 'pipeline_routing');

          // 저장된 컨텍스트에서 파이프라인 정보 추출
          const pipeline = context.pipeline || 'design';
          const prdContent = session.prdPath || '';
          const taskDescription = session.metadata?.taskDescription || '';

          if (pipeline === 'analysis') {
            return await this.runAnalysisPipeline(taskId, taskDescription, prdContent, options);
          } else if (pipeline === 'analyzed_design') {
            return await this.runAnalyzedDesignPipeline(taskId, taskDescription, prdContent, options);
          }
          // design 파이프라인: Planning부터 시작
          return await this._resumeDesignPipeline(taskId, session, metrics, options);

        case HITLCheckpoint.QUERY_REVIEW:
          // Query Review 승인 후 → 쿼리 실행부터 재개
          console.log('   → Query Review 승인됨, 쿼리 실행 재개');
          sessionStore.updatePhase(taskId, 'query_execution');
          return await this._resumeQueryExecution(taskId, session, metrics, options);

        case HITLCheckpoint.DESIGN_APPROVAL:
          // Design Approval 승인 후 → Coding부터 재개
          console.log('   → Design Approval 승인됨, 구현 단계 재개');
          sessionStore.updatePhase(taskId, 'coding');
          return await this._resumeCodingPhase(taskId, session, metrics, options);

        case HITLCheckpoint.MANUAL_FIX:
          // Manual Fix 승인 후 → 재시도 카운터 초기화하고 Coding 재개
          console.log('   → Manual Fix 승인됨, 재시도 카운터 초기화');
          sessionStore.updatePhase(taskId, 'coding_retry');
          return await this._resumeCodingPhase(taskId, session, metrics, options);

        case HITLCheckpoint.DEPLOY_APPROVAL:
          // Deploy Approval 승인 후 → 완료 처리
          console.log('   → Deploy Approval 승인됨, 배포 완료 처리');
          const result = { success: true, taskId, deployed: true };
          this.completeSession(taskId, result);
          return result;

        default:
          console.log(`   ⚠️ 알 수 없는 체크포인트: ${checkpoint}`);
          throw new Error(`Unknown checkpoint: ${checkpoint}`);
      }
    } catch (error) {
      console.error(`\n❌ Resume 에러: ${error.message}`);
      this.failSession(taskId, error);
      return { success: false, taskId, error: error.message };
    }
  }

  /**
   * Design 파이프라인 재개 (PRD Review 이후)
   */
  async _resumeDesignPipeline(taskId, session, metrics, options) {
    const prdContent = session.prdPath || '';
    const taskDescription = session.metadata?.taskDescription || '';

    // Planning부터 시작
    console.log('📋 [Phase 1] Leader Planning 시작 (Resume)...');
    metrics.startPhase('planning');

    const planResult = await this.leader.plan(taskDescription, prdContent);
    metrics.addTokens('leader', planResult.usage.inputTokens, planResult.usage.outputTokens);
    metrics.endPhase('planning', 'success');

    // 설계 문서 저장
    if (this.saveFiles) {
      await this.savePlanningDocs(taskId, planResult);
    }

    // DESIGN_APPROVAL 체크포인트로 이동
    return await this._checkDesignApprovalAndContinue(taskId, planResult, metrics, options);
  }

  /**
   * Query 실행 재개 (Query Review 이후)
   */
  async _resumeQueryExecution(taskId, session, metrics, options) {
    const context = session.hitlContext?.context || {};
    const sql = context.sql;

    console.log('📊 [Query] 승인된 쿼리 실행 재개...');

    // AnalysisAgent를 통해 쿼리 실행
    const result = await this.analysisAgent.executeApprovedQuery(sql, taskId);

    if (result.success) {
      this.completeSession(taskId, result);
    } else {
      this.failSession(taskId, result.error || 'Query execution failed');
    }

    return result;
  }

  /**
   * Coding 단계 재개 (Design Approval / Manual Fix 이후)
   */
  async _resumeCodingPhase(taskId, session, metrics, options) {
    const context = session.hitlContext?.context || {};

    // 저장된 설계 문서 로드
    const caseId = this.extractCaseId(taskId);
    const docsDir = path.join(this.projectRoot, 'docs', 'cases', caseId);
    const planResult = {
      ia: this._loadDocIfExists(path.join(docsDir, 'IA.md')),
      wireframe: this._loadDocIfExists(path.join(docsDir, 'Wireframe.md')),
      sdd: this._loadDocIfExists(path.join(docsDir, 'SDD.md')),
      handoff: this._loadDocIfExists(path.join(docsDir, 'HANDOFF.md')),
    };

    // Coding 시작
    console.log('⚙️  [Phase 2] CodeAgent Coding 시작 (Resume)...');
    metrics.startPhase('coding_resume');

    const codingResult = await this.codeAgent.implement({
      sdd: planResult.sdd,
      wireframe: planResult.wireframe,
      ia: planResult.ia,
      handoff: planResult.handoff
    });

    metrics.addTokens('codeagent', codingResult.usage.inputTokens, codingResult.usage.outputTokens);
    metrics.endPhase('coding_resume', 'success');

    // 파일 저장
    if (this.saveFiles) {
      await this._saveFiles(codingResult.files, taskId);
    }

    // Review
    console.log('🔍 [Phase 3] Leader Review 시작 (Resume)...');
    const codeForReview = Object.entries(codingResult.files)
      .map(([path, content]) => `### ${path}\n\`\`\`\n${content}\n\`\`\``)
      .join('\n\n');

    const reviewResult = await this.leader.review(codeForReview, planResult.sdd);

    const finalResult = {
      success: reviewResult.passed,
      taskId,
      pipeline: 'design',
      files: codingResult.files,
      review: reviewResult,
      metrics: metrics.generateReport()
    };

    if (finalResult.success) {
      this.completeSession(taskId, finalResult);
    } else {
      this.failSession(taskId, 'Review failed after resume');
    }

    return finalResult;
  }

  /**
   * 설계 문서 승인 체크 후 계속 진행
   */
  async _checkDesignApprovalAndContinue(taskId, planResult, metrics, options) {
    // Feature Flag: AUTO_APPROVE_DESIGN 체크
    if (!isEnabled('HITL_AUTO_APPROVE_DESIGN') && !this.autoApprove) {
      const designCheckpoint = this.checkHITLRequired('design', {
        requiresApproval: true,
        hasIA: !!planResult.ia,
        hasSDD: !!planResult.sdd,
        hasWireframe: !!planResult.wireframe
      });

      if (designCheckpoint) {
        sessionStore.updatePhase(taskId, 'design_approval');
        await this.pauseForHITL(taskId, designCheckpoint, {
          files: {
            ia: planResult.ia ? 'IA.md 생성됨' : null,
            wireframe: planResult.wireframe ? 'Wireframe.md 생성됨' : null,
            sdd: planResult.sdd ? 'SDD.md 생성됨' : null,
            handoff: planResult.handoff ? 'HANDOFF.md 생성됨' : null
          },
          message: '설계 문서가 생성되었습니다. 검토 후 승인하거나 수정을 요청해주세요.',
          docsPath: `docs/cases/${this.extractCaseId(taskId)}/`
        });

        // Graceful Exit
        if (isEnabled('HITL_GRACEFUL_EXIT')) {
          return this._gracefulExitForHITL(taskId, 'DESIGN_APPROVAL');
        }

        // Exit 없이 대기
        const approval = await this.waitForApproval(taskId);
        if (!approval.approved) {
          throw new Error(`설계 승인 거부됨: ${approval.session?.hitlContext?.rejectionReason}`);
        }
        this.resumeSession(taskId);
      }
    }

    // Coding 단계로 진행
    return await this._resumeCodingPhase(taskId, { hitlContext: { context: {} } }, metrics, options);
  }

  /**
   * HITL Graceful Exit (TO-BE: 3-way 옵션 포함)
   *
   * @param {string} taskId - 태스크 ID
   * @param {string} checkpoint - 체크포인트 유형
   * @param {Object} hitlContext - HITL 컨텍스트 (3-way 옵션 포함)
   * @returns {Object} - 종료 상태 반환
   */
  _gracefulExitForHITL(taskId, checkpoint, hitlContext = {}) {
    const { hitl3WayOptions, hitlTrigger, phase } = hitlContext;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`⏸️  HITL 체크포인트 도달: ${checkpoint}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Task ID: ${taskId}`);
    console.log(`   상태: 사용자 승인 대기 중`);

    // 트리거 사유 표시
    if (hitlTrigger && hitlTrigger.length > 0) {
      console.log(`   트리거: ${hitlTrigger.join(', ')}`);
    }

    console.log('');

    // TO-BE: 3-way 옵션 표시
    if (hitl3WayOptions) {
      console.log('   🎯 3-way 결정 옵션:');
      console.log('   ┌─────────────────────────────────────────────────────────────┐');
      console.log(`   │ [1] ${hitl3WayOptions.EXCEPTION_APPROVAL.label.padEnd(12)} │ ${hitl3WayOptions.EXCEPTION_APPROVAL.description}`);
      console.log(`   │ [2] ${hitl3WayOptions.RULE_OVERRIDE.label.padEnd(12)} │ ${hitl3WayOptions.RULE_OVERRIDE.description}`);
      console.log(`   │ [3] ${hitl3WayOptions.REJECT.label.padEnd(12)} │ ${hitl3WayOptions.REJECT.description}`);
      console.log('   └─────────────────────────────────────────────────────────────┘');
      console.log('');
    } else {
      // 기존 방식 (단순 승인/거부)
      console.log('   📋 다음 단계:');
      console.log('      1. Viewer에서 산출물 검토');
      console.log('      2. 승인 또는 거부 결정');
      console.log('      3. 승인 후 동일 taskId로 재실행하여 Resume');
      console.log('');
    }

    console.log('   🔄 Resume 명령:');
    console.log(`      node cli.js --taskId=${taskId}`);

    // 3-way 결정 명령어
    if (hitl3WayOptions) {
      console.log('');
      console.log('   📝 결정 명령:');
      console.log(`      node cli.js --taskId=${taskId} --decision=EXCEPTION_APPROVAL`);
      console.log(`      node cli.js --taskId=${taskId} --decision=RULE_OVERRIDE --comment="규칙 수정 필요"`);
      console.log(`      node cli.js --taskId=${taskId} --decision=REJECT --comment="재작업 필요"`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 프로세스 종료 (상태는 session-store에 저장됨)
    const exitResult = {
      success: false,
      taskId,
      status: 'PAUSED_HITL',
      checkpoint,
      message: `HITL checkpoint reached: ${checkpoint}. Process exiting. Resume after approval.`,
      resumeCommand: `node cli.js --taskId=${taskId}`,
      // TO-BE: 3-way 옵션 정보 포함
      hitl3WayOptions: hitl3WayOptions || null,
      hitlTrigger: hitlTrigger || null
    };

    // 비동기 종료 (로그 출력 완료 후)
    if (isEnabled('HITL_GRACEFUL_EXIT')) {
      setImmediate(() => {
        console.log('👋 프로세스 종료 (HITL 대기)');
        process.exit(0);
      });
    }

    return exitResult;
  }

  /**
   * HITL 3-way 결정 처리 (TO-BE 아키텍처)
   *
   * CLI에서 --decision 옵션으로 호출됨
   *
   * @param {string} taskId - 태스크 ID
   * @param {string} decision - HITLDecision 값
   * @param {Object} options - 추가 옵션
   * @returns {Object} - 처리 결과
   */
  handleHITLDecision(taskId, decision, options = {}) {
    const validDecisions = Object.values(HITLDecision);
    if (!validDecisions.includes(decision)) {
      throw new Error(`Invalid HITL decision: ${decision}. Valid options: ${validDecisions.join(', ')}`);
    }

    const session = sessionStore.handleHITLDecision(taskId, decision, options);

    console.log(`\n✅ HITL 결정 처리 완료: ${decision}`);
    console.log(`   Task ID: ${taskId}`);
    console.log(`   상태: ${session.status}`);

    if (decision === HITLDecision.EXCEPTION_APPROVAL) {
      console.log('\n   → 예외 승인됨. 다음 Phase 진행 가능.');
      console.log(`   Resume: node cli.js --taskId=${taskId}`);
    } else if (decision === HITLDecision.RULE_OVERRIDE) {
      console.log('\n   → 규칙 수정 요청됨. 관리자 검토 필요.');
      console.log(`   요청 내용: ${options.comment || 'N/A'}`);
    } else if (decision === HITLDecision.REJECT) {
      console.log('\n   → 거부됨. 해당 Phase 재작업 필요.');
      console.log(`   사유: ${options.comment || 'N/A'}`);
      console.log(`   재작업 Phase: ${session.hitlContext?.rerunPhase || 'N/A'}`);
    }

    return session;
  }

  /**
   * 검증 결과 기반 HITL 라우팅 (TO-BE 아키텍처)
   *
   * ReviewerTool 결과의 hitlRequired 플래그를 기반으로 라우팅
   *
   * @param {string} taskId - 태스크 ID
   * @param {Object} validationResult - ReviewerTool 검증 결과
   * @param {string} phase - 현재 Phase (A, B, C)
   * @returns {Object} - { shouldContinue, hitlTriggered, session }
   */
  async routeByValidationResult(taskId, validationResult, phase = 'B') {
    const { passed, hitlRequired, hitlTrigger, hitl3WayOptions, score, issues } = validationResult;

    // 자동 검증 PASS → HITL 없이 다음 Phase 진행
    if (passed && !hitlRequired) {
      console.log(`\n✅ ImpLeader 자동 검증 PASS (Score: ${score})`);
      return {
        shouldContinue: true,
        hitlTriggered: false,
        session: null
      };
    }

    // 자동 검증 FAIL → HITL 트리거
    console.log(`\n❌ ImpLeader 자동 검증 FAIL (Score: ${score})`);
    console.log(`   트리거: ${hitlTrigger?.join(', ') || 'GENERAL_FAIL'}`);

    // HITL 체크포인트 결정
    const checkpoint = this._mapPhaseToCheckpoint(phase);

    // 세션 저장 및 HITL 일시정지
    sessionStore.updatePhase(taskId, phase);
    await this.pauseForHITL(taskId, checkpoint, {
      validationResult: {
        score,
        issues: issues?.length || 0,
        trigger: hitlTrigger
      },
      hitl3WayOptions,
      message: validationResult.summary
    });

    // Graceful Exit (3-way 옵션 포함)
    if (isEnabled('HITL_GRACEFUL_EXIT')) {
      return this._gracefulExitForHITL(taskId, checkpoint, {
        hitl3WayOptions,
        hitlTrigger,
        phase
      });
    }

    // Fallback: 폴링 방식
    const approval = await this.waitForApproval(taskId);
    if (!approval.approved) {
      throw new Error(`Validation failed and HITL rejected: ${approval.session?.hitlContext?.rejectionReason || 'No reason'}`);
    }

    return {
      shouldContinue: true,
      hitlTriggered: true,
      session: approval.session
    };
  }

  /**
   * Phase를 HITL 체크포인트로 매핑
   */
  _mapPhaseToCheckpoint(phase) {
    const mapping = {
      'A': HITLCheckpoint.QUERY_REVIEW,
      'B': HITLCheckpoint.DESIGN_APPROVAL,
      'C': HITLCheckpoint.MANUAL_FIX,
      'analysis': HITLCheckpoint.QUERY_REVIEW,
      'design': HITLCheckpoint.DESIGN_APPROVAL,
      'code': HITLCheckpoint.MANUAL_FIX,
      'review': HITLCheckpoint.MANUAL_FIX
    };
    return mapping[phase] || HITLCheckpoint.DESIGN_APPROVAL;
  }

  /**
   * 파일이 존재하면 로드, 없으면 null 반환
   */
  _loadDocIfExists(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8');
      }
    } catch {
      // 무시
    }
    return null;
  }

  /**
   * 위험 쿼리 감지 (v3.5.0)
   * DELETE, DROP, TRUNCATE, UPDATE 등 데이터 변경 쿼리 감지
   * @param {Array} queries - 생성된 쿼리 목록
   * @returns {Array} - 위험 쿼리 목록
   */
  /**
   * v2.0.0: PRD Gap Check 실패 리포트 출력
   * README.md 예상 출력 형식에 맞춰 FAIL 리포트 생성
   * (v2.0.0: prdType 매개변수 제거)
   *
   * @param {string} taskId - 작업 ID
   * @param {string} pipeline - 파이프라인
   * @param {Object} gapCheck - Gap Check 결과
   * @param {Object} metrics - 메트릭스 객체
   */
  _printGapCheckFailReport(taskId, pipeline, gapCheck, metrics) {
    const duration = typeof metrics?.getTotalDuration === 'function'
      ? metrics.formatDuration(metrics.getTotalDuration())
      : '0.0s';
    const tokenObj = typeof metrics?.getTotalTokens === 'function' ? metrics.getTotalTokens() : { total: 0 };
    const tokens = tokenObj?.total || 0;
    const missingFields = gapCheck?.missing || [];
    const pipelineLabel = pipeline === 'analysis' ? 'Analysis Only (A)' :
                          pipeline === 'analyzed_design' ? 'Analyzed Design (A→B)' :
                          pipeline === 'code' ? 'Code Only (C)' :
                          pipeline === 'ui_mockup' ? 'UI Mockup (B→C)' :
                          pipeline === 'full' ? 'Full (A→B→C)' : 'Design Only (B)';

    // 누락된 필드 간단 표시 (괄호 제거)
    const shortMissing = missingFields
      .map(m => m.replace(/\([^)]*\)/g, '').trim())
      .filter(m => m.length > 0);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 [System B] Execution Report');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🏷️  Task     : ${taskId}`);
    console.log(`🌊  Pipeline : ${pipelineLabel}`);
    console.log(`⏱️  Duration : ${duration} (${tokens.toLocaleString()} tokens)`);
    console.log(`🏁  Status   : ❌ Failed`);
    console.log('');
    console.log('1️⃣  Phase Execution Summary');
    console.log('   • 📊 Phase A (Analysis) : ⏭️ Skip');
    console.log(`   • 🎨 Phase B (Design)   : ⚠️ Fail - PRD Gap: ${shortMissing.join(', ')} 누락`);
    console.log('');
    console.log('3️⃣  Next Actions & Commands');
    console.log(`   🔴 [Suspected Issue] PRD 불완전 - ${missingFields.length}개 섹션 누락`);
    console.log(`   🛠️  [Suggestion]      "${shortMissing.join('", "')}" 섹션을 추가해주세요`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  /**
   * 잘못된 파이프라인 FAIL 리포트 출력
   * @param {string} taskId - 태스크 ID
   * @param {string} invalidPipeline - 유효하지 않은 파이프라인 값
   * @param {Object} metrics - 메트릭스 객체
   */
  _printInvalidPipelineFailReport(taskId, invalidPipeline, metrics) {
    const duration = typeof metrics?.getTotalDuration === 'function'
      ? metrics.formatDuration(metrics.getTotalDuration())
      : '0.0s';
    const tokenObj = typeof metrics?.getTotalTokens === 'function' ? metrics.getTotalTokens() : { total: 0 };
    const tokens = tokenObj?.total || 0;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 [System B] Execution Report');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🏷️  Task     : ${taskId}`);
    console.log(`🌊  Pipeline : Invalid (${invalidPipeline})`);
    console.log(`⏱️  Duration : ${duration} (${tokens} tokens)`);
    console.log('🏁  Status   : ❌ Failed');
    console.log('');
    console.log('1️⃣  Phase Execution Summary');
    console.log('   • 📊 Phase A (Analysis) : ⏭️ Skip');
    console.log(`   • 🎨 Phase B (Design)   : ⚠️ Fail - 유효하지 않은 파이프라인: "${invalidPipeline}"`);
    console.log('');
    console.log('3️⃣  Next Actions & Commands');
    console.log(`   🔴 [Suspected Issue] 유효하지 않은 파이프라인 지정: "${invalidPipeline}"`);
    console.log('   🛠️  [Suggestion]      유효한 파이프라인: "analysis", "design", "analyzed_design", "code", "ui_mockup", "full"');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  // ========== 보안 검증 메서드 (Case 04: SQL Injection 방어) ==========

  /**
   * PRD 내 SQL 블록 보안 검증
   * @param {string} prdContent - PRD 원본 내용
   * @param {string} taskId - 태스크 ID
   * @returns {Object} { passed, violations, blockedCount }
   */
  _validatePRDSecurity(prdContent, taskId) {
    const violations = [];
    const sqlValidator = new SQLValidator({ strictMode: true });

    // 1. PRD에서 SQL 코드 블록 추출
    const sqlBlocks = this._extractSQLBlocks(prdContent);

    // 2. 각 SQL 블록 검증
    for (const block of sqlBlocks) {
      const result = sqlValidator.validate(block.sql);

      if (!result.valid) {
        for (const violation of result.violations) {
          violations.push({
            ...violation,
            sql: block.sql.substring(0, 100),
            blockIndex: block.index
          });

          // 보안 로그 출력 (README.md 예상 형식)
          const timestamp = new Date().toISOString();
          if (violation.type === 'WRITE_COMMAND_FORBIDDEN') {
            const cmdType = this._detectWriteCommandType(block.sql);
            console.log(`🔒 [${timestamp}] [DANGEROUS_QUERY_BLOCKED] ${cmdType} statement detected`);
          } else if (violation.type === 'SENSITIVE_COLUMN_ACCESS') {
            for (const col of violation.columns || []) {
              console.log(`🔒 [${timestamp}] [SENSITIVE_COLUMN_ACCESS] ${col} access blocked`);
            }
          } else if (violation.type === 'FORBIDDEN_PATTERN') {
            console.log(`🔒 [${timestamp}] [FORBIDDEN_PATTERN] ${violation.message}`);
          }
        }
      }
    }

    // 3. PRD 텍스트 내 프롬프트 인젝션 패턴 검사
    const promptInjections = this._detectPromptInjection(prdContent);
    for (const injection of promptInjections) {
      const timestamp = new Date().toISOString();
      console.log(`🔒 [${timestamp}] [PROMPT_INJECTION_DETECTED] ${injection.pattern}`);
      violations.push({
        type: 'PROMPT_INJECTION',
        severity: 'CRITICAL',
        message: `프롬프트 인젝션 시도 감지: ${injection.pattern}`,
        pattern: injection.pattern
      });
    }

    const blockedCount = violations.filter(v =>
      v.severity === 'CRITICAL' || v.severity === 'ERROR'
    ).length;

    return {
      passed: blockedCount === 0,
      violations,
      blockedCount,
      totalChecked: sqlBlocks.length
    };
  }

  /**
   * PRD에서 SQL 코드 블록 추출
   */
  _extractSQLBlocks(prdContent) {
    const blocks = [];

    // ```sql ... ``` 형식
    const sqlCodeBlockRegex = /```sql\s*([\s\S]*?)```/gi;
    let match;
    let index = 0;

    while ((match = sqlCodeBlockRegex.exec(prdContent)) !== null) {
      const sqlContent = match[1].trim();
      // 세미콜론으로 여러 쿼리 분리
      const queries = sqlContent.split(';').filter(q => q.trim());

      for (const sql of queries) {
        blocks.push({
          sql: sql.trim(),
          index: index++,
          raw: match[0]
        });
      }
    }

    // 인라인 SQL 패턴 (SELECT, INSERT, UPDATE, DELETE, DROP 등으로 시작)
    const inlineSQLRegex = /(?:SELECT|INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER)\s+[^`\n]+/gi;
    while ((match = inlineSQLRegex.exec(prdContent)) !== null) {
      // 이미 코드 블록에서 추출한 것과 중복 방지
      const sql = match[0].trim();
      if (!blocks.some(b => b.sql.includes(sql.substring(0, 50)))) {
        blocks.push({
          sql,
          index: index++,
          raw: match[0]
        });
      }
    }

    return blocks;
  }

  /**
   * 쓰기 명령어 타입 감지
   */
  _detectWriteCommandType(sql) {
    const upperSQL = sql.toUpperCase();
    if (upperSQL.includes('DROP')) return 'DROP';
    if (upperSQL.includes('DELETE')) return 'DELETE';
    if (upperSQL.includes('UPDATE')) return 'UPDATE';
    if (upperSQL.includes('INSERT')) return 'INSERT';
    if (upperSQL.includes('TRUNCATE')) return 'TRUNCATE';
    if (upperSQL.includes('ALTER')) return 'ALTER';
    return 'WRITE';
  }

  /**
   * 프롬프트 인젝션 패턴 감지
   */
  _detectPromptInjection(content) {
    const injections = [];
    const patterns = [
      { regex: /ignore\s+(previous|all)\s+instructions/i, name: 'ignore instructions' },
      { regex: /rm\s+-rf/i, name: 'rm -rf pattern' },
      { regex: /execute:\s*`[^`]+`/i, name: 'execute command' },
      { regex: /system\s*\(\s*['"][^'"]+['"]\s*\)/i, name: 'system call' },
      { regex: /eval\s*\(/i, name: 'eval pattern' },
    ];

    for (const { regex, name } of patterns) {
      if (regex.test(content)) {
        injections.push({ pattern: name, match: content.match(regex)?.[0] });
      }
    }

    return injections;
  }

  /**
   * 보안 FAIL 리포트 출력
   */
  _printSecurityFailReport(taskId, securityCheck, metrics) {
    const duration = typeof metrics?.getTotalDuration === 'function'
      ? metrics.formatDuration(metrics.getTotalDuration())
      : '0.0s';
    const tokenObj = typeof metrics?.getTotalTokens === 'function' ? metrics.getTotalTokens() : { total: 0 };
    const tokens = tokenObj?.total || 0;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 [System B] Execution Report');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🏷️  Task     : ${taskId}`);
    console.log(`🌊  Pipeline : Analysis Only (A)`);
    console.log(`⏱️  Duration : ${duration} (${tokens} tokens)`);
    console.log('🏁  Status   : ❌ Failed');
    console.log('');
    console.log('1️⃣  Phase Execution Summary');
    console.log(`   • 📊 Phase A (Analysis) : ❌ Blocked - 보안 위반 쿼리 차단됨`);
    console.log('   • 🎨 Phase B (Design)   : ⏭️ Skip');
    console.log('');
    console.log('3️⃣  Next Actions & Commands');
    console.log(`   🔴 [Suspected Issue] 보안 정책 위반 - 위험 쿼리 ${securityCheck.blockedCount}개 차단됨`);
    console.log('   🛠️  [Suggestion]      SELECT 쿼리만 허용됩니다. INSERT/UPDATE/DELETE/DROP 금지');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 감사 로그 경로 안내
    const today = new Date().toISOString().split('T')[0];
    console.log(`\n⚠️ 보안 로그: orchestrator/logs/audit/audit-${today}.jsonl`);
  }

  // ========== Case 05: PRD 크기 검증 (초대형 PRD) ==========

  /**
   * 초대형 PRD Partial 리포트 출력 (Case 05)
   */
  _printOversizedPRDReport(taskId, featureCheck, reviewResult, metricsReport) {
    const duration = metricsReport?.duration || '0.0s';
    const tokens = metricsReport?.tokens?.total || 0;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 [System B] Execution Report');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🏷️  Task     : ${taskId}`);
    console.log(`🌊  Pipeline : Mixed (A→B)`);
    console.log(`⏱️  Duration : ${duration} (${tokens.toLocaleString()} tokens)`);
    console.log('🏁  Status   : ⚠️ Partial');
    console.log('');
    console.log('1️⃣  Phase Execution Summary');
    console.log('   • 📊 Phase A (Analysis) : ⚠️ Partial - Mock 데이터 사용');
    console.log(`   • 🎨 Phase B (Design)   : ⚠️ Fail - 요구사항 과다 (${featureCheck.featureCount}개 기능)`);
    console.log('');
    console.log('3️⃣  Next Actions & Commands');
    console.log('   🔴 [Suspected Issue] PRD 범위 과다 - 단일 iteration에서 처리 불가');
    console.log('   🛠️  [Suggestion]      PRD를 여러 Phase로 분할하거나 핵심 기능만 선별해주세요');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n⚠️ 토큰 사용량이 높습니다. PRD 분할을 권장합니다.');
  }

  // ========== Case 09: 보호된 경로 검증 ==========

  /**
   * PRD 내 보호된 경로 접근 시도 감지
   * @param {string} prdContent - PRD 원본 내용
   * @returns {Object} { passed, violations }
   */
  _validateProtectedPaths(prdContent) {
    const violations = [];
    const timestamp = new Date().toISOString();

    // 1. 보호된 경로 직접 참조 감지
    for (const protectedPath of PROTECTED_PATHS) {
      const regex = new RegExp(protectedPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      if (regex.test(prdContent)) {
        console.log(`🔒 [${timestamp}] [PROTECTED_PATH_ACCESS] ${protectedPath}`);
        violations.push({
          type: 'PROTECTED_PATH_ACCESS',
          path: protectedPath,
          severity: 'CRITICAL'
        });
      }
    }

    // 2. Path Traversal 패턴 감지 (../ 패턴)
    const traversalRegex = /\.\.\/[^\s]+/g;
    let traversalMatch;
    while ((traversalMatch = traversalRegex.exec(prdContent)) !== null) {
      console.log(`🔒 [${timestamp}] [PATH_TRAVERSAL_DETECTED] ${traversalMatch[0]}`);
      violations.push({
        type: 'PATH_TRAVERSAL',
        path: traversalMatch[0],
        severity: 'CRITICAL'
      });
    }

    // 3. 프롬프트 인젝션 (기존 메서드 재사용)
    const promptInjections = this._detectPromptInjection(prdContent);
    for (const injection of promptInjections) {
      console.log(`🔒 [${timestamp}] [PROMPT_INJECTION_DETECTED] ${injection.pattern}`);
      violations.push({
        type: 'PROMPT_INJECTION',
        pattern: injection.pattern,
        severity: 'CRITICAL'
      });
    }

    return {
      passed: violations.length === 0,
      violations,
      blockedCount: violations.length
    };
  }

  /**
   * 보호된 경로 FAIL 리포트 출력 (Case 09)
   */
  _printProtectedPathFailReport(taskId, violations, metrics) {
    const duration = typeof metrics?.getTotalDuration === 'function'
      ? metrics.formatDuration(metrics.getTotalDuration())
      : '0.0s';
    const tokenObj = typeof metrics?.getTotalTokens === 'function' ? metrics.getTotalTokens() : { total: 0 };
    const tokens = tokenObj?.total || 0;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 [System B] Execution Report');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🏷️  Task     : ${taskId}`);
    console.log(`🌊  Pipeline : Design Only (B)`);
    console.log(`⏱️  Duration : ${duration} (${tokens} tokens)`);
    console.log('🏁  Status   : ❌ Failed');
    console.log('');
    console.log('1️⃣  Phase Execution Summary');
    console.log('   • 📊 Phase A (Analysis) : ⏭️ Skip');
    console.log('   • 🎨 Phase B (Design)   : ❌ Blocked - 보안 정책 위반');
    console.log('');
    console.log('3️⃣  Next Actions & Commands');
    console.log('   🔴 [Suspected Issue] Constitution 보호 및 Path Traversal 시도 차단');
    console.log('   🛠️  [Suggestion]      .claude/rules/*, CLAUDE.md는 수정 불가합니다');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const today = new Date().toISOString().split('T')[0];
    console.log(`\n⚠️ 보안 로그: orchestrator/logs/audit/audit-${today}.jsonl`);
  }

  // ========== 유틸리티 메서드 (SubAgent 대체) ==========

  /**
   * 파일 목록을 Output 형식으로 변환
   * @param {Object} files - { filename: content } 형태
   * @returns {Array} - Output 배열
   */
  _filesToOutputs(files) {
    if (!files || typeof files !== 'object') return [];

    return Object.entries(files).map(([filename, content]) => ({
      filename,
      content,
      type: this._inferFileType(filename)
    }));
  }

  /**
   * 파일 타입 추론
   */
  _inferFileType(filename) {
    if (filename.endsWith('.md')) return 'markdown';
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'typescript';
    if (filename.endsWith('.js') || filename.endsWith('.jsx')) return 'javascript';
    if (filename.endsWith('.sql')) return 'sql';
    return 'text';
  }

  /**
   * Output 검증
   * @param {Array} outputs - Output 배열
   * @param {Object} gapCheck - PRD Gap Check 결과
   * @returns {Object} - 검증 결과
   */
  _validateOutputs(outputs, gapCheck) {
    const deliverables = gapCheck?.deliverables || [];
    const total = deliverables.length;

    // 간단한 매칭: 파일 개수 기준
    const matched = Math.min(outputs.length, total);

    return {
      passed: outputs.length > 0,
      prdMatch: {
        total,
        matched,
        missing: deliverables.slice(matched).map(d => d.item || d)
      },
      syntaxErrors: [],
      schemaErrors: []
    };
  }

  /**
   * 파일 저장
   * @param {Object} files - { path: content } 형태
   * @param {string} taskId - 태스크 ID
   */
  async _saveFiles(files, taskId) {
    const savedFiles = [];
    const caseId = this.extractCaseId(taskId);
    const baseDir = path.join(this.projectRoot, 'docs', 'cases', caseId);

    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = path.join(baseDir, filePath);
      const dir = path.dirname(fullPath);

      // 디렉토리 생성
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 파일 저장
      fs.writeFileSync(fullPath, content, 'utf-8');
      savedFiles.push(fullPath);
      console.log(`   📄 Saved: ${filePath}`);
    }

    console.log(`   ✅ ${savedFiles.length}개 파일 저장 완료`);
    return savedFiles;
  }

  /**
   * P1-2: 라우팅 결정 로직 (v2.0.0: type 제거, pipeline만 사용)
   * 파이프라인 필드 기반으로 라우팅 결정
   *
   * @param {string} pipeline - analysis | design | analyzed_design | code | ui_mockup | full
   * @param {Object} options - 실행 옵션 (mode, pipeline 오버라이드)
   * @returns {{ selectedPipeline: string, reason: string, invalidPipeline?: string }}
   */
  _determineRoutingDecision(pipeline, options = {}) {
    // 유효한 파이프라인 목록 (6개 타입)
    const VALID_PIPELINES = ['analysis', 'design', 'analyzed_design', 'code', 'ui_mockup', 'full', 'auto'];

    // 1. CLI 옵션으로 명시적 파이프라인 지정된 경우 (최우선)
    if (options.pipeline && options.pipeline !== 'auto') {
      // CLI 옵션 유효성 검사
      if (!VALID_PIPELINES.includes(options.pipeline)) {
        return {
          selectedPipeline: null,
          reason: `CLI 옵션 유효하지 않음 (--pipeline ${options.pipeline})`,
          invalidPipeline: options.pipeline
        };
      }
      return {
        selectedPipeline: options.pipeline,
        reason: `CLI 옵션 명시 (--pipeline ${options.pipeline})`
      };
    }

    // 2. PRD 파일에 pipeline 필드가 명시된 경우
    if (pipeline) {
      // PRD pipeline 필드 유효성 검사
      if (!VALID_PIPELINES.includes(pipeline)) {
        // 숫자형 또는 타입 불일치 → 기본값 폴백 (경고만)
        const isNumericOrTypeMismatch = /^\d+$/.test(pipeline) ||
          pipeline === '[object Object]' ||
          pipeline === 'null' ||
          pipeline === 'undefined' ||
          pipeline === 'NaN';

        if (isNumericOrTypeMismatch) {
          // 타입 불일치: 기본값으로 폴백 (경고)
          console.log(`   ⚠️ Pipeline "${pipeline}" 타입 불일치 → 기본값 "design" 적용`);
          return {
            selectedPipeline: 'design',
            reason: `PRD pipeline 타입 불일치 (${pipeline}) → 기본값 design 폴백`,
            typeMismatch: pipeline
          };
        }

        // 유효하지 않은 문자열 파이프라인 → FAIL
        return {
          selectedPipeline: null,
          reason: `PRD pipeline 필드 유효하지 않음 (pipeline: ${pipeline})`,
          invalidPipeline: pipeline
        };
      }
      return {
        selectedPipeline: pipeline,
        reason: `PRD pipeline 필드 명시 (pipeline: ${pipeline})`
      };
    }

    // 3. pipeline 미지정 → 기본값 design
    return {
      selectedPipeline: 'design',
      reason: 'PRD pipeline 미지정 → 기본값 design'
    };
  }

  /**
   * [P2-2] Doc-Sync 트리거 (Milestone 3)
   *
   * Phase B Reviewer가 PASS한 경우 자동으로 Notion 동기화
   *
   * @param {string} taskId - 케이스 ID
   */
  async _triggerDocSync(taskId) {
    try {
      console.log(`\n[Doc-Sync] Uploading documents to Notion...`);

      const docSync = new DocSyncSkill({
        projectRoot: this.projectRoot
      });
      await docSync.initialize();

      const syncResult = await docSync.syncCase(taskId, {
        projectRoot: this.projectRoot
      });

      if (syncResult.summary.uploaded > 0) {
        console.log(`[Doc-Sync] ✅ ${syncResult.summary.uploaded}개 문서 동기화 완료 (${syncResult.mode} 모드)`);
      }

      return syncResult;

    } catch (error) {
      console.warn(`[Doc-Sync] ⚠️ 동기화 실패: ${error.message}`);
      // 동기화 실패가 전체 파이프라인을 중단시키지 않도록 경고만 출력
      return { error: error.message };
    }
  }

  _detectDangerousQueries(queries) {
    const dangerous = [];
    const dangerousPatterns = [
      { pattern: /\bDELETE\s+FROM\b/i, type: 'DELETE' },
      { pattern: /\bDROP\s+(TABLE|DATABASE|INDEX|VIEW)\b/i, type: 'DROP' },
      { pattern: /\bTRUNCATE\s+TABLE\b/i, type: 'TRUNCATE' },
      { pattern: /\bUPDATE\s+\w+\s+SET\b/i, type: 'UPDATE' },
      { pattern: /\bALTER\s+TABLE\b/i, type: 'ALTER' },
      { pattern: /\bINSERT\s+INTO\b/i, type: 'INSERT' },
      { pattern: /\bEXEC\s*\(/i, type: 'EXEC' },
      { pattern: /\bGRANT\b/i, type: 'GRANT' },
      { pattern: /\bREVOKE\b/i, type: 'REVOKE' },
    ];

    const queryList = Array.isArray(queries) ? queries : [queries];

    queryList.forEach((queryObj, index) => {
      const query = typeof queryObj === 'string' ? queryObj : queryObj.sql || queryObj.query || '';

      for (const { pattern, type } of dangerousPatterns) {
        if (pattern.test(query)) {
          dangerous.push({
            index,
            type,
            query: query.substring(0, 500),
            fullQuery: query
          });
          break; // 하나만 감지되면 충분
        }
      }
    });

    return dangerous;
  }
}

export default Orchestrator;
