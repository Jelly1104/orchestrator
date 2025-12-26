/**
 * SQL Validator - SELECT * 및 민감 컬럼 검증 게이트
 *
 * P0-3: executeQueries() 실행 전 SQL 검증
 * - SELECT * 패턴 검출 및 차단 (ERROR)
 * - 민감 컬럼 조회 차단 (CRITICAL)
 * - LIMIT 없는 대용량 테이블 접근 경고
 *
 * @see DB_ACCESS_POLICY.md 섹션 4.0 (민감 컬럼 블랙리스트)
 * @see VALIDATION_GUIDE.md
 * @version 1.0.0
 * @since 2025-12-26
 */

// 민감 컬럼 블랙리스트 (DB_ACCESS_POLICY.md 동기화)
export const SENSITIVE_COLUMNS = [
  // 인증 정보 (Extreme)
  'U_PASSWD', 'U_PASSWD_ENC',

  // 개인 식별 정보 (Extreme/High)
  'U_SID', 'U_SID_ENC', 'U_JUMIN',
  'U_EMAIL', 'U_NAME',

  // 연락처 정보 (High)
  'U_TEL', 'U_PHONE', 'U_MOBILE',

  // 금융 정보 (Extreme)
  'U_CARD_NO', 'U_ACCOUNT_NO',

  // 위치/IP 정보 (Medium)
  'U_IP', 'LOGIN_IP',

  // 면허 정보 (High)
  'U_LICENSE_NO'
];

// 대용량 테이블 (LIMIT 필수)
export const LARGE_TABLES = {
  'USER_LOGIN': { rows: 22670000, limit: 1000 },
  'COMMENT': { rows: 18260000, limit: 1000 },
  'BOARD_MUZZIMA': { rows: 3370000, limit: 1000 }
};

// 위반 심각도
export const SEVERITY = {
  CRITICAL: 'CRITICAL',  // 즉시 차단, 재시도 불가
  ERROR: 'ERROR',        // 차단, LLM 피드백 후 재생성
  WARNING: 'WARNING'     // 경고, 진행 가능
};

/**
 * SQL Validator 클래스
 */
export class SQLValidator {
  constructor(options = {}) {
    this.strictMode = options.strictMode !== false; // 기본: strict
    this.allowRetry = options.allowRetry !== false; // 기본: 재시도 허용
    this.maxRetries = options.maxRetries || 3;
  }

  /**
   * SQL 쿼리 검증
   * @param {string} sql - 검증할 SQL 쿼리
   * @returns {Object} { valid, violations, canRetry }
   */
  validate(sql) {
    if (!sql || typeof sql !== 'string') {
      return {
        valid: false,
        violations: [{
          type: 'INVALID_SQL',
          severity: SEVERITY.ERROR,
          message: 'SQL 쿼리가 비어있거나 잘못된 형식입니다'
        }],
        canRetry: false
      };
    }

    const violations = [];
    const upperSQL = sql.toUpperCase();

    // 1. SELECT * 검출 (ERROR - P0-1 핵심)
    if (this._hasSelectStar(sql)) {
      violations.push({
        type: 'SELECT_STAR_FORBIDDEN',
        severity: SEVERITY.ERROR,
        message: 'SELECT * 사용 금지 - 필요한 컬럼만 명시적으로 나열하세요',
        pattern: 'SELECT *',
        recommendation: 'SELECT column1, column2, ... FROM table'
      });
    }

    // 2. 민감 컬럼 검출 (CRITICAL - P0-2 핵심)
    const sensitiveFound = this._findSensitiveColumns(sql);
    if (sensitiveFound.length > 0) {
      violations.push({
        type: 'SENSITIVE_COLUMN_ACCESS',
        severity: SEVERITY.CRITICAL,
        message: `민감 컬럼 조회 금지: ${sensitiveFound.join(', ')}`,
        columns: sensitiveFound,
        recommendation: 'DOMAIN_SCHEMA.md의 허용 컬럼만 사용하세요'
      });
    }

    // 3. 대용량 테이블 LIMIT 검사 (WARNING)
    const largeTables = this._checkLargeTables(sql);
    for (const table of largeTables) {
      if (!this._hasLimit(sql)) {
        violations.push({
          type: 'LARGE_TABLE_NO_LIMIT',
          severity: SEVERITY.WARNING,
          message: `${table.name} (${(table.rows / 1000000).toFixed(0)}M행) 조회 시 LIMIT 필수`,
          table: table.name,
          recommendation: `LIMIT ${table.limit} 추가 필요`
        });
      }
    }

    // 4. 쓰기 명령어 검출 (CRITICAL)
    if (this._hasWriteCommand(sql)) {
      violations.push({
        type: 'WRITE_COMMAND_FORBIDDEN',
        severity: SEVERITY.CRITICAL,
        message: 'INSERT/UPDATE/DELETE/DROP 등 쓰기 명령 금지',
        recommendation: 'SELECT 쿼리만 허용됩니다'
      });
    }

    // 결과 판정
    const hasCritical = violations.some(v => v.severity === SEVERITY.CRITICAL);
    const hasError = violations.some(v => v.severity === SEVERITY.ERROR);

    return {
      valid: violations.length === 0 || (!hasCritical && !hasError),
      violations,
      canRetry: !hasCritical && this.allowRetry,
      summary: this._generateSummary(violations)
    };
  }

  /**
   * 다수 쿼리 일괄 검증
   * @param {Array} queries - [{ name, sql }]
   * @returns {Object} { allValid, results, blockedCount }
   */
  validateAll(queries) {
    if (!Array.isArray(queries)) {
      return { allValid: false, results: [], blockedCount: 0 };
    }

    const results = [];
    let blockedCount = 0;

    for (const query of queries) {
      const result = this.validate(query.sql);
      results.push({
        name: query.name || 'unnamed',
        sql: query.sql,
        ...result
      });

      if (!result.valid) {
        blockedCount++;
      }
    }

    return {
      allValid: blockedCount === 0,
      results,
      blockedCount,
      totalQueries: queries.length
    };
  }

  // ========== Private Methods ==========

  _hasSelectStar(sql) {
    // SELECT * FROM 또는 SELECT table.* FROM 패턴 검출
    // COUNT(*), SUM(*) 등은 허용
    const pattern = /SELECT\s+(\w+\.)?\*\s+(FROM|,)/i;
    return pattern.test(sql);
  }

  _findSensitiveColumns(sql) {
    const found = [];
    const upperSQL = sql.toUpperCase();

    for (const col of SENSITIVE_COLUMNS) {
      // 단어 경계로 매칭 (부분 매칭 방지)
      const pattern = new RegExp(`\\b${col}\\b`, 'i');
      if (pattern.test(sql)) {
        found.push(col);
      }
    }

    return found;
  }

  _checkLargeTables(sql) {
    const found = [];
    const upperSQL = sql.toUpperCase();

    for (const [tableName, info] of Object.entries(LARGE_TABLES)) {
      if (upperSQL.includes(tableName)) {
        found.push({ name: tableName, ...info });
      }
    }

    return found;
  }

  _hasLimit(sql) {
    return /LIMIT\s+\d+/i.test(sql);
  }

  _hasWriteCommand(sql) {
    const writePatterns = [
      /^\s*(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE)/i,
      /;\s*(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE)/i
    ];

    return writePatterns.some(p => p.test(sql));
  }

  _generateSummary(violations) {
    if (violations.length === 0) {
      return 'SQL 검증 통과';
    }

    const critical = violations.filter(v => v.severity === SEVERITY.CRITICAL).length;
    const error = violations.filter(v => v.severity === SEVERITY.ERROR).length;
    const warning = violations.filter(v => v.severity === SEVERITY.WARNING).length;

    const parts = [];
    if (critical > 0) parts.push(`CRITICAL: ${critical}`);
    if (error > 0) parts.push(`ERROR: ${error}`);
    if (warning > 0) parts.push(`WARNING: ${warning}`);

    return `SQL 검증 실패 - ${parts.join(', ')}`;
  }
}

// 싱글톤 인스턴스
let validatorInstance = null;

/**
 * SQLValidator 싱글톤 반환
 * @param {Object} options - 옵션
 * @returns {SQLValidator}
 */
export function getSQLValidator(options = {}) {
  if (!validatorInstance) {
    validatorInstance = new SQLValidator(options);
  }
  return validatorInstance;
}

export default SQLValidator;
