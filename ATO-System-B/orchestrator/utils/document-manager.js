/**
 * DocumentManager - 문서 관리 핵심 모듈
 *
 * 기능:
 * - 문서 등급 분류 (절대불변/수정가능/피쳐)
 * - 원자적 파일 잠금 (TOCTOU 방어)
 * - CHANGELOG 관리 (Append-only Chain)
 * - Notion 동기화 인터페이스
 *
 * @version 1.0.0
 * @see DOCUMENT_MANAGER_ARCHITECTURE.md
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getAuditLogger } from './audit-logger.js';
import { isEnabled } from '../config/feature-flags.js';

// 문서 등급 정의 (Constitution 체계 v4.0.0)
const DOC_GRADES = {
  IMMUTABLE: 'IMMUTABLE',     // 🔴 절대불변 (.claude/rules/*, .claude/workflows/*, .claude/context/*)
  MUTABLE: 'MUTABLE',         // 🟢 수정가능 (.claude/project/*)
  FEATURE: 'FEATURE',         // 🔵 피쳐 (workspace/features/*)
  UNKNOWN: 'UNKNOWN',         // 분류 불가
};

// 경로 패턴 (Constitution 체계 v4.0.0)
const PATH_PATTERNS = {
  IMMUTABLE: /^\.claude\/(rules|workflows|context)\//,
  MUTABLE: /^\.claude\/project\//,
  FEATURE: /^workspace\/features\//,
};

// CHANGELOG 결과 타입
const CHANGE_RESULTS = {
  SUCCESS: 'SUCCESS',
  REJECTED: 'REJECTED',
  BLOCKED: 'BLOCKED',
  CREATED: 'CREATED',
};

/**
 * DocumentManager 클래스
 */
export class DocumentManager {
  constructor(config = {}) {
    this.projectRoot = config.projectRoot || process.cwd();
    this.changelogPath = config.changelogPath || '.claude/CHANGELOG.md';
    this.lockDir = config.lockDir || '.claude/.locks';
    this.logger = getAuditLogger();

    // 잠금 디렉토리 생성
    this._ensureDir(path.join(this.projectRoot, this.lockDir));
  }

  // ========== 문서 등급 분류 ==========

  /**
   * 파일 경로로 문서 등급 분류
   * @param {string} filePath - 상대 경로
   * @returns {string} - DOC_GRADES 값
   */
  classifyDocument(filePath) {
    // 경로 정규화
    const normalized = filePath.replace(/\\/g, '/').replace(/^\//, '');

    if (PATH_PATTERNS.IMMUTABLE.test(normalized)) {
      return DOC_GRADES.IMMUTABLE;
    }
    if (PATH_PATTERNS.MUTABLE.test(normalized)) {
      return DOC_GRADES.MUTABLE;
    }
    if (PATH_PATTERNS.FEATURE.test(normalized)) {
      return DOC_GRADES.FEATURE;
    }

    return DOC_GRADES.UNKNOWN;
  }

  /**
   * 절대불변 문서 여부 확인
   */
  isImmutable(filePath) {
    return this.classifyDocument(filePath) === DOC_GRADES.IMMUTABLE;
  }

  // ========== 원자적 파일 잠금 ==========

  /**
   * 파일 잠금 획득 (비동기, 이벤트 기반)
   * @param {string} filePath - 잠글 파일 경로
   * @param {number} timeout - 타임아웃 (ms)
   * @returns {Promise<Object>} - { success, lockId, error }
   */
  async acquireLock(filePath, timeout = 5000) {
    const lockId = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const lockFile = this._getLockFilePath(filePath);
    const startTime = Date.now();
    const retryInterval = 100; // ms
    const maxRetries = Math.ceil(timeout / retryInterval) + 1; // 무한루프 방지
    let retryCount = 0;

    while (retryCount < maxRetries && Date.now() - startTime < timeout) {
      retryCount++;
      try {
        // 배타적 잠금 시도
        fs.writeFileSync(lockFile, JSON.stringify({
          lockId,
          filePath,
          acquiredAt: new Date().toISOString(),
          pid: process.pid,
          expiresAt: new Date(Date.now() + 30000).toISOString(), // 30초 후 만료
        }), { flag: 'wx' }); // wx: 배타적 생성

        this.logger.info('LOCK_ACQUIRED', `Lock acquired for ${filePath}`, { lockId });

        return { success: true, lockId };
      } catch (err) {
        if (err.code === 'EEXIST') {
          // 만료된 잠금인지 확인
          const expired = this._checkLockExpired(lockFile);
          if (expired) {
            this.logger.warn('LOCK_EXPIRED_CLEANUP', `Cleaning up expired lock for ${filePath}`);
            try {
              fs.unlinkSync(lockFile);
            } catch { /* ignore */ }
            continue;
          }

          // 이미 잠금 존재 - 대기 후 재시도 (이벤트 기반)
          await this._sleep(retryInterval);
          continue;
        }
        throw err;
      }
    }

    this.logger.warn('LOCK_TIMEOUT', `Failed to acquire lock for ${filePath}`, { timeout });
    return { success: false, error: 'LOCK_TIMEOUT' };
  }

  /**
   * 파일 잠금 획득 (동기식, 레거시 호환)
   */
  acquireLockSync(filePath, timeout = 5000) {
    const lockId = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const lockFile = this._getLockFilePath(filePath);
    const startTime = Date.now();
    const retryInterval = 100; // ms
    const maxRetries = Math.ceil(timeout / retryInterval) + 1; // 무한루프 방지
    let retryCount = 0;

    while (retryCount < maxRetries && Date.now() - startTime < timeout) {
      retryCount++;
      try {
        fs.writeFileSync(lockFile, JSON.stringify({
          lockId,
          filePath,
          acquiredAt: new Date().toISOString(),
          pid: process.pid,
        }), { flag: 'wx' });

        this.logger.info('LOCK_ACQUIRED', `Lock acquired for ${filePath}`, { lockId });
        return { success: true, lockId };
      } catch (err) {
        if (err.code === 'EEXIST') {
          this._sleepSync(100);
          continue;
        }
        throw err;
      }
    }

    this.logger.warn('LOCK_TIMEOUT', `Failed to acquire lock for ${filePath}`, { timeout });
    return { success: false, error: 'LOCK_TIMEOUT' };
  }

  /**
   * 잠금 만료 확인
   */
  _checkLockExpired(lockFile) {
    try {
      const content = fs.readFileSync(lockFile, 'utf-8');
      const data = JSON.parse(content);
      if (data.expiresAt) {
        return new Date(data.expiresAt) < new Date();
      }
      // expiresAt이 없으면 30초 기준으로 확인
      if (data.acquiredAt) {
        const acquired = new Date(data.acquiredAt);
        return Date.now() - acquired.getTime() > 30000;
      }
    } catch {
      return false;
    }
    return false;
  }

  /**
   * 파일 잠금 해제
   * @param {string} filePath - 잠금 해제할 파일 경로
   * @param {string} lockId - 잠금 ID
   */
  releaseLock(filePath, lockId) {
    const lockFile = this._getLockFilePath(filePath);

    try {
      if (fs.existsSync(lockFile)) {
        const lockData = JSON.parse(fs.readFileSync(lockFile, 'utf-8'));

        // 잠금 ID 확인
        if (lockData.lockId !== lockId) {
          this.logger.warn('LOCK_MISMATCH', 'Lock ID mismatch on release', {
            expected: lockId,
            actual: lockData.lockId,
          });
          return { success: false, error: 'LOCK_MISMATCH' };
        }

        fs.unlinkSync(lockFile);
        this.logger.info('LOCK_RELEASED', `Lock released for ${filePath}`, { lockId });
        return { success: true };
      }
    } catch (err) {
      this.logger.error('LOCK_RELEASE_ERROR', `Failed to release lock for ${filePath}`, { error: err.message });
      return { success: false, error: err.message };
    }

    return { success: true };
  }

  /**
   * 강제 잠금 해제 (긴급 시)
   */
  forceReleaseLock(filePath) {
    const lockFile = this._getLockFilePath(filePath);

    try {
      if (fs.existsSync(lockFile)) {
        const lockData = JSON.parse(fs.readFileSync(lockFile, 'utf-8'));
        fs.unlinkSync(lockFile);
        this.logger.security('FORCE_LOCK_RELEASE', `Force released lock for ${filePath}`, lockData);
        return { success: true, previousLock: lockData };
      }
    } catch (err) {
      this.logger.error('FORCE_LOCK_ERROR', `Failed to force release lock`, { error: err.message });
      return { success: false, error: err.message };
    }

    return { success: true, previousLock: null };
  }

  // ========== CHANGELOG 관리 ==========

  /**
   * CHANGELOG 엔트리 추가
   * @param {Object} entry - 변경 항목
   */
  appendChangelog(entry) {
    const changelogFullPath = path.join(this.projectRoot, this.changelogPath);
    this._ensureDir(path.dirname(changelogFullPath));

    // CHANGELOG 입력 검증 (피쳐 플래그)
    if (isEnabled('INTEGRITY_CHANGELOG_VALIDATE')) {
      const validation = this._validateChangelogEntry(entry);
      if (!validation.valid) {
        this.logger.security('CHANGELOG_VALIDATION_FAIL', 'Changelog entry validation failed', {
          violations: validation.violations,
        });
        throw new Error(`CHANGELOG validation failed: ${validation.violations.map(v => v.message).join(', ')}`);
      }
    }

    // 이전 다이제스트 읽기
    let previousDigest = 'GENESIS';
    let entries = [];

    if (fs.existsSync(changelogFullPath)) {
      const content = fs.readFileSync(changelogFullPath, 'utf-8');
      const parsed = this._parseChangelog(content);
      entries = parsed.entries;
      if (entries.length > 0) {
        previousDigest = entries[entries.length - 1].currentDigest;
      }
    }

    // 새 엔트리 생성
    const newEntry = {
      id: `CHG-${this._formatDate()}-${String(entries.length + 1).padStart(3, '0')}`,
      timestamp: new Date().toISOString(),
      previousDigest,
      entry: {
        '0_변경내용': entry.content || '',
        '1_배경': entry.background || '',
        '2_목적': entry.purpose || '',
        '3_목표': entry.goal || '',
        '4_최종산출물': entry.output || '',
      },
      result: entry.result || CHANGE_RESULTS.SUCCESS,
      filePath: entry.filePath,
      grade: entry.grade,
    };

    // 현재 다이제스트 계산 (previousDigest + entry 내용)
    newEntry.currentDigest = this._calculateDigest(previousDigest + JSON.stringify(newEntry.entry));

    // Notion 동기화 정보 (있는 경우)
    if (entry.notionSync) {
      newEntry.notionSync = entry.notionSync;
    }

    // CHANGELOG 업데이트
    entries.push(newEntry);
    this._writeChangelog(changelogFullPath, entries);

    this.logger.info('CHANGELOG_APPEND', `Appended changelog entry: ${newEntry.id}`, {
      id: newEntry.id,
      result: newEntry.result,
      filePath: newEntry.filePath,
    });

    return newEntry;
  }

  /**
   * CHANGELOG 체인 무결성 검증
   */
  verifyChangelogIntegrity() {
    const changelogFullPath = path.join(this.projectRoot, this.changelogPath);

    if (!fs.existsSync(changelogFullPath)) {
      return { valid: true, message: 'No changelog exists' };
    }

    const content = fs.readFileSync(changelogFullPath, 'utf-8');
    const { entries } = this._parseChangelog(content);

    if (entries.length === 0) {
      return { valid: true, message: 'Empty changelog' };
    }

    const violations = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      // 첫 엔트리는 GENESIS
      if (i === 0) {
        if (entry.previousDigest !== 'GENESIS') {
          violations.push({
            index: i,
            id: entry.id,
            type: 'INVALID_GENESIS',
            message: 'First entry should have previousDigest = GENESIS',
          });
        }
        continue;
      }

      // 이전 엔트리의 currentDigest와 현재의 previousDigest 비교
      const prevEntry = entries[i - 1];
      if (entry.previousDigest !== prevEntry.currentDigest) {
        violations.push({
          index: i,
          id: entry.id,
          type: 'CHAIN_BREAK',
          message: `Chain broken at entry ${i}`,
          expected: prevEntry.currentDigest,
          actual: entry.previousDigest,
        });
      }
    }

    const valid = violations.length === 0;

    if (!valid) {
      this.logger.security('CHANGELOG_INTEGRITY_VIOLATION', 'Changelog chain integrity violated', { violations });
    }

    return { valid, violations, entriesCount: entries.length };
  }

  // ========== 문서 수정 워크플로우 ==========

  /**
   * 문서 수정 요청 처리
   * @param {Object} request - 수정 요청
   * @returns {Object} - 처리 결과
   */
  async processModificationRequest(request) {
    const { filePath, content, changeInfo, approvalCallback } = request;
    const grade = this.classifyDocument(filePath);
    const fullPath = path.join(this.projectRoot, filePath);

    this.logger.info('DOC_MODIFY_REQUEST', `Processing modification for ${filePath}`, { grade });

    // 등급별 처리
    switch (grade) {
      case DOC_GRADES.IMMUTABLE:
        return this._processImmutableModification(fullPath, filePath, content, changeInfo, approvalCallback);

      case DOC_GRADES.MUTABLE:
        return this._processMutableModification(fullPath, filePath, content, changeInfo);

      case DOC_GRADES.FEATURE:
        return this._processFeatureCreation(fullPath, filePath, content, changeInfo);

      default:
        this.logger.warn('DOC_UNKNOWN_GRADE', `Unknown document grade for ${filePath}`);
        return { success: false, error: 'UNKNOWN_GRADE', grade };
    }
  }

  /**
   * 절대불변 문서 수정 (사용자 승인 필요)
   */
  async _processImmutableModification(fullPath, filePath, content, changeInfo, approvalCallback) {
    // 변경 제안서 생성
    const proposal = {
      filePath,
      grade: DOC_GRADES.IMMUTABLE,
      currentContent: fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf-8') : null,
      proposedContent: content,
      changeInfo,
      proposedAt: new Date().toISOString(),
    };

    this.logger.info('IMMUTABLE_PROPOSAL', `Created modification proposal for ${filePath}`);

    // 승인 대기 (콜백 또는 기본 거부)
    let approved = false;
    let rejectionReason = 'No approval callback provided';

    if (typeof approvalCallback === 'function') {
      try {
        const result = await approvalCallback(proposal);
        approved = result.approved === true;
        rejectionReason = result.reason || 'User rejected';
      } catch (err) {
        rejectionReason = `Approval error: ${err.message}`;
      }
    }

    if (!approved) {
      // 거부됨 - CHANGELOG에 기록
      this.appendChangelog({
        ...changeInfo,
        filePath,
        grade: DOC_GRADES.IMMUTABLE,
        result: CHANGE_RESULTS.REJECTED,
        output: `거부됨: ${rejectionReason}`,
      });

      this.logger.info('IMMUTABLE_REJECTED', `Modification rejected for ${filePath}`, { reason: rejectionReason });
      return { success: false, result: CHANGE_RESULTS.REJECTED, reason: rejectionReason };
    }

    // 승인됨 - 잠금 획득 후 수정
    const lock = this.acquireLock(filePath);
    if (!lock.success) {
      return { success: false, error: lock.error };
    }

    try {
      // 파일 수정
      this._ensureDir(path.dirname(fullPath));
      fs.writeFileSync(fullPath, content, 'utf-8');

      // CHANGELOG 기록
      this.appendChangelog({
        ...changeInfo,
        filePath,
        grade: DOC_GRADES.IMMUTABLE,
        result: CHANGE_RESULTS.SUCCESS,
      });

      this.logger.info('IMMUTABLE_MODIFIED', `Successfully modified ${filePath}`);
      return { success: true, result: CHANGE_RESULTS.SUCCESS };
    } finally {
      this.releaseLock(filePath, lock.lockId);
    }
  }

  /**
   * 수정가능 문서 수정 (헌법 검증)
   */
  async _processMutableModification(fullPath, filePath, content, changeInfo) {
    // 헌법(CLAUDE.md) 위반 검증
    const constitutionCheck = this._checkConstitutionViolation(content);

    if (!constitutionCheck.valid) {
      // 위반됨 - 차단
      this.appendChangelog({
        ...changeInfo,
        filePath,
        grade: DOC_GRADES.MUTABLE,
        result: CHANGE_RESULTS.BLOCKED,
        output: `차단됨: ${constitutionCheck.violations.join(', ')}`,
      });

      this.logger.warn('MUTABLE_BLOCKED', `Modification blocked for ${filePath}`, {
        violations: constitutionCheck.violations,
      });
      return { success: false, result: CHANGE_RESULTS.BLOCKED, violations: constitutionCheck.violations };
    }

    // 통과 - 수정 실행
    const lock = this.acquireLock(filePath);
    if (!lock.success) {
      return { success: false, error: lock.error };
    }

    try {
      this._ensureDir(path.dirname(fullPath));
      fs.writeFileSync(fullPath, content, 'utf-8');

      this.appendChangelog({
        ...changeInfo,
        filePath,
        grade: DOC_GRADES.MUTABLE,
        result: CHANGE_RESULTS.SUCCESS,
      });

      this.logger.info('MUTABLE_MODIFIED', `Successfully modified ${filePath}`);
      return { success: true, result: CHANGE_RESULTS.SUCCESS };
    } finally {
      this.releaseLock(filePath, lock.lockId);
    }
  }

  /**
   * 피쳐 문서 생성
   */
  async _processFeatureCreation(fullPath, filePath, content, changeInfo) {
    this._ensureDir(path.dirname(fullPath));
    fs.writeFileSync(fullPath, content, 'utf-8');

    this.appendChangelog({
      ...changeInfo,
      filePath,
      grade: DOC_GRADES.FEATURE,
      result: CHANGE_RESULTS.CREATED,
    });

    this.logger.info('FEATURE_CREATED', `Created feature document ${filePath}`);
    return { success: true, result: CHANGE_RESULTS.CREATED };
  }

  /**
   * 헌법 위반 검사 (기본 구현)
   */
  _checkConstitutionViolation(content) {
    const violations = [];

    // 금지 패턴 검사
    const forbiddenPatterns = [
      { pattern: /INSERT\s+INTO/gi, message: 'INSERT 쿼리 금지' },
      { pattern: /UPDATE\s+\w+\s+SET/gi, message: 'UPDATE 쿼리 금지' },
      { pattern: /DELETE\s+FROM/gi, message: 'DELETE 쿼리 금지' },
      { pattern: /DROP\s+TABLE/gi, message: 'DROP 쿼리 금지' },
      { pattern: /sk-ant-[a-zA-Z0-9-]+/g, message: 'API 키 노출' },
    ];

    for (const { pattern, message } of forbiddenPatterns) {
      if (pattern.test(content)) {
        violations.push(message);
      }
    }

    return { valid: violations.length === 0, violations };
  }

  // ========== 헬퍼 메서드 ==========

  _ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  _getLockFilePath(filePath) {
    const hash = crypto.createHash('md5').update(filePath).digest('hex').substring(0, 8);
    const safeName = path.basename(filePath).replace(/[^a-zA-Z0-9.-]/g, '_');
    return path.join(this.projectRoot, this.lockDir, `${safeName}-${hash}.lock`);
  }

  _sleep(ms) {
    // 이벤트 기반 sleep (busy-wait 개선)
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 동기식 sleep (레거시 호환)
   */
  _sleepSync(ms) {
    const end = Date.now() + ms;
    while (Date.now() < end) { /* busy wait - 레거시 */ }
  }

  _formatDate() {
    return new Date().toISOString().split('T')[0].replace(/-/g, '');
  }

  _calculateDigest(content) {
    return 'sha256:' + crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  _parseChangelog(content) {
    // CHANGELOG.md에서 JSON 블록 추출
    const entries = [];
    const jsonBlocks = content.match(/```json\n([\s\S]*?)\n```/g) || [];

    for (const block of jsonBlocks) {
      try {
        const json = block.replace(/```json\n/, '').replace(/\n```/, '');
        entries.push(JSON.parse(json));
      } catch (e) {
        // 파싱 실패 시 무시
      }
    }

    return { entries };
  }

  _writeChangelog(filePath, entries) {
    let content = `# CHANGELOG\n\n> Append-only Chain - 변경 이력\n> 자동 생성됨\n\n---\n\n`;

    for (const entry of entries) {
      content += `## ${entry.id}\n\n`;
      content += `- **Timestamp**: ${entry.timestamp}\n`;
      content += `- **File**: ${entry.filePath}\n`;
      content += `- **Grade**: ${entry.grade}\n`;
      content += `- **Result**: ${entry.result}\n`;
      content += `- **Previous Digest**: \`${entry.previousDigest}\`\n`;
      content += `- **Current Digest**: \`${entry.currentDigest}\`\n\n`;
      content += `\`\`\`json\n${JSON.stringify(entry, null, 2)}\n\`\`\`\n\n---\n\n`;
    }

    fs.writeFileSync(filePath, content, 'utf-8');
  }

  /**
   * CHANGELOG 엔트리 입력 검증
   */
  _validateChangelogEntry(entry) {
    const violations = [];

    // 필수 필드 검증
    const requiredFields = ['content', 'filePath'];
    for (const field of requiredFields) {
      if (!entry[field]) {
        violations.push({
          field,
          type: 'MISSING_REQUIRED',
          message: `Missing required field: ${field}`,
        });
      }
    }

    // 문자열 필드 검증
    const stringFields = ['content', 'background', 'purpose', 'goal', 'output'];
    for (const field of stringFields) {
      if (entry[field] && typeof entry[field] !== 'string') {
        violations.push({
          field,
          type: 'INVALID_TYPE',
          message: `Field ${field} must be a string`,
        });
      }
    }

    // 위험 패턴 검사
    const dangerousPatterns = [
      { pattern: /sk-ant-[a-zA-Z0-9-]+/g, message: 'API key detected' },
      { pattern: /password\s*[:=]\s*["'][^"']+["']/gi, message: 'Password detected' },
      { pattern: /<script/gi, message: 'Script tag detected' },
      { pattern: /javascript:/gi, message: 'JavaScript URI detected' },
    ];

    const allText = Object.values(entry)
      .filter(v => typeof v === 'string')
      .join(' ');

    for (const { pattern, message } of dangerousPatterns) {
      if (pattern.test(allText)) {
        violations.push({
          type: 'DANGEROUS_CONTENT',
          message,
        });
      }
    }

    // 길이 제한
    const maxLength = 10000;
    if (allText.length > maxLength) {
      violations.push({
        type: 'LENGTH_EXCEEDED',
        message: `Total content exceeds ${maxLength} characters`,
        actual: allText.length,
      });
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }
}

// 싱글톤 인스턴스
let instance = null;

export function getDocumentManager(config = {}) {
  if (!instance) {
    instance = new DocumentManager(config);
  }
  return instance;
}

export { DOC_GRADES, PATH_PATTERNS, CHANGE_RESULTS };
export default DocumentManager;
