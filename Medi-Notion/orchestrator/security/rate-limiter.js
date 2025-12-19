/**
 * RateLimiter - 요청 빈도 제한
 *
 * 보안 기능:
 * - DoS 공격 방어
 * - 토큰 소진 방지
 * - Agent별 요청 제한
 *
 * @see DOCUMENT_MANAGER_ARCHITECTURE.md 섹션 4.1
 * @version 1.0.0
 */

import { isEnabled } from '../config/feature-flags.js';
import { getAuditLogger } from '../utils/audit-logger.js';

// 기본 제한 설정
const DEFAULT_LIMITS = {
  // 전역 제한
  GLOBAL: {
    windowMs: 60 * 1000,       // 1분
    maxRequests: 100,          // 분당 100회
  },
  // Agent별 제한
  LEADER: {
    windowMs: 60 * 1000,
    maxRequests: 50,
  },
  SUBAGENT: {
    windowMs: 60 * 1000,
    maxRequests: 200,
  },
  DOC_MANAGE: {
    windowMs: 60 * 1000,
    maxRequests: 30,           // 문서 수정은 더 제한적
  },
  // 작업별 제한
  DOCUMENT_MODIFY: {
    windowMs: 60 * 1000,
    maxRequests: 10,           // 문서 수정은 분당 10회
  },
  CHANGELOG_APPEND: {
    windowMs: 60 * 1000,
    maxRequests: 20,
  },
  NOTION_SYNC: {
    windowMs: 60 * 1000,
    maxRequests: 5,            // Notion API는 더 제한적
  },
};

export class RateLimiter {
  constructor(config = {}) {
    this.limits = { ...DEFAULT_LIMITS, ...config.limits };
    this.buckets = new Map();  // key → { count, windowStart }
    this.logger = getAuditLogger();
    this.cleanupIntervalId = null;  // setInterval 핸들 저장
  }

  /**
   * 주기적 정리 시작
   * @param {number} intervalMs - 정리 주기 (기본 5분)
   */
  startCleanup(intervalMs = 5 * 60 * 1000) {
    if (!this.cleanupIntervalId) {
      this.cleanupIntervalId = setInterval(() => this.cleanup(), intervalMs);
      // Node.js 프로세스 종료 방해 방지
      if (this.cleanupIntervalId.unref) {
        this.cleanupIntervalId.unref();
      }
    }
  }

  /**
   * 주기적 정리 중지
   */
  stopCleanup() {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
  }

  /**
   * 요청 허용 여부 확인
   * @param {string} key - 제한 키 (Agent 타입, 작업 타입 등)
   * @param {string} identifier - 식별자 (선택적, 세션 ID 등)
   * @returns {Object} - { allowed, remaining, resetAt }
   */
  checkLimit(key, identifier = 'default') {
    // 스텁 모드
    if (!isEnabled('SECURITY_RATE_LIMIT')) {
      this.logger.debug('RATE_LIMIT_STUB', `[STUB] Would check: ${key}:${identifier}`);
      return { allowed: true, remaining: Infinity, stub: true };
    }

    const limit = this.limits[key] || this.limits.GLOBAL;
    const bucketKey = `${key}:${identifier}`;
    const now = Date.now();

    // 버킷 가져오기 또는 생성
    let bucket = this.buckets.get(bucketKey);

    if (!bucket || now - bucket.windowStart >= limit.windowMs) {
      // 새 윈도우 시작
      bucket = {
        count: 0,
        windowStart: now,
      };
      this.buckets.set(bucketKey, bucket);
    }

    // 제한 확인
    const remaining = limit.maxRequests - bucket.count;
    const resetAt = bucket.windowStart + limit.windowMs;

    if (bucket.count >= limit.maxRequests) {
      this.logger.security('RATE_LIMIT_EXCEEDED', `Rate limit exceeded for ${key}`, {
        key,
        identifier,
        count: bucket.count,
        limit: limit.maxRequests,
        resetAt: new Date(resetAt).toISOString(),
      });

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter: resetAt - now,
      };
    }

    // 카운트 증가
    bucket.count++;

    return {
      allowed: true,
      remaining: remaining - 1,
      resetAt,
    };
  }

  /**
   * 요청 실행 (제한 확인 + 카운트 증가)
   * @param {string} key - 제한 키
   * @param {string} identifier - 식별자
   * @param {Function} fn - 실행할 함수
   * @returns {Promise} - 함수 결과 또는 제한 에러
   */
  async execute(key, identifier, fn) {
    const check = this.checkLimit(key, identifier);

    if (!check.allowed) {
      const error = new Error(`Rate limit exceeded for ${key}`);
      error.code = 'RATE_LIMIT_EXCEEDED';
      error.retryAfter = check.retryAfter;
      throw error;
    }

    return await fn();
  }

  /**
   * 현재 상태 조회
   * @param {string} key - 제한 키
   * @param {string} identifier - 식별자
   * @returns {Object} - 현재 상태
   */
  getStatus(key, identifier = 'default') {
    const limit = this.limits[key] || this.limits.GLOBAL;
    const bucketKey = `${key}:${identifier}`;
    const bucket = this.buckets.get(bucketKey);
    const now = Date.now();

    if (!bucket || now - bucket.windowStart >= limit.windowMs) {
      return {
        count: 0,
        limit: limit.maxRequests,
        remaining: limit.maxRequests,
        windowMs: limit.windowMs,
        resetAt: now + limit.windowMs,
      };
    }

    return {
      count: bucket.count,
      limit: limit.maxRequests,
      remaining: limit.maxRequests - bucket.count,
      windowMs: limit.windowMs,
      resetAt: bucket.windowStart + limit.windowMs,
    };
  }

  /**
   * 버킷 초기화 (테스트용)
   */
  reset(key = null, identifier = null) {
    if (key && identifier) {
      this.buckets.delete(`${key}:${identifier}`);
    } else if (key) {
      for (const k of this.buckets.keys()) {
        if (k.startsWith(`${key}:`)) {
          this.buckets.delete(k);
        }
      }
    } else {
      this.buckets.clear();
    }
  }

  /**
   * 만료된 버킷 정리
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, bucket] of this.buckets.entries()) {
      const limitKey = key.split(':')[0];
      const limit = this.limits[limitKey] || this.limits.GLOBAL;

      if (now - bucket.windowStart >= limit.windowMs * 2) {
        // 윈도우의 2배 시간이 지나면 삭제
        this.buckets.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug('RATE_LIMIT_CLEANUP', `Cleaned ${cleaned} expired buckets`);
    }

    return cleaned;
  }
}

// 싱글톤 인스턴스
let instance = null;

export function getRateLimiter(config = {}) {
  if (!instance) {
    instance = new RateLimiter(config);
    // 주기적 정리 시작 (5분마다, unref로 프로세스 종료 방해 방지)
    instance.startCleanup();
  }
  return instance;
}

/**
 * 싱글톤 인스턴스 정리 (테스트 등에서 사용)
 */
export function destroyRateLimiter() {
  if (instance) {
    instance.stopCleanup();
    instance = null;
  }
}

export { DEFAULT_LIMITS };
export default RateLimiter;
