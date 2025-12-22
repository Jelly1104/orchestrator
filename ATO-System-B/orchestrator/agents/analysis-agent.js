/**
 * AnalysisAgent - 데이터 분석 담당
 *
 * 역할:
 * - 정량적 PRD 처리: SQL 생성 → 실행 → 결과 수집
 * - 혼합 PRD의 Phase A: 데이터 분석 → 인사이트 도출
 *
 * PRD v2 지원:
 * - type: QUANTITATIVE | MIXED
 * - pipeline: analysis | mixed
 *
 * @version 1.0.0
 * @since 2025-12-18
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { ProviderFactory } from '../providers/index.js';

// ========== 보안 상수 ==========
const SECURITY_LIMITS = {
  MAX_PRD_CONTENT_LENGTH: 50000,
  MAX_QUERY_LENGTH: 5000,
  MAX_RETRIES: 3,
  QUERY_TIMEOUT_MS: 60000,
};

// ========== 알려진 스키마 (DOMAIN_SCHEMA.md 기반) ==========
const KNOWN_TABLES = {
  'USERS': ['U_ID', 'U_EMAIL', 'U_NAME', 'U_KIND', 'U_ALIVE', 'U_REG_DATE'],
  'USER_DETAIL': ['U_ID', 'U_MAJOR_CODE_1', 'U_MAJOR_CODE_2', 'U_WORK_TYPE_1', 'U_OFFICE_ZIP', 'U_OFFICE_ADDR', 'U_HOSPITAL_NAME', 'U_CAREER_YEAR'],
  'CODE_MASTER': ['CODE_TYPE', 'CODE_VALUE', 'CODE', 'CODE_NAME', 'CODE_ORDER', 'USE_FLAG'],
  'CODE_LOC': ['ZIP_CODE', 'SIDO', 'SIGUNGU', 'DONG', 'FULL_ADDR'],
  'USER_LOGIN': ['U_ID', 'LOGIN_DATE', 'LOGIN_IP'],
  'COMMENT': ['COMMENT_IDX', 'BOARD_IDX', 'SVC_CODE', 'U_ID', 'CONTENT', 'PARENT_IDX', 'REG_DATE'],
  'BOARD_MUZZIMA': ['BOARD_IDX', 'CTG_CODE', 'U_ID', 'TITLE', 'CONTENT', 'READ_CNT', 'AGREE_CNT', 'REG_DATE'],
};

// ========== 대용량 테이블 경고 ==========
const LARGE_TABLES = {
  'USER_LOGIN': { rows: '2267만', warning: '반드시 WHERE 조건과 LIMIT 사용' },
  'COMMENT': { rows: '1826만', warning: '반드시 BOARD_IDX로 조회' },
  'BOARD_MUZZIMA': { rows: '337만', warning: 'LIMIT 필수' },
};

export class AnalysisAgent {
  constructor(config = {}) {
    this.projectRoot = config.projectRoot || process.cwd();
    this.maxTokens = config.maxTokens || 8192;
    this.maxRetries = config.maxRetries || SECURITY_LIMITS.MAX_RETRIES;

    // DB 연결 정보
    this.dbConfig = config.dbConfig || {
      host: '222.122.26.242',
      port: 3306,
      database: 'medigate',
      user: 'medigate',
      password: config.dbPassword || process.env.MEDIGATE_DB_PASSWORD || 'apelWkd',
    };

    // 산출물 저장 경로 (Pre-Step: workspace/analysis로 변경 2025-12-22)
    this.outputDir = config.outputDir || path.join(this.projectRoot, 'workspace', 'analysis');

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
        console.warn(`[AnalysisAgent] Primary provider ${this.providerName} is not available`);
        if (this.useFallback) {
          this.provider = ProviderFactory.getFirstAvailable(this.fallbackOrder, {
            [this.providerName]: this.providerConfig
          });
        }
      }

      if (this.provider) {
        console.log(`[AnalysisAgent] Using provider: ${this.provider.getName()}`);
      }
    } catch (error) {
      console.error(`[AnalysisAgent] Provider initialization failed: ${error.message}`);
      this.provider = null;
    }
  }

  /**
   * Provider를 통한 메시지 전송 (타임아웃 포함)
   * @param {string} systemPrompt - 시스템 프롬프트
   * @param {string} userMessage - 사용자 메시지
   * @param {number} timeout - 타임아웃 (ms, 기본값 60초)
   */
  async _sendMessage(systemPrompt, userMessage, timeout = 60000) {
    if (!this.provider) {
      throw new Error('[AnalysisAgent] No available provider');
    }

    // 타임아웃 Promise 생성
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`[AnalysisAgent] API 호출 타임아웃 (${timeout}ms)`)), timeout);
    });

    // 실제 API 호출
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
      return {
        ...result,
        provider: this.provider.getName()
      };
    };

    // 타임아웃과 API 호출 경쟁
    return await Promise.race([apiCall(), timeoutPromise]);
  }

  // ========== 메인 분석 함수 ==========

  /**
   * PRD 분석 실행
   * @param {Object} prd - 파싱된 PRD 객체
   * @returns {Object} - 분석 결과 및 산출물 경로
   */
  async analyze(prd) {
    console.log('\n[AnalysisAgent] ========== 분석 시작 ==========');
    console.log(`[AnalysisAgent] PRD 유형: ${prd.type || 'UNKNOWN'}`);
    console.log(`[AnalysisAgent] 파이프라인: ${prd.pipeline || 'analysis'}`);

    const results = {
      success: false,
      outputs: [],
      queries: [],
      data: [],
      insights: null,
      errors: [],
    };

    try {
      // Step 1: PRD에서 분석 요구사항 추출
      console.log('\n[Step 1] PRD 파싱...');
      const requirements = this.parseAnalysisRequirements(prd);
      console.log(`  - 필요 테이블: ${requirements.tables.map(t => t.name).join(', ')}`);
      console.log(`  - 산출물 ${requirements.deliverables.length}개`);

      // Step 2: 스키마 검증
      console.log('\n[Step 2] 스키마 검증...');
      const schemaValidation = this.validateSchema(requirements.tables);
      if (!schemaValidation.valid) {
        console.warn(`  - 경고: ${schemaValidation.warnings.join(', ')}`);
      }

      // Step 3: SQL 쿼리 생성
      console.log('\n[Step 3] SQL 쿼리 생성...');
      const queries = await this.generateQueries(requirements);
      results.queries = queries;
      console.log(`  - 생성된 쿼리 ${queries.length}개`);

      // Step 4: SQL 실행
      console.log('\n[Step 4] SQL 실행...');
      const queryResults = await this.executeQueries(queries);
      results.data = queryResults;

      const successCount = queryResults.filter(r => r.success).length;
      console.log(`  - 성공: ${successCount}/${queryResults.length}`);

      // Step 5: 결과 해석 (MIXED PRD일 때)
      if (prd.type === 'MIXED' || prd.pipeline === 'mixed') {
        console.log('\n[Step 5] 결과 해석 (MIXED)...');
        results.insights = await this.interpretResults(queryResults, requirements);
        console.log(`  - 패턴 ${results.insights.patterns?.length || 0}개 식별`);
        console.log(`  - 인사이트 ${results.insights.insights?.length || 0}개 도출`);
      }

      // Step 6: 산출물 생성
      console.log('\n[Step 6] 산출물 생성...');
      results.outputs = await this.generateOutputs(queries, queryResults, results.insights, prd);
      console.log(`  - 생성된 파일 ${results.outputs.length}개`);

      results.success = true;
      results.summary = this.generateSummary(queryResults, results.insights, prd);

    } catch (error) {
      console.error(`\n[AnalysisAgent] 오류 발생: ${error.message}`);
      results.errors.push(error.message);
    }

    console.log('\n[AnalysisAgent] ========== 분석 완료 ==========\n');
    return results;
  }

  // ========== Step 1: PRD 파싱 ==========

  /**
   * PRD에서 분석 요구사항 추출
   */
  parseAnalysisRequirements(prd) {
    const requirements = {
      objective: prd.objective || prd.목적 || '',
      tables: [],
      columns: [],
      deliverables: [],
      successCriteria: prd.successCriteria || prd.성공지표 || [],
      constraints: prd.constraints || prd.제약사항 || ['SELECT only'],
    };

    // 데이터 요구사항에서 테이블/컬럼 추출
    if (prd.dataRequirements || prd.데이터요구사항) {
      const dataReq = prd.dataRequirements || prd.데이터요구사항;
      if (Array.isArray(dataReq)) {
        for (const item of dataReq) {
          requirements.tables.push({
            name: item.table || item.테이블,
            columns: item.columns || item.컬럼 || [],
            purpose: item.purpose || item.용도 || '',
          });
        }
      }
    }

    // 산출물 중 분석 관련만 필터
    if (prd.deliverables || prd.산출물) {
      const deliverables = prd.deliverables || prd.산출물;
      requirements.deliverables = deliverables.filter(d => {
        const type = d.type || d.타입 || '';
        return ['SQL_QUERY', 'ANALYSIS_TABLE', 'REPORT', 'PROPOSAL'].includes(type);
      });
    }

    // 테이블이 명시되지 않았으면 PRD 텍스트에서 추론
    if (requirements.tables.length === 0) {
      requirements.tables = this.inferTablesFromPRD(prd);
    }

    return requirements;
  }

  /**
   * PRD 텍스트에서 필요한 테이블 추론
   */
  inferTablesFromPRD(prd) {
    const inferred = [];
    const prdText = JSON.stringify(prd).toLowerCase();

    // 키워드 기반 추론
    if (prdText.includes('회원') || prdText.includes('user') || prdText.includes('세그먼트')) {
      inferred.push({ name: 'USERS', columns: ['U_ID', 'U_KIND', 'U_ALIVE'], purpose: '회원 기본' });
    }
    if (prdText.includes('전문과목') || prdText.includes('major') || prdText.includes('근무')) {
      inferred.push({ name: 'USER_DETAIL', columns: ['U_ID', 'U_MAJOR_CODE_1', 'U_WORK_TYPE_1'], purpose: '프로필' });
    }
    if (prdText.includes('코드') || prdText.includes('code_name')) {
      inferred.push({ name: 'CODE_MASTER', columns: ['CODE', 'CODE_NAME'], purpose: '코드 변환' });
    }
    if (prdText.includes('로그인') || prdText.includes('접속') || prdText.includes('활성')) {
      inferred.push({ name: 'USER_LOGIN', columns: ['U_ID', 'LOGIN_DATE'], purpose: '로그인 이력' });
    }
    if (prdText.includes('댓글') || prdText.includes('comment')) {
      inferred.push({ name: 'COMMENT', columns: ['U_ID', 'BOARD_IDX', 'REG_DATE'], purpose: '댓글 활동' });
    }

    return inferred;
  }

  // ========== Step 2: 스키마 검증 ==========

  /**
   * 테이블/컬럼 스키마 검증
   */
  validateSchema(tables) {
    const result = { valid: true, warnings: [], errors: [] };

    for (const table of tables) {
      const tableName = table.name.toUpperCase();

      // 테이블 존재 확인
      if (!KNOWN_TABLES[tableName]) {
        result.warnings.push(`알 수 없는 테이블: ${tableName}`);
        continue;
      }

      // 컬럼 존재 확인
      for (const col of table.columns || []) {
        const colUpper = col.toUpperCase();
        if (!KNOWN_TABLES[tableName].includes(colUpper)) {
          result.warnings.push(`${tableName}에 없는 컬럼: ${col}`);
        }
      }

      // 대용량 테이블 경고
      if (LARGE_TABLES[tableName]) {
        result.warnings.push(`⚠️ ${tableName}: ${LARGE_TABLES[tableName].warning}`);
      }
    }

    return result;
  }

  // ========== Step 3: SQL 생성 ==========

  /**
   * 분석 요구사항 → SQL 쿼리 생성
   */
  async generateQueries(requirements) {
    const systemPrompt = this._buildQuerySystemPrompt();
    const userMessage = this._buildQueryUserPrompt(requirements);

    const response = await this._sendMessage(systemPrompt, userMessage);
    return this._parseQueriesFromResponse(response.content);
  }

  _buildQuerySystemPrompt() {
    return `당신은 메디게이트 데이터베이스 전문가입니다.

## 역할
- PRD 분석 요구사항을 SQL 쿼리로 변환합니다.
- 아래 정의된 테이블/컬럼만 사용합니다. **다른 컬럼명을 추측하지 마세요.**

## 핵심 테이블 스키마 (정확히 이 컬럼명만 사용)

### USERS (회원 기본)
- U_ID (PK): 회원 ID
- U_EMAIL: 이메일 (민감정보)
- U_NAME: 이름 (민감정보)
- U_KIND: 회원유형 (UKD001=의사, UKD003=일반)
- U_ALIVE: 상태 (UST001=활성, UST000=비활성)
- U_REG_DATE: 가입일

### USER_DETAIL (회원 상세 프로필)
- U_ID (FK): 회원 ID
- U_MAJOR_CODE_1: 전문과목1 (SPC코드, ex: SPC103=내과)
- U_MAJOR_CODE_2: 전문과목2
- U_WORK_TYPE_1: 근무형태 (WTP코드, ex: WTP006=개원의, WTP007=봉직의)
- U_OFFICE_ZIP: 우편번호
- U_OFFICE_ADDR: 주소
- U_HOSPITAL_NAME: 병원명
- **U_CAREER_YEAR 컬럼은 존재하지 않음! 경력은 U_REG_DATE로 계산**

### CODE_MASTER (코드 마스터) - **중요: 정확한 컬럼명 사용**
- KBN: 코드분류 (SPC=전문과목, WTP=근무형태, UKD=회원유형)
- CODE: 코드값 (ex: SPC103, WTP006)
- CODE_NAME: 코드명 (ex: '내과', '개원의')
- CODE_ORDER: 정렬순서
- USE_FLAG: 사용여부

**CODE_MASTER 조인 예시:**
\`\`\`sql
-- 전문과목 코드 조인 (올바른 방법)
JOIN CODE_MASTER cm ON cm.KBN = 'SPC' AND cm.CODE = ud.U_MAJOR_CODE_1

-- 근무형태 코드 조인 (올바른 방법)
JOIN CODE_MASTER cm ON cm.KBN = 'WTP' AND cm.CODE = ud.U_WORK_TYPE_1
\`\`\`

### USER_LOGIN (로그인 이력) - 대용량 2267만건
- U_ID (FK): 회원 ID
- LOGIN_DATE: 로그인일 (YYYYMMDD 형식)
- LOGIN_IP: 접속 IP (민감정보)
- **반드시 WHERE LOGIN_DATE >= DATE_SUB(...) 조건 사용**

## 대용량 테이블 주의
${JSON.stringify(LARGE_TABLES, null, 2)}

## 필수 규칙
1. SELECT 문만 사용 (INSERT/UPDATE/DELETE 절대 금지)
2. 대용량 테이블 접근 시 WHERE 조건과 LIMIT 필수
3. 민감 컬럼(U_NAME, U_EMAIL, LOGIN_IP) 직접 조회 금지
4. JOIN 시 인덱스 컬럼(U_ID, BOARD_IDX) 사용
5. **존재하지 않는 컬럼 추측 금지** - 위 스키마만 사용
6. CODE_MASTER 조인 시 반드시 KBN 컬럼으로 분류 지정

## 출력 형식
반드시 다음 JSON 형식으로 출력하세요:

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
${requirements.objective}

### 필요 테이블
${JSON.stringify(requirements.tables, null, 2)}

### 산출물 체크리스트
${requirements.deliverables.map((d, i) => `${i + 1}. ${d.name || d.이름}: ${d.criteria || d.기준 || ''}`).join('\n')}

### 성공 지표
${Array.isArray(requirements.successCriteria) ? requirements.successCriteria.join('\n') : requirements.successCriteria}

### 제약사항
${requirements.constraints.join('\n')}

위 요구사항을 충족하는 SQL 쿼리들을 생성해주세요.`;
  }

  _parseQueriesFromResponse(content) {
    try {
      // JSON 블록 추출
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        return parsed.queries || [];
      }

      // JSON 블록 없으면 전체 파싱 시도
      const parsed = JSON.parse(content);
      return parsed.queries || [];
    } catch (error) {
      console.error('[AnalysisAgent] 쿼리 파싱 실패:', error.message);
      return [];
    }
  }

  // ========== Step 4: SQL 실행 ==========

  /**
   * SQL 쿼리 실행 (재시도 포함)
   */
  async executeQueries(queries) {
    const results = [];

    for (const query of queries) {
      console.log(`  - 실행 중: ${query.name}`);

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
            data: data,
            rowCount: data.length,
            success: true,
          });
          console.log(`    ✓ 성공 (${data.length} rows)`);
          break;

        } catch (error) {
          lastError = error;
          attempts++;
          console.log(`    ✗ 시도 ${attempts}/${this.maxRetries}: ${error.message}`);

          if (attempts < this.maxRetries) {
            // 오류 기반 쿼리 수정 시도
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
   * 단일 쿼리 실행 (mysql CLI)
   */
  async _executeQuery(sql) {
    const { host, port, database, user, password } = this.dbConfig;

    // SQL 이스케이프
    const escapedSQL = sql.replace(/"/g, '\\"').replace(/`/g, '\\`');

    // mysql 클라이언트 경로 (macOS Homebrew)
    const mysqlPath = '/opt/homebrew/Cellar/mysql-client/9.5.0/bin/mysql';

    const command = `${mysqlPath} -h ${host} -P ${port} -u ${user} -p${password} ${database} -e "${escapedSQL}" --batch --raw`;

    try {
      const output = execSync(command, {
        encoding: 'utf-8',
        timeout: SECURITY_LIMITS.QUERY_TIMEOUT_MS,
        maxBuffer: 10 * 1024 * 1024, // 10MB
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

    // 첫 줄은 헤더
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

## 규칙
1. SELECT 문만 사용
2. 오류 원인을 파악하고 수정
3. 수정된 SQL만 출력 (설명 없이)`;

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

  // ========== Step 5: 결과 해석 ==========

  /**
   * 결과 해석 및 인사이트 도출 (MIXED PRD용)
   */
  async interpretResults(results, requirements) {
    const successfulResults = results.filter(r => r.success);
    if (successfulResults.length === 0) {
      return { patterns: [], insights: [], recommendations: [] };
    }

    const systemPrompt = `당신은 데이터 분석 전문가입니다.

## 역할
- 쿼리 실행 결과에서 패턴과 인사이트를 도출합니다.
- 비즈니스 관점의 해석을 제공합니다.
- 실행 가능한 Use Case를 제안합니다.

## 출력 형식
반드시 다음 JSON 형식으로 출력하세요:

\`\`\`json
{
  "patterns": [
    { "name": "패턴명", "description": "설명", "significance": "high|medium|low" }
  ],
  "insights": [
    { "finding": "발견 내용", "implication": "비즈니스 함의" }
  ],
  "recommendations": [
    { "action": "권장 액션", "priority": "P0|P1|P2", "expectedImpact": "예상 효과" }
  ]
}
\`\`\``;

    const userMessage = `## 분석 목적
${requirements.objective}

## 쿼리 실행 결과
${JSON.stringify(successfulResults.map(r => ({
  name: r.name,
  description: r.description,
  rowCount: r.rowCount,
  sample: r.data.slice(0, 10),
})), null, 2)}

## 성공 지표
${Array.isArray(requirements.successCriteria) ? requirements.successCriteria.join('\n') : requirements.successCriteria}

위 결과를 분석하여 패턴, 인사이트, 제안을 도출해주세요.`;

    try {
      const response = await this._sendMessage(systemPrompt, userMessage);
      const jsonMatch = response.content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      return { patterns: [], insights: [], recommendations: [] };
    } catch (error) {
      console.error('[AnalysisAgent] 결과 해석 실패:', error.message);
      return { patterns: [], insights: [], recommendations: [] };
    }
  }

  // ========== Step 6: 산출물 생성 ==========

  /**
   * 최종 산출물 파일 생성
   */
  async generateOutputs(queries, results, insights, prd) {
    const outputs = [];

    // 출력 디렉토리 생성
    const sqlDir = path.join(this.outputDir);
    const resultsDir = path.join(this.outputDir, 'results');

    if (!fs.existsSync(sqlDir)) fs.mkdirSync(sqlDir, { recursive: true });
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    // SQL 파일 생성
    for (const query of queries) {
      const filename = `${query.name}.sql`;
      const filepath = path.join(sqlDir, filename);
      const content = this._formatSQL(query);

      fs.writeFileSync(filepath, content, 'utf-8');
      outputs.push({ type: 'SQL_QUERY', path: filepath, name: query.name });
      console.log(`    - ${filename}`);
    }

    // 결과 데이터 저장
    for (const result of results.filter(r => r.success)) {
      const filename = `${result.name}_result.json`;
      const filepath = path.join(resultsDir, filename);

      fs.writeFileSync(filepath, JSON.stringify(result.data, null, 2), 'utf-8');
      outputs.push({ type: 'ANALYSIS_TABLE', path: filepath, name: result.name });
      console.log(`    - results/${filename}`);
    }

    // 리포트 생성
    const reportPath = path.join(this.outputDir, 'analysis_report.md');
    const reportContent = this._generateReport(results, insights, prd);

    fs.writeFileSync(reportPath, reportContent, 'utf-8');
    outputs.push({ type: 'REPORT', path: reportPath, name: 'Analysis Report' });
    console.log(`    - analysis_report.md`);

    return outputs;
  }

  _formatSQL(query) {
    return `-- ============================================
-- ${query.name}
-- ${query.description || ''}
-- Generated by AnalysisAgent
-- Date: ${new Date().toISOString().split('T')[0]}
-- ============================================

${query.sql}
`;
  }

  _generateReport(results, insights, prd) {
    const successResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);

    let report = `# 분석 리포트

> **생성일**: ${new Date().toISOString()}
> **PRD 유형**: ${prd.type || 'QUANTITATIVE'}
> **파이프라인**: ${prd.pipeline || 'analysis'}

---

## 1. 분석 개요

### 1.1 목적
${prd.objective || prd.목적 || 'N/A'}

### 1.2 실행 결과 요약
- 총 쿼리: ${results.length}개
- 성공: ${successResults.length}개
- 실패: ${failedResults.length}개

---

## 2. 쿼리 실행 결과

`;

    for (const result of successResults) {
      report += `### ${result.name}
- **설명**: ${result.description || 'N/A'}
- **결과 행 수**: ${result.rowCount}

\`\`\`sql
${result.sql}
\`\`\`

**샘플 데이터** (최대 5행):
\`\`\`json
${JSON.stringify(result.data.slice(0, 5), null, 2)}
\`\`\`

---

`;
    }

    if (failedResults.length > 0) {
      report += `## 3. 실패한 쿼리

`;
      for (const result of failedResults) {
        report += `### ${result.name}
- **오류**: ${result.error}

---

`;
      }
    }

    if (insights) {
      report += `## 4. 인사이트

### 4.1 식별된 패턴
${insights.patterns?.map(p => `- **${p.name}** (${p.significance}): ${p.description}`).join('\n') || '없음'}

### 4.2 핵심 인사이트
${insights.insights?.map(i => `- **${i.finding}**\n  - 함의: ${i.implication}`).join('\n\n') || '없음'}

### 4.3 제안사항
${insights.recommendations?.map(r => `- [${r.priority}] **${r.action}**\n  - 예상 효과: ${r.expectedImpact}`).join('\n\n') || '없음'}

---

`;
    }

    report += `## 참고

- 이 리포트는 AnalysisAgent에 의해 자동 생성되었습니다.
- 원본 쿼리 파일은 \`workspace/analysis/\` 디렉토리에서 확인할 수 있습니다.
- 전체 결과 데이터는 \`workspace/analysis/results/\` 디렉토리에서 확인할 수 있습니다.

---

**END OF REPORT**
`;

    return report;
  }

  /**
   * 분석 요약 생성
   */
  generateSummary(results, insights, prd) {
    const successCount = results.filter(r => r.success).length;
    const totalRows = results.filter(r => r.success).reduce((sum, r) => sum + r.rowCount, 0);

    return {
      prdType: prd.type || 'QUANTITATIVE',
      pipeline: prd.pipeline || 'analysis',
      queriesTotal: results.length,
      queriesSuccess: successCount,
      queriesFailed: results.length - successCount,
      totalRows: totalRows,
      patternsFound: insights?.patterns?.length || 0,
      insightsFound: insights?.insights?.length || 0,
      recommendationsCount: insights?.recommendations?.length || 0,
    };
  }
}

export default AnalysisAgent;
