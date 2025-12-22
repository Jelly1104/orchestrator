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
 * @version 3.5.0
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { LeaderAgent } from './agents/leader.js';
import { SubAgent } from './agents/subagent.js';
import { CodeAgent } from './agents/code-agent.js';
import { AnalysisAgent } from './agents/analysis-agent.js';
import { MetricsTracker } from './metrics/tracker.js';
import { FeedbackLoopController } from './agents/feedback-loop.js';
import { PRDAnalyzer } from './agents/prd-analyzer.js';

// Phase D: Security Layer 연동
import { isEnabled } from './config/feature-flags.js';
import { getKillSwitch } from './security/kill-switch.js';
import { getRateLimiter } from './security/rate-limiter.js';
import { getSecurityMonitor, EVENT_TYPES } from './security/security-monitor.js';
import { getAuditLogger } from './utils/audit-logger.js';

// Phase 0: Session Store 연동 (Pause/Resume 지원)
const require = createRequire(import.meta.url);
const { sessionStore, SessionStatus, HITLCheckpoint } = require('./state/session-store.js');

// ========== 보안 상수 (하드코딩 - 사용자 설정 무시) ==========
const SECURITY_LIMITS = {
  MAX_RETRIES: 5,                    // 최대 재시도 횟수 (하드코딩 상한)
  MAX_RETRIES_PER_HOUR: 20,          // 시간당 최대 재시도
  MAX_TASK_DESCRIPTION_LENGTH: 10000, // taskDescription 최대 길이
  MAX_PRD_CONTENT_LENGTH: 50000,     // prdContent 최대 길이
  TASK_ID_PATTERN: /^[a-zA-Z0-9_-]+$/, // taskId 허용 패턴
};

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
    this.logDir = path.join(this.projectRoot, 'orchestrator/logs');

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
    this.subagent = new SubAgent({
      projectRoot: this.projectRoot,
      ...this.providerConfig
    });

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
      outputDir: config.analysisOutputDir || path.join(this.projectRoot, 'src', 'analysis')
    });

    console.log(`[Orchestrator] Provider: ${this.providerConfig.provider}`);
    console.log(`[Orchestrator] Fallback: ${this.providerConfig.useFallback ? 'enabled' : 'disabled'}`);
  }

  // ========== 보안: 입력 검증 ==========

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
    // 자동 승인 모드면 HITL 스킵
    if (this.autoApprove) {
      return null;
    }

    // AGENT_ARCHITECTURE.md 기반 HITL 체크포인트
    switch (phase) {
      case 'planning':
        // 1. PRD 보완 필요 시 (v1.2.0: missing 배열 체크 개선)
        // gapCheck.missing 또는 gapCheck.hasHighSeverityGaps 체크
        if (context.gapCheck?.missing?.length > 0 || context.gapCheck?.hasHighSeverityGaps) {
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

    // ========== Phase 0: Resume 로직 (v3.5.0) ==========
    // 기존 세션이 APPROVED 상태면 중단된 지점부터 재개
    if (isEnabled('HITL_RESUME_ENABLED')) {
      const existingSession = sessionStore.get(taskId);
      if (existingSession && existingSession.status === SessionStatus.APPROVED) {
        console.log('\n▶️  HITL Resume 감지');
        console.log(`   Task ID: ${taskId}`);
        console.log(`   중단 지점: ${existingSession.currentCheckpoint}`);
        console.log(`   Phase: ${existingSession.currentPhase}`);

        // 세션 재개
        this.resumeSession(taskId);

        // 중단 지점에 따라 적절한 위치부터 재개
        return await this._resumeFromCheckpoint(taskId, existingSession, options);
      }
    }

    // 메트릭 트래커 초기화
    const metrics = new MetricsTracker(taskId);

    console.log('\n🚀 Orchestrator 시작');
    console.log(`📌 Task ID: ${taskId}`);
    console.log(`📝 Task: ${sanitizedDescription.substring(0, 100)}${sanitizedDescription.length > 100 ? '...' : ''}`);
    console.log(`🔄 자동 승인: ${this.autoApprove ? 'ON' : 'OFF'}`);
    console.log(`🔁 최대 재시도: ${this.maxRetries}회\n`);

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
      // ========== Phase 0: PRD v2 유형 판별 ==========
      console.log('🔍 [Phase 0] PRD 유형 판별...');

      const prdClassification = this.prdAnalyzer.classifyPRDv2(prdContent);
      const prdType = prdClassification?.type || 'QUALITATIVE';
      const pipeline = prdClassification?.pipeline || 'design';

      console.log(`   - PRD 유형: ${prdType}`);
      console.log(`   - 파이프라인: ${pipeline}`);

      // ========== HITL: PRD_REVIEW 체크포인트 (Graceful Exit 패턴) ==========
      // PRD Gap Check 결과가 불완전할 경우 사람의 검토 필요
      if (prdClassification?.gapCheck?.missing?.length > 0) {
        const prdCheckpoint = this.checkHITLRequired('planning', {
          gapCheck: prdClassification.gapCheck
        });

        if (prdCheckpoint) {
          sessionStore.updatePhase(taskId, 'prd_review');
          await this.pauseForHITL(taskId, prdCheckpoint, {
            missing: prdClassification.gapCheck.missing,
            prdType,
            pipeline,
            message: 'PRD에 필수 항목이 누락되었습니다. 검토 후 승인하거나 PRD를 보완해주세요.'
          });

          // Graceful Exit: 프로세스 종료 후 재실행 시 Resume 로직에서 처리
          if (isEnabled('HITL_GRACEFUL_EXIT')) {
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

      // ========== 유형별 파이프라인 분기 ==========
      if (pipeline === 'analysis' || prdType === 'QUANTITATIVE') {
        return await this.runAnalysisPipeline(taskId, sanitizedDescription, prdContent, options);
      }

      if (pipeline === 'mixed' || prdType === 'MIXED') {
        return await this.runMixedPipeline(taskId, sanitizedDescription, prdContent, options);
      }

      // 기본: design 파이프라인 (기존 로직)
      // mode 옵션 확인 (design only 모드 지원)
      const isDesignOnly = options.mode === 'design';
      console.log(`   → Design 파이프라인 실행 ${isDesignOnly ? '(설계 문서 전용)' : '(설계+구현)'}\n`);

      // ========== Phase 1: Planning ==========
      console.log('📋 [Phase 1] Leader Planning 시작...');
      metrics.startPhase('planning');

      const planResult = await this.leader.plan(sanitizedDescription, prdContent);
      metrics.addTokens('leader', planResult.usage.inputTokens, planResult.usage.outputTokens);

      sdd = planResult.sdd;

      // 설계 문서 저장
      if (this.saveFiles) {
        await this.savePlanningDocs(taskId, planResult);
      }

      console.log('✅ Planning 완료');
      console.log(`   - IA.md: ${planResult.ia ? '생성됨' : '없음'}`);
      console.log(`   - Wireframe.md: ${planResult.wireframe ? '생성됨' : '없음'}`);
      console.log(`   - SDD.md: ${planResult.sdd ? '생성됨' : '없음'}`);
      console.log(`   - HANDOFF.md: ${planResult.handoff ? '생성됨' : '없음'}`);
      console.log(`   - Gap Check: ${planResult.gapCheck ? '완료' : '스킵'}`);
      console.log(`   - 토큰: ${planResult.usage.inputTokens + planResult.usage.outputTokens}`);

      // HANDOFF 누락 시 자동 생성 (fallback)
      if (!planResult.handoff && planResult.sdd) {
        console.log('\n⚠️  HANDOFF.md 누락 - 자동 생성 중...');
        planResult.handoff = this.generateFallbackHandoff(planResult, sanitizedDescription, prdContent);
        console.log('   ✅ HANDOFF.md fallback 생성 완료');
      }

      // Gap Check 결과 로깅
      if (planResult.gapCheck) {
        console.log(`   - PRD 유형: ${planResult.gapCheck.prdType}`);
        console.log(`   - 산출물 체크리스트: ${planResult.gapCheck.deliverables?.length || 0}개`);
      }

      metrics.endPhase('planning', 'success');

      // ========== HITL: DESIGN_APPROVAL 체크포인트 (Graceful Exit 패턴) ==========
      // 설계 문서 생성 완료 후 사람의 승인 필요
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
          gapCheck: planResult.gapCheck,
          message: '설계 문서가 생성되었습니다. 검토 후 승인하거나 수정을 요청해주세요.',
          docsPath: `docs/${taskId}/`
        });

        // Graceful Exit: 프로세스 종료 후 재실행 시 Resume 로직에서 처리
        if (isEnabled('HITL_GRACEFUL_EXIT')) {
          return this._gracefulExitForHITL(taskId, designCheckpoint);
        }

        // Fallback: 폴링 방식 (HITL_GRACEFUL_EXIT=false일 때)
        const designApproval = await this.waitForApproval(taskId);
        if (!designApproval.approved) {
          throw new Error(`설계 승인 거부됨: ${designApproval.session?.hitlContext?.rejectionReason || '사유 없음'}`);
        }
        this.resumeSession(taskId);
        console.log('✅ Design Approval 승인됨 - 구현 단계로 진행');
      }

      // ========== Design Only 모드: SubAgent로 설계 문서 보완 ==========
      if (isDesignOnly) {
        console.log('\n📝 [Phase 2] Design Mode: SubAgent 설계 문서 보완...');
        metrics.startPhase('design_subagent');

        // SubAgent Design Mode로 설계 문서 보완
        const designResult = await this.subagent.implementDesign(planResult.handoff, {
          documentType: 'all',
          prdAnalysis: planResult.gapCheck
        });

        metrics.addTokens('subagent', designResult.usage.inputTokens, designResult.usage.outputTokens);

        // SubAgent가 생성한 설계 문서와 Leader 문서 병합
        const leaderDocs = {
          'IA.md': planResult.ia,
          'Wireframe.md': planResult.wireframe,
          'SDD.md': planResult.sdd
        };

        // SubAgent 결과가 더 상세하면 병합, 아니면 Leader 결과 유지
        for (const [fileName, content] of Object.entries(designResult.files)) {
          const leaderContent = leaderDocs[fileName];
          if (!leaderContent || content.length > leaderContent.length) {
            currentFiles[fileName] = content;
            console.log(`   - ${fileName}: SubAgent 결과 사용 (${content.length} chars)`);
          } else {
            currentFiles[fileName] = leaderContent;
            console.log(`   - ${fileName}: Leader 결과 유지 (${leaderContent.length} chars)`);
          }
        }

        // Leader가 생성했지만 SubAgent가 생성하지 않은 문서도 포함
        for (const [fileName, content] of Object.entries(leaderDocs)) {
          if (content && !currentFiles[fileName]) {
            currentFiles[fileName] = content;
            console.log(`   - ${fileName}: Leader 결과 추가`);
          }
        }

        // HANDOFF.md 추가
        if (planResult.handoff) {
          currentFiles['HANDOFF.md'] = planResult.handoff;
        }

        metrics.endPhase('design_subagent', 'success');

        // Output Validation
        console.log('\n🔍 [Phase 3] Design Output Validation...');
        const outputs = this.subagent.filesToOutputs(currentFiles);
        const validationResult = this.subagent.validateOutputs(outputs, planResult.gapCheck);

        const passed = validationResult.passed;
        console.log(`   - 전체 통과: ${passed ? '✅' : '❌'}`);
        console.log(`   - PRD 매칭: ${validationResult.prdMatch?.matched || 0}/${validationResult.prdMatch?.total || 0}`);

        // 파일 저장
        if (this.saveFiles) {
          const docsDir = path.join(this.projectRoot, 'orchestrator', 'docs', taskId);
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
          designSubagent: designResult,
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
          await this.subagent.saveFiles(codingResult.files);
        }

        metrics.endPhase(codingPhase, 'success');

        // ========== Phase 2.5: Output Validation (Gap Check 결과 기반) ==========
        let validationResult = null;
        let validationFeedback = '';

        if (planResult.gapCheck && planResult.gapCheck.deliverables?.length > 0) {
          console.log('\n🔍 [Phase 2.5] Output Validation 시작...');
          const outputs = this.subagent.filesToOutputs(currentFiles);
          validationResult = this.subagent.validateOutputs(outputs, planResult.gapCheck);

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
      parsedPRD.type = 'QUANTITATIVE';
      parsedPRD.pipeline = 'analysis';

      // DB 연결 정보 추가 (옵션 또는 PRD에서)
      if (options.dbConfig) {
        parsedPRD.dbConnection = options.dbConfig;
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
      const analysisResult = await this.analysisAgent.analyze(parsedPRD);

      metrics.endPhase('analysis', analysisResult.success ? 'success' : 'fail');

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
        prdType: 'QUANTITATIVE',
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
   * Mixed 파이프라인 실행 (정량 → 정성 체이닝)
   * @param {string} taskId - 태스크 ID
   * @param {string} taskDescription - 작업 설명
   * @param {string} prdContent - PRD 내용
   * @param {Object} options - 추가 옵션
   * @returns {Object} - 통합 결과
   */
  async runMixedPipeline(taskId, taskDescription, prdContent, options = {}) {
    console.log('   → Mixed 파이프라인 실행 (Phase A: Analysis → Phase B: Design)\n');

    const metrics = new MetricsTracker(taskId);

    try {
      // ========== Phase A: Analysis ==========
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 [Phase A] Analysis 시작...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      metrics.startPhase('analysis');

      const parsedPRD = this.prdAnalyzer.parsePRD(prdContent);
      parsedPRD.type = 'MIXED';
      parsedPRD.pipeline = 'mixed';

      if (options.dbConfig) {
        parsedPRD.dbConnection = options.dbConfig;
      }

      const analysisResult = await this.analysisAgent.analyze(parsedPRD);
      metrics.endPhase('analysis', analysisResult.success ? 'success' : 'partial');

      console.log(`\n✅ Phase A 완료: ${analysisResult.success ? '성공' : '부분 성공'}`);

      // ========== Phase B: Design (분석 결과 기반) ==========
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 [Phase B] Design 시작 (분석 결과 기반)...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      metrics.startPhase('design');

      // 분석 결과를 PRD에 추가하여 설계에 활용
      const enrichedPrdContent = this.enrichPRDWithAnalysis(prdContent, analysisResult);

      const planResult = await this.leader.plan(taskDescription, enrichedPrdContent);
      metrics.addTokens('leader', planResult.usage.inputTokens, planResult.usage.outputTokens);
      metrics.endPhase('design', 'success');

      // 설계 문서 저장
      if (this.saveFiles) {
        await this.savePlanningDocs(taskId, planResult);
      }

      console.log('\n✅ Phase B 완료');

      // 결과 통합
      const report = metrics.generateReport();
      await this.saveLog(taskId, report, {
        analysis: analysisResult,
        planning: planResult
      });

      console.log('\n🎉 Mixed 파이프라인 완료');

      const finalResult = {
        success: true,
        taskId,
        pipeline: 'mixed',
        prdType: 'MIXED',
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
          handoff: planResult.handoff
        },
        metrics: report
      };

      // 실행 완료 보고서 출력 (v3.3.0)
      this.printCompletionReport(finalResult);

      return finalResult;

    } catch (error) {
      console.error('\n❌ Mixed 파이프라인 에러:', error.message);
      metrics.addError('mixed', error.message);

      return {
        success: false,
        taskId,
        pipeline: 'mixed',
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
    console.log('   → Parallel 파이프라인 실행 (Design || Code 병렬)\n');

    const metrics = new MetricsTracker(taskId);

    try {
      // ========== Phase 1: Leader Planning ==========
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 [Phase 1] Leader Planning...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      metrics.startPhase('planning');

      const planResult = await this.leader.plan(taskDescription, prdContent);
      metrics.addTokens('leader', planResult.usage.inputTokens, planResult.usage.outputTokens);
      metrics.endPhase('planning', 'success');

      console.log('✅ Planning 완료');

      // HANDOFF 누락 시 자동 생성
      if (!planResult.handoff && planResult.sdd) {
        planResult.handoff = this.generateFallbackHandoff(planResult, taskDescription, prdContent);
      }

      // ========== Phase 2: 병렬 실행 (Design + Code) ==========
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🚀 [Phase 2] 병렬 실행 시작 (Design || Code)...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      metrics.startPhase('parallel_execution');

      const parallelStart = Date.now();

      // Promise.allSettled로 병렬 실행 (부분 실패 허용)
      const results = await Promise.allSettled([
        // Design Agent: 설계 문서 보완
        (async () => {
          console.log('   📝 [Design Agent] 설계 문서 보완 시작...');
          const result = await this.subagent.implementDesign(planResult.handoff, {
            documentType: 'all',
            prdAnalysis: planResult.gapCheck
          });
          console.log(`   ✅ [Design Agent] 완료 (${Object.keys(result.files).length}개 파일)`);
          return result;
        })(),

        // Code Agent: 코드 구현
        (async () => {
          console.log('   ⚙️  [Code Agent] 코드 구현 시작...');
          const result = await this.codeAgent.implement({
            sdd: planResult.sdd,
            wireframe: planResult.wireframe,
            ia: planResult.ia,
            handoff: planResult.handoff
          });
          console.log(`   ✅ [Code Agent] 완료 (${Object.keys(result.files).length}개 파일)`);
          return result;
        })()
      ]);

      // 결과 추출 (실패 시 기본값 사용)
      const designSettled = results[0];
      const codeSettled = results[1];

      const designResult = designSettled.status === 'fulfilled'
        ? designSettled.value
        : { files: {}, usage: { inputTokens: 0, outputTokens: 0 }, success: false };

      const codeResult = codeSettled.status === 'fulfilled'
        ? codeSettled.value
        : { files: {}, usage: { inputTokens: 0, outputTokens: 0 }, success: false };

      // 부분 실패 로깅
      if (designSettled.status === 'rejected') {
        console.error(`   ❌ [Design Agent] 실패: ${designSettled.reason?.message || designSettled.reason}`);
      }
      if (codeSettled.status === 'rejected') {
        console.error(`   ❌ [Code Agent] 실패: ${codeSettled.reason?.message || codeSettled.reason}`);
      }

      // 둘 다 실패한 경우 조기 종료
      if (designSettled.status === 'rejected' && codeSettled.status === 'rejected') {
        const errorMsg = `Design Agent와 Code Agent 모두 실패: Design(${designSettled.reason?.message}), Code(${codeSettled.reason?.message})`;
        console.error(`\n❌ 병렬 실행 완전 실패: ${errorMsg}`);
        metrics.endPhase('parallel_execution', 'fail');
        metrics.addError('parallel_execution', errorMsg);
        throw new Error(errorMsg);
      }

      const parallelDuration = ((Date.now() - parallelStart) / 1000).toFixed(2);
      console.log(`\n⏱️  병렬 실행 완료: ${parallelDuration}s`);

      metrics.addTokens('subagent', designResult.usage?.inputTokens || 0, designResult.usage?.outputTokens || 0);
      metrics.addTokens('codeagent', codeResult.usage?.inputTokens || 0, codeResult.usage?.outputTokens || 0);

      const parallelStatus = designSettled.status === 'fulfilled' && codeSettled.status === 'fulfilled'
        ? 'success'
        : 'partial';
      metrics.endPhase('parallel_execution', parallelStatus);

      // ========== Phase 3: 결과 병합 ==========
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔗 [Phase 3] 결과 병합...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

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

      console.log(`   - 설계 문서: ${Object.keys(designFiles).length}개`);
      console.log(`   - 코드 파일: ${Object.keys(codeResult.files).length}개`);
      console.log(`   - 총 파일: ${Object.keys(allFiles).length}개`);

      // ========== Phase 4: Output Validation ==========
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 [Phase 4] Output Validation...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const outputs = this.subagent.filesToOutputs(allFiles);
      const validationResult = this.subagent.validateOutputs(outputs, planResult.gapCheck);

      console.log(`   - 전체 통과: ${validationResult.passed ? '✅' : '❌'}`);
      console.log(`   - PRD 매칭: ${validationResult.prdMatch?.matched || 0}/${validationResult.prdMatch?.total || 0}`);

      // 파일 저장
      if (this.saveFiles) {
        const docsDir = path.join(this.projectRoot, 'docs', taskId);
        if (!fs.existsSync(docsDir)) {
          fs.mkdirSync(docsDir, { recursive: true });
        }
        for (const [fileName, content] of Object.entries(designFiles)) {
          fs.writeFileSync(path.join(docsDir, fileName), content);
        }
        await this.codeAgent.saveFiles(codeResult.files);
        console.log(`   📁 파일 저장 완료`);
      }

      // 결과 리포트
      const report = metrics.generateReport();
      await this.saveLog(taskId, report, {
        planning: planResult,
        design: designResult,
        code: codeResult,
        validation: validationResult
      });

      metrics.printReport();

      console.log('\n🎉 Parallel 파이프라인 완료');

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

    // Mode
    const prdType = gapCheck?.prdType || 'QUALITATIVE';
    const mode = prdType === 'QUANTITATIVE' ? 'Analysis' :
                 prdType === 'MIXED' ? 'Mixed (Analysis → Design)' : 'Design';
    handoff += `## Mode\n${mode}\n\n`;

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
   */
  enrichPRDWithAnalysis(originalPrd, analysisResult) {
    let enriched = originalPrd;

    // 분석 컨텍스트 섹션 추가
    enriched += `\n\n---\n## 분석 결과 컨텍스트 (자동 생성)\n\n`;

    // 쿼리 결과 요약
    if (analysisResult.summary) {
      enriched += `### 데이터 분석 요약\n`;
      enriched += `- 실행된 쿼리: ${analysisResult.summary.queriesSuccess}/${analysisResult.summary.queriesTotal}\n`;
      enriched += `- 총 데이터 행: ${analysisResult.summary.totalRows}\n\n`;
    }

    // 인사이트
    if (analysisResult.insights?.insights?.length > 0) {
      enriched += `### 발견된 인사이트\n`;
      for (const insight of analysisResult.insights.insights) {
        enriched += `- **${insight.finding}**: ${insight.implication}\n`;
      }
      enriched += `\n`;
    }

    // 패턴
    if (analysisResult.insights?.patterns?.length > 0) {
      enriched += `### 식별된 패턴\n`;
      for (const pattern of analysisResult.insights.patterns) {
        enriched += `- **${pattern.name}** (${pattern.significance}): ${pattern.description}\n`;
      }
      enriched += `\n`;
    }

    // 제안사항
    if (analysisResult.insights?.recommendations?.length > 0) {
      enriched += `### 제안사항\n`;
      for (const rec of analysisResult.insights.recommendations) {
        enriched += `- [${rec.priority}] ${rec.action} - ${rec.expectedImpact}\n`;
      }
    }

    return enriched;
  }

  /**
   * Planning 문서 저장
   */
  async savePlanningDocs(taskId, planResult) {
    // 보안: taskId 재검증 (Path Traversal 방지)
    const validatedTaskId = this.validateTaskId(taskId);
    const docsDir = this.validateFilePath(path.join('docs', validatedTaskId));

    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    if (planResult.ia) {
      fs.writeFileSync(this.validateFilePath(path.join('docs', validatedTaskId, 'IA.md')), planResult.ia);
    }
    if (planResult.wireframe) {
      fs.writeFileSync(this.validateFilePath(path.join('docs', validatedTaskId, 'Wireframe.md')), planResult.wireframe);
    }
    if (planResult.sdd) {
      fs.writeFileSync(this.validateFilePath(path.join('docs', validatedTaskId, 'SDD.md')), planResult.sdd);
    }
    if (planResult.handoff) {
      fs.writeFileSync(this.validateFilePath(path.join('docs', validatedTaskId, 'HANDOFF.md')), planResult.handoff);
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

  // ========== 실행 완료 보고 템플릿 (v3.3.0) ==========

  /**
   * 실행 완료 후 사용자 친화적 보고서 출력
   * @param {Object} result - 파이프라인 실행 결과
   */
  printCompletionReport(result) {
    const divider = '━'.repeat(60);

    console.log(`\n${divider}`);
    console.log(`📊 실행 완료 보고서`);
    console.log(divider);

    // 1. 기본 정보
    console.log(`\n🏷️  Task ID: ${result.taskId}`);
    console.log(`📌 파이프라인: ${result.pipeline || 'design'}`);
    console.log(`📅 완료 시각: ${new Date().toLocaleString('ko-KR')}`);
    console.log(`✅ 성공 여부: ${result.success ? '성공' : '실패'}`);

    // 2. 산출물 위치 안내
    console.log(`\n📁 산출물 위치`);
    console.log(`${'─'.repeat(40)}`);

    const taskId = result.taskId;
    const projectRoot = this.projectRoot;

    // 설계 문서
    if (result.planning || result.files) {
      const docsDir = path.join('docs', taskId);
      console.log(`\n📝 설계 문서:`);
      console.log(`   ${path.join(projectRoot, docsDir)}/`);

      const designFiles = ['IA.md', 'Wireframe.md', 'SDD.md', 'HANDOFF.md'];
      for (const file of designFiles) {
        const filePath = path.join(projectRoot, docsDir, file);
        if (fs.existsSync(filePath)) {
          console.log(`   ├─ ${file} ✅`);
        }
      }
    }

    // 분석 결과 (Analysis/Mixed 파이프라인)
    if (result.analysis || result.pipeline === 'analysis' || result.pipeline === 'mixed') {
      const analysisDir = path.join('src', 'analysis');
      console.log(`\n📊 분석 결과:`);
      console.log(`   ${path.join(projectRoot, analysisDir)}/`);

      if (result.analysis?.outputs || result.outputs) {
        const outputs = result.analysis?.outputs || result.outputs || [];
        outputs.forEach(output => {
          if (output.filePath) {
            console.log(`   ├─ ${path.basename(output.filePath)} ✅`);
          }
        });
      }

      // SQL 쿼리 파일
      const sqlDir = path.join(projectRoot, analysisDir, 'sql');
      if (fs.existsSync(sqlDir)) {
        const sqlFiles = fs.readdirSync(sqlDir).filter(f => f.endsWith('.sql'));
        if (sqlFiles.length > 0) {
          console.log(`   📂 SQL 쿼리: ${sqlFiles.length}개`);
        }
      }

      // 결과 데이터
      const resultsDir = path.join(projectRoot, analysisDir, 'results');
      if (fs.existsSync(resultsDir)) {
        const resultFiles = fs.readdirSync(resultsDir);
        if (resultFiles.length > 0) {
          console.log(`   📂 결과 데이터: ${resultFiles.length}개`);
        }
      }
    }

    // 코드 파일 (Design+Code 파이프라인)
    if (result.code?.files || (result.files && Object.keys(result.files).some(f => f.endsWith('.js') || f.endsWith('.ts')))) {
      const codeFiles = result.code?.files || result.files;
      const srcDir = path.join('src', 'features');
      console.log(`\n💻 구현 코드:`);
      console.log(`   ${path.join(projectRoot, srcDir)}/`);

      const jsFiles = Object.keys(codeFiles).filter(f => f.endsWith('.js') || f.endsWith('.ts'));
      jsFiles.slice(0, 5).forEach(file => {
        console.log(`   ├─ ${path.basename(file)}`);
      });
      if (jsFiles.length > 5) {
        console.log(`   └─ ... 외 ${jsFiles.length - 5}개`);
      }
    }

    // 실행 로그
    console.log(`\n📋 실행 로그:`);
    console.log(`   ${path.join(projectRoot, 'orchestrator', 'logs', `${taskId}.json`)}`);

    // 3. 실행 요약
    console.log(`\n📈 실행 요약`);
    console.log(`${'─'.repeat(40)}`);

    if (result.metrics) {
      const metrics = result.metrics;
      console.log(`   ⏱️  총 소요 시간: ${metrics.duration || 'N/A'}`);
      console.log(`   🔄 재시도 횟수: ${metrics.retryCount || 0}회`);

      if (metrics.tokens) {
        const totalTokens = (metrics.tokens.leader || 0) +
                           (metrics.tokens.subagent || 0) +
                           (metrics.tokens.codeagent || 0);
        console.log(`   🎟️  토큰 사용량: ${totalTokens.toLocaleString()}`);
      }
    }

    // 분석 요약 (Analysis 파이프라인)
    if (result.summary || result.analysis?.summary) {
      const summary = result.summary || result.analysis?.summary;
      console.log(`\n   📊 분석 요약:`);
      console.log(`      - 쿼리 성공: ${summary.queriesSuccess}/${summary.queriesTotal}`);
      console.log(`      - 총 데이터 행: ${summary.totalRows?.toLocaleString() || 0}`);
      if (summary.insightsFound > 0) {
        console.log(`      - 발견 인사이트: ${summary.insightsFound}개`);
      }
    }

    // 4. 다음 단계 안내
    console.log(`\n🔜 다음 단계`);
    console.log(`${'─'.repeat(40)}`);

    if (!result.success) {
      console.log(`   ⚠️  실패 원인 확인: orchestrator/logs/${taskId}.json`);
      console.log(`   🔧 수정 후 재실행 필요`);
    } else {
      if (result.pipeline === 'analysis') {
        console.log(`   1. 분석 결과 검토: src/analysis/analysis_report.md`);
        console.log(`   2. 인사이트 기반 액션 플랜 수립`);
        console.log(`   3. 필요시 Design 파이프라인으로 후속 작업`);
      } else if (result.pipeline === 'mixed') {
        console.log(`   1. 분석 결과 검토: src/analysis/`);
        console.log(`   2. 설계 문서 검토: docs/${taskId}/`);
        console.log(`   3. 개발팀 HANDOFF.md 전달`);
      } else {
        console.log(`   1. 설계 문서 검토: docs/${taskId}/`);
        console.log(`   2. 피드백 반영 후 개발팀 전달`);
        console.log(`   3. 구현 진행 (HANDOFF.md 참조)`);
      }
    }

    // 5. Human-in-the-Loop 안내
    console.log(`\n👤 Human-in-the-Loop 체크포인트`);
    console.log(`${'─'.repeat(40)}`);
    console.log(`   ✋ 현재 시점: 실행 완료 후 검토 단계`);
    console.log(`   📋 검토 항목:`);
    console.log(`      - PRD 요구사항 충족 여부`);
    console.log(`      - 설계 품질 및 일관성`);
    console.log(`      - 비즈니스 로직 정확성`);

    console.log(`\n${divider}\n`);
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
          } else if (pipeline === 'mixed') {
            return await this.runMixedPipeline(taskId, taskDescription, prdContent, options);
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
    const docsDir = path.join(this.projectRoot, 'docs', taskId);
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
      await this.subagent.saveFiles(codingResult.files);
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
          docsPath: `docs/${taskId}/`
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
   * HITL Pause 후 우아한 프로세스 종료
   * @param {string} taskId - 태스크 ID
   * @param {string} checkpoint - 체크포인트 유형
   * @returns {Object} - 종료 상태 반환
   */
  _gracefulExitForHITL(taskId, checkpoint) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`⏸️  HITL 체크포인트 도달: ${checkpoint}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Task ID: ${taskId}`);
    console.log(`   상태: 사용자 승인 대기 중`);
    console.log('');
    console.log('   📋 다음 단계:');
    console.log('      1. Viewer에서 산출물 검토');
    console.log('      2. 승인 또는 거부 결정');
    console.log('      3. 승인 후 동일 taskId로 재실행하여 Resume');
    console.log('');
    console.log('   🔄 Resume 명령:');
    console.log(`      node cli.js --taskId=${taskId}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 프로세스 종료 (상태는 session-store에 저장됨)
    const exitResult = {
      success: false,
      taskId,
      status: 'PAUSED_HITL',
      checkpoint,
      message: `HITL checkpoint reached: ${checkpoint}. Process exiting. Resume after approval.`,
      resumeCommand: `node cli.js --taskId=${taskId}`
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
