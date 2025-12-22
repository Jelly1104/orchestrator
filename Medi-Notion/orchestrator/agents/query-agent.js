/**
 * QueryAgent - SQL 쿼리 생성 및 실행 전문 에이전트
 *
 * Phase 6-1: Analysis Pipeline 분리
 * AnalysisAgent의 쿼리 관련 로직을 분리하여 재사용성 향상
 *
 * 역할:
 * - SQL 쿼리 생성 (PRD/분석 요구사항 기반)
 * - 쿼리 실행 및 재시도
 * - 위험 쿼리 감지 → HITL QUERY_REVIEW 트리거
 *
 * @version 1.0.0
 * @since 2025-12-22
 */

import { execSync } from 'child_process';
import { ProviderFactory } from '../providers/index.js';

// ========== 보안 상수 ==========
const SECURITY_LIMITS = {
  MAX_QUERY_LENGTH: 5000,
  MAX_RETRIES: 3,
  QUERY_TIMEOUT_MS: 60000,
  MAX_RESULT_ROWS: 10000,
};

// ========== 알려진 스키마 (DOMAIN_SCHEMA.md 기반) ==========
const KNOWN_TABLES = {
  'USERS': ['U_ID', 'U_EMAIL', 'U_NAME', 'U_KIND', 'U_ALIVE', 'U_REG_DATE'],
  'USER_DETAIL': ['U_ID', 'U_MAJOR_CODE_1', 'U_MAJOR_CODE_2', 'U_WORK_TYPE_1', 'U_OFFICE_ZIP', 'U_OFFICE_ADDR', 'U_HOSPITAL_NAME', 'U_CAREER_YEAR'],
  'CODE_MASTER': ['KBN', 'CODE', 'CODE_NAME', 'CODE_ORDER', 'USE_FLAG'],
  'CODE_LOC': ['ZIP_CODE', 'SIDO', 'SIGUNGU', 'DONG', 'FULL_ADDR'],
  'USER_LOGIN': ['U_ID', 'LOGIN_DATE', 'LOGIN_IP'],
  'COMMENT': ['COMMENT_IDX', 'BOARD_IDX', 'SVC_CODE', 'U_ID', 'CONTENT', 'PARENT_IDX', 'REG_DATE'],
  'BOARD_MUZZIMA': ['BOARD_IDX', 'CTG_CODE', 'U_ID', 'TITLE', 'CONTENT', 'READ_CNT', 'AGREE_CNT', 'REG_DATE'],
};

// ========== 대용량 테이블 경고 ==========
const LARGE_TABLES = {
  'USER_LOGIN': { rows: '2267만', warning: '반드시 WHERE 조건과 LIMIT 사용', limit: true },
  'COMMENT': { rows: '1826만', warning: '반드시 BOARD_IDX로 조회', limit: true },
  'BOARD_MUZZIMA': { rows: '337만', warning: 'LIMIT 필수', limit: true },
};

// ========== 위험 패턴 (HITL QUERY_REVIEW 트리거) ==========
const DANGEROUS_PATTERNS = [
  { pattern: /\bINSERT\s+INTO\b/i, reason: 'INSERT 문 감지' },
  { pattern: /\bUPDATE\s+\w+\s+SET\b/i, reason: 'UPDATE 문 감지' },
  { pattern: /\bDELETE\s+FROM\b/i, reason: 'DELETE 문 감지' },
  { pattern: /\bDROP\s+(TABLE|DATABASE)\b/i, reason: 'DROP 문 감지' },
  { pattern: /\bTRUNCATE\b/i, reason: 'TRUNCATE 문 감지' },
  { pattern: /;\s*SELECT/i, reason: '다중 쿼리 감지 (SQL Injection 위험)' },
  { pattern: /UNION\s+SELECT/i, reason: 'UNION SELECT 감지 (SQL Injection 위험)' },
];

export class QueryAgent {
  constructor(config = {}) {
    this.projectRoot = config.projectRoot || process.cwd();
    this.maxTokens = config.maxTokens || 4096;
    this.maxRetries = config.maxRetries || SECURITY_LIMITS.MAX_RETRIES;

    // DB 연결 정보
    this.dbConfig = config.dbConfig || {
      host: '222.122.26.242',
      port: 3306,
      database: 'medigate',
      user: 'medigate',
      password: config.dbPassword || process.env.MEDIGATE_DB_PASSWORD || 'apelWkd',
    };

    // Multi-LLM Provider 설정
    this.providerName = config.provider || 'anthropic';
    this.providerConfig = config.providerConfig || {};
    this.fallbackOrder = config.fallbackOrder || ['anthropic', 'openai', 'gemini'];
    this.useFallback = config.useFallback !== false;

    // Provider 초기화
    this._initProvider();
  }

  /**
   * Provider 초기화
   */
  _initProvider() {
    try {
      this.provider = ProviderFactory.create(this.providerName, {
        ...this.providerConfig,
        maxTokens: this.maxTokens
      });

      if (!this.provider.isAvailable()) {
        if (this.useFallback) {
          this.provider = ProviderFactory.getFirstAvailable(this.fallbackOrder, {
            [this.providerName]: this.providerConfig
          });
        }
      }

      if (this.provider) {
        console.log(`[QueryAgent] Using provider: ${this.provider.getName()}`);
      }
    } catch (error) {
      console.error(`[QueryAgent] Provider initialization failed: ${error.message}`);
      this.provider = null;
    }
  }

  /**
   * Provider를 통한 메시지 전송
   */
  async _sendMessage(systemPrompt, userMessage, timeout = 60000) {
    if (!this.provider) {
      throw new Error('[QueryAgent] No available provider');
    }

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`[QueryAgent] API 타임아웃 (${timeout}ms)`)), timeout);
    });

    const apiCall = async () => {
      if (this.useFallback) {
        return await ProviderFactory.sendWithFallback(
          systemPrompt,
          userMessage,
          this.fallbackOrder,
          { [this.providerName]: this.providerConfig }
        );
      }
      const result = await this.provider.sendMessage(systemPrompt, userMessage);
      return { ...result, provider: this.provider.getName() };
    };

    return await Promise.race([apiCall(), timeoutPromise]);
  }

  // ========== 쿼리 생성 ==========

  /**
   * 분석 요구사항 → SQL 쿼리 생성
   * @param {Object} requirements - { objective, tables, deliverables, successCriteria }
   * @returns {Array} - 생성된 쿼리 목록
   */
  async generateQueries(requirements) {
    const systemPrompt = this._buildQuerySystemPrompt();
    const userMessage = this._buildQueryUserPrompt(requirements);

    const response = await this._sendMessage(systemPrompt, userMessage);
    const queries = this._parseQueriesFromResponse(response.content);

    // 각 쿼리에 대해 위험 여부 검사
    for (const query of queries) {
      query.isDangerous = this.checkDangerous(query.sql);
    }

    return queries;
  }

  _buildQuerySystemPrompt() {
    return `당신은 메디게이트 데이터베이스 전문가입니다.

## 역할
- PRD 분석 요구사항을 SQL 쿼리로 변환합니다.
- 아래 정의된 테이블/컬럼만 사용합니다. **다른 컬럼명을 추측하지 마세요.**

## 핵심 테이블 스키마

### USERS (회원 기본)
- U_ID (PK): 회원 ID
- U_KIND: 회원유형 (UKD001=의사, UKD003=일반)
- U_ALIVE: 상태 (UST001=활성, UST000=비활성)
- U_REG_DATE: 가입일

### USER_DETAIL (회원 상세 프로필)
- U_ID (FK): 회원 ID
- U_MAJOR_CODE_1: 전문과목1 (SPC코드)
- U_WORK_TYPE_1: 근무형태 (WTP코드)
- U_HOSPITAL_NAME: 병원명

### CODE_MASTER (코드 마스터)
- KBN: 코드분류 (SPC=전문과목, WTP=근무형태, UKD=회원유형)
- CODE: 코드값
- CODE_NAME: 코드명

### USER_LOGIN (로그인 이력) - 대용량 2267만건
- U_ID (FK): 회원 ID
- LOGIN_DATE: 로그인일 (YYYYMMDD 형식)
- **반드시 WHERE 조건과 LIMIT 사용**

## 필수 규칙
1. SELECT 문만 사용 (INSERT/UPDATE/DELETE 절대 금지)
2. 대용량 테이블 접근 시 WHERE 조건과 LIMIT 필수
3. 민감 컬럼(U_NAME, U_EMAIL, LOGIN_IP) 직접 조회 금지
4. JOIN 시 인덱스 컬럼(U_ID, BOARD_IDX) 사용

## 출력 형식
\`\`\`json
{
  "queries": [
    {
      "name": "case_번호_쿼리명",
      "description": "쿼리 설명",
      "sql": "SELECT ..."
    }
  ]
}
\`\`\``;
  }

  _buildQueryUserPrompt(requirements) {
    return `## 분석 요구사항

### 목적
${requirements.objective || 'N/A'}

### 필요 테이블
${JSON.stringify(requirements.tables || [], null, 2)}

### 산출물 체크리스트
${(requirements.deliverables || []).map((d, i) => `${i + 1}. ${d.name || d.이름}: ${d.criteria || d.기준 || ''}`).join('\n') || 'N/A'}

### 성공 지표
${Array.isArray(requirements.successCriteria) ? requirements.successCriteria.join('\n') : requirements.successCriteria || 'N/A'}

위 요구사항을 충족하는 SQL 쿼리들을 생성해주세요.`;
  }

  _parseQueriesFromResponse(content) {
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        return parsed.queries || [];
      }
      const parsed = JSON.parse(content);
      return parsed.queries || [];
    } catch (error) {
      console.error('[QueryAgent] 쿼리 파싱 실패:', error.message);
      return [];
    }
  }

  // ========== 쿼리 검증 ==========

  /**
   * 위험 쿼리 감지 (HITL QUERY_REVIEW 트리거용)
   * @param {string} sql - SQL 쿼리
   * @returns {Object|null} - { isDangerous, reason } 또는 null
   */
  checkDangerous(sql) {
    if (!sql) return null;

    for (const { pattern, reason } of DANGEROUS_PATTERNS) {
      if (pattern.test(sql)) {
        return { isDangerous: true, reason };
      }
    }

    // 대용량 테이블 LIMIT 없이 조회
    for (const [table, info] of Object.entries(LARGE_TABLES)) {
      if (sql.toUpperCase().includes(table) && !/\bLIMIT\b/i.test(sql)) {
        return { isDangerous: true, reason: `${table} 대용량 테이블 LIMIT 없음` };
      }
    }

    return null;
  }

  /**
   * 스키마 검증
   * @param {string} sql - SQL 쿼리
   * @returns {Object} - { valid, warnings, errors }
   */
  validateSchema(sql) {
    const result = { valid: true, warnings: [], errors: [] };

    // 테이블명 추출
    const tablePattern = /\b(FROM|JOIN)\s+(`)?([A-Z][A-Z_0-9]+)(`)?/gi;
    let match;
    while ((match = tablePattern.exec(sql)) !== null) {
      const tableName = match[3].toUpperCase();
      if (!KNOWN_TABLES[tableName]) {
        // 와일드카드 패턴 허용
        const isWildcard = ['BOARD_', 'CBIZ_REC', 'CBIZ_LEASE'].some(p => tableName.startsWith(p));
        if (!isWildcard) {
          result.warnings.push(`알 수 없는 테이블: ${tableName}`);
        }
      }
    }

    // 컬럼 검증
    const columnPattern = /\b([A-Z][A-Z_0-9]+)\.([A-Z][A-Z_0-9]+)\b/gi;
    while ((match = columnPattern.exec(sql)) !== null) {
      const table = match[1].toUpperCase();
      const column = match[2].toUpperCase();

      if (KNOWN_TABLES[table] && !KNOWN_TABLES[table].includes(column)) {
        result.errors.push(`알 수 없는 컬럼: ${table}.${column}`);
        result.valid = false;
      }
    }

    return result;
  }

  // ========== 쿼리 실행 ==========

  /**
   * SQL 쿼리 실행 (재시도 포함)
   * @param {Array} queries - 실행할 쿼리 목록
   * @returns {Array} - 실행 결과
   */
  async executeQueries(queries) {
    const results = [];

    for (const query of queries) {
      console.log(`[QueryAgent] 실행 중: ${query.name}`);

      let attempts = 0;
      let lastError = null;
      let currentSQL = query.sql;

      while (attempts < this.maxRetries) {
        try {
          const data = await this._executeQuery(currentSQL);
          results.push({
            name: query.name,
            description: query.description,
            sql: currentSQL,
            data,
            rowCount: data.length,
            success: true,
          });
          console.log(`  ✓ 성공 (${data.length} rows)`);
          break;

        } catch (error) {
          lastError = error;
          attempts++;
          console.log(`  ✗ 시도 ${attempts}/${this.maxRetries}: ${error.message}`);

          if (attempts < this.maxRetries) {
            currentSQL = await this._fixQuery(currentSQL, error);
          }
        }
      }

      if (attempts >= this.maxRetries) {
        results.push({
          name: query.name,
          description: query.description,
          sql: currentSQL,
          error: lastError?.message || 'Unknown error',
          success: false,
        });
      }
    }

    return results;
  }

  /**
   * 단일 쿼리 실행
   */
  async _executeQuery(sql) {
    const { host, port, database, user, password } = this.dbConfig;
    const escapedSQL = sql.replace(/"/g, '\\"').replace(/`/g, '\\`');
    const mysqlPath = '/opt/homebrew/Cellar/mysql-client/9.5.0/bin/mysql';

    const command = `${mysqlPath} -h ${host} -P ${port} -u ${user} -p${password} ${database} -e "${escapedSQL}" --batch --raw`;

    try {
      const output = execSync(command, {
        encoding: 'utf-8',
        timeout: SECURITY_LIMITS.QUERY_TIMEOUT_MS,
        maxBuffer: 10 * 1024 * 1024,
      });

      return this._parseQueryOutput(output);
    } catch (error) {
      throw new Error(error.message || 'Query execution failed');
    }
  }

  /**
   * mysql --batch 출력 파싱
   */
  _parseQueryOutput(output) {
    const lines = output.trim().split('\n');
    if (lines.length === 0) return [];

    const headers = lines[0].split('\t');
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t');
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || null;
      });
      data.push(row);
    }

    return data;
  }

  /**
   * 오류 기반 쿼리 수정
   */
  async _fixQuery(originalSQL, error) {
    const systemPrompt = `당신은 SQL 디버깅 전문가입니다.
오류가 발생한 SQL을 수정해주세요.
수정된 SQL만 출력 (설명 없이)`;

    const userMessage = `## 원본 SQL
\`\`\`sql
${originalSQL}
\`\`\`

## 오류 메시지
${error.message}

수정된 SQL을 출력하세요.`;

    try {
      const response = await this._sendMessage(systemPrompt, userMessage);
      const sqlMatch = response.content.match(/```sql\s*([\s\S]*?)\s*```/);
      return sqlMatch ? sqlMatch[1].trim() : originalSQL;
    } catch {
      return originalSQL;
    }
  }

  // ========== 유틸리티 ==========

  /**
   * SQL 포맷팅
   */
  formatSQL(query) {
    return `-- ============================================
-- ${query.name}
-- ${query.description || ''}
-- Generated by QueryAgent
-- Date: ${new Date().toISOString().split('T')[0]}
-- ============================================

${query.sql}
`;
  }
}

export default QueryAgent;
