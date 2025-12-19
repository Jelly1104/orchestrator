/**
 * NotionSync - Notion 연동 보안 래퍼
 *
 * 보안 기능 (Phase E):
 * - HMAC 서명 검증
 * - 요청 유효성 검사
 * - Rate Limiting
 * - 감사 로깅
 *
 * @see DOCUMENT_MANAGER_ARCHITECTURE.md 섹션 4.4
 * @version 1.0.0
 */

import crypto from 'crypto';
import { isEnabled } from '../config/feature-flags.js';
import { getAuditLogger } from './audit-logger.js';
import { getEnvProtector } from './env-protector.js';
import { getRateLimiter } from '../security/rate-limiter.js';
import { getSecurityMonitor, EVENT_TYPES } from '../security/security-monitor.js';

// Notion 관련 상수
const NOTION_CONFIG = {
  API_VERSION: '2022-06-28',
  BASE_URL: 'https://api.notion.com/v1',
  TIMEOUT: 30000, // 30초
  MAX_RETRIES: 3,
};

// 허용된 Notion API 엔드포인트
const ALLOWED_ENDPOINTS = [
  '/pages',
  '/databases',
  '/blocks',
  '/users',
  '/search',
];

export class NotionSync {
  constructor(config = {}) {
    this.logger = getAuditLogger();
    this.envProtector = getEnvProtector();
    this.rateLimiter = getRateLimiter();
    this.securityMonitor = getSecurityMonitor();

    this.apiKey = config.apiKey || this.envProtector.getEnv('NOTION_API_KEY');
    this.hmacSecret = config.hmacSecret || this.envProtector.getEnv('NOTION_HMAC_SECRET');

    // Rate Limit 설정
    this.maxRequestsPerMinute = config.maxRequestsPerMinute || 30;
    this.requestCount = 0;
    this.lastReset = Date.now();
  }

  /**
   * HMAC 서명 생성
   * @param {string} payload - 페이로드
   * @param {string} timestamp - 타임스탬프
   * @returns {string} - HMAC 서명
   */
  generateSignature(payload, timestamp) {
    const message = `${timestamp}.${payload}`;
    return crypto
      .createHmac('sha256', this.hmacSecret)
      .update(message)
      .digest('hex');
  }

  /**
   * HMAC 서명 검증
   * @param {string} payload - 페이로드
   * @param {string} signature - 받은 서명
   * @param {string} timestamp - 타임스탬프
   * @returns {boolean} - 검증 결과
   */
  verifySignature(payload, signature, timestamp) {
    // 스텁 모드
    if (!isEnabled('NOTION_HMAC_VERIFY')) {
      this.logger.debug('NOTION_HMAC_STUB', '[STUB] Would verify HMAC signature');
      return true;
    }

    if (!this.hmacSecret) {
      this.logger.warn('NOTION_HMAC_MISSING', 'HMAC secret not configured');
      return false;
    }

    // 타임스탬프 검증 (5분 이내)
    const now = Date.now();
    const requestTime = parseInt(timestamp, 10);
    if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
      this.logger.security('NOTION_TIMESTAMP_INVALID', 'Request timestamp too old', {
        requestTime,
        now,
        diff: now - requestTime,
      });
      return false;
    }

    const expected = this.generateSignature(payload, timestamp);
    const valid = crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature)
    );

    if (!valid) {
      this.securityMonitor.report(EVENT_TYPES.AGENT_PERMISSION_DENIED, {
        type: 'NOTION_HMAC_MISMATCH',
        timestamp,
      });
    }

    return valid;
  }

  /**
   * 엔드포인트 검증
   * @param {string} endpoint - API 엔드포인트
   * @returns {boolean}
   */
  validateEndpoint(endpoint) {
    const normalized = endpoint.split('?')[0]; // 쿼리스트링 제거

    return ALLOWED_ENDPOINTS.some(allowed =>
      normalized.startsWith(allowed) || normalized === allowed
    );
  }

  /**
   * Rate Limit 체크
   * @returns {Object} - { allowed: boolean, retryAfter?: number }
   */
  checkRateLimit() {
    // Security Layer 활성화 시 공용 RateLimiter 사용
    if (isEnabled('SECURITY_RATE_LIMIT')) {
      return this.rateLimiter.checkLimit('notion', 'api_call');
    }

    // 레거시 방식
    const now = Date.now();
    const oneMinute = 60 * 1000;

    if (now - this.lastReset > oneMinute) {
      this.requestCount = 0;
      this.lastReset = now;
    }

    if (this.requestCount >= this.maxRequestsPerMinute) {
      return {
        allowed: false,
        retryAfter: oneMinute - (now - this.lastReset),
      };
    }

    this.requestCount++;
    return { allowed: true };
  }

  /**
   * 안전한 Notion API 호출
   * @param {string} endpoint - API 엔드포인트
   * @param {Object} options - fetch 옵션
   * @returns {Promise<Object>} - API 응답
   */
  async safeRequest(endpoint, options = {}) {
    // 스텁 모드
    if (!isEnabled('NOTION_SYNC_ENABLED')) {
      this.logger.debug('NOTION_SYNC_STUB', `[STUB] Would call Notion API: ${endpoint}`);
      return { stub: true, endpoint };
    }

    // API 키 확인
    if (!this.apiKey) {
      throw new Error('[NotionSync] API key not configured');
    }

    // 엔드포인트 검증
    if (!this.validateEndpoint(endpoint)) {
      this.securityMonitor.report(EVENT_TYPES.PATH_VALIDATION_FAIL, {
        type: 'NOTION_ENDPOINT_BLOCKED',
        endpoint,
      });
      throw new Error(`[NotionSync] Endpoint not allowed: ${endpoint}`);
    }

    // Rate Limit 체크
    const rateLimitResult = this.checkRateLimit();
    if (!rateLimitResult.allowed) {
      this.securityMonitor.report(EVENT_TYPES.RATE_LIMIT_EXCEEDED, {
        type: 'NOTION_RATE_LIMIT',
        retryAfter: rateLimitResult.retryAfter,
      });
      throw new Error(`[NotionSync] Rate limit exceeded. Retry after ${rateLimitResult.retryAfter}ms`);
    }

    // 요청 준비
    const url = `${NOTION_CONFIG.BASE_URL}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Notion-Version': NOTION_CONFIG.API_VERSION,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // 감사 로그
    this.logger.info('NOTION_API_CALL', `Calling Notion API: ${endpoint}`, {
      endpoint,
      method: options.method || 'GET',
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        timeout: NOTION_CONFIG.TIMEOUT,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error('NOTION_API_ERROR', `Notion API error: ${response.status}`, {
          status: response.status,
          body: errorBody.substring(0, 500),
        });
        throw new Error(`Notion API error: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      this.logger.error('NOTION_REQUEST_FAIL', `Notion request failed: ${error.message}`, {
        endpoint,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 페이지 조회
   * @param {string} pageId - 페이지 ID
   * @returns {Promise<Object>}
   */
  async getPage(pageId) {
    // pageId 검증 (UUID 형식)
    if (!/^[a-f0-9-]{32,36}$/i.test(pageId)) {
      throw new Error('[NotionSync] Invalid page ID format');
    }

    return this.safeRequest(`/pages/${pageId}`);
  }

  /**
   * 데이터베이스 쿼리
   * @param {string} databaseId - 데이터베이스 ID
   * @param {Object} query - 쿼리 옵션
   * @returns {Promise<Object>}
   */
  async queryDatabase(databaseId, query = {}) {
    // databaseId 검증
    if (!/^[a-f0-9-]{32,36}$/i.test(databaseId)) {
      throw new Error('[NotionSync] Invalid database ID format');
    }

    return this.safeRequest(`/databases/${databaseId}/query`, {
      method: 'POST',
      body: JSON.stringify(query),
    });
  }

  /**
   * 페이지 생성
   * @param {Object} properties - 페이지 속성
   * @param {Object} parent - 부모 (database_id 또는 page_id)
   * @returns {Promise<Object>}
   */
  async createPage(properties, parent) {
    return this.safeRequest('/pages', {
      method: 'POST',
      body: JSON.stringify({
        parent,
        properties,
      }),
    });
  }

  /**
   * 페이지 업데이트
   * @param {string} pageId - 페이지 ID
   * @param {Object} properties - 업데이트할 속성
   * @returns {Promise<Object>}
   */
  async updatePage(pageId, properties) {
    // pageId 검증
    if (!/^[a-f0-9-]{32,36}$/i.test(pageId)) {
      throw new Error('[NotionSync] Invalid page ID format');
    }

    return this.safeRequest(`/pages/${pageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ properties }),
    });
  }

  /**
   * 연결 상태 확인
   * @returns {Promise<Object>}
   */
  async healthCheck() {
    if (!isEnabled('NOTION_SYNC_ENABLED')) {
      return { status: 'stub', message: 'Notion sync is disabled' };
    }

    try {
      await this.safeRequest('/users/me');
      return { status: 'ok', message: 'Notion connection successful' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
}

// 싱글톤 인스턴스
let instance = null;

export function getNotionSync(config = {}) {
  if (!instance) {
    instance = new NotionSync(config);
  }
  return instance;
}

export { NOTION_CONFIG, ALLOWED_ENDPOINTS };
export default NotionSync;
