/**
 * AnalysisAgent - 데이터 분석 담당
 *
 * 역할:
 * - 정량적 PRD 처리: SQL 생성 → 실행 → 결과 수집
 * - 혼합 PRD의 Phase A: 데이터 분석 → 인사이트 도출
 *
 * @version 1.1.0
 * @since 2025-12-22 (Fix: JSON Normalization)
 * @updated 2025-12-24 - .env 환경변수 지원, Option C Hybrid 기반
 * @updated 2025-12-26 - [P0-1] SELECT * 금지 규칙 및 DOMAIN_SCHEMA 기반 컬럼 화이트리스트 추가
 * @updated 2025-12-26 - [P2-1] Query Library Hybrid Search 도입 (Milestone 3)
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { ProviderFactory } from "../providers/index.js";
import { ReviewerSkill } from "../skills/reviewer/index.js";
import { SQLValidator } from "../security/sql-validator.js";
import { QueryLibrary } from "../skills/query/library/query-library.js";

// ========== 보안 상수 ==========
const SECURITY_LIMITS = {
  MAX_PRD_CONTENT_LENGTH: 50000,
  MAX_QUERY_LENGTH: 5000,
  MAX_RETRIES: 3,
  QUERY_TIMEOUT_MS: 60000,
};

// ========== PII 마스킹 패턴 (Security Filter v4.3.4) ==========
const PII_PATTERNS = {
  // 이메일 주소: abc@domain.com → a**@d***.com
  email: {
    pattern: /([a-zA-Z0-9._-]+)@([a-zA-Z0-9._-]+\.[a-zA-Z]{2,})/g,
    replace: (match, user, domain) => {
      const maskedUser = user.charAt(0) + '**';
      const maskedDomain = domain.charAt(0) + '***.' + domain.split('.').pop();
      return `${maskedUser}@${maskedDomain}`;
    }
  },
  // 전화번호: 010-1234-5678 → 010-****-5678
  phone: {
    pattern: /(01[0-9])[-.\s]?(\d{3,4})[-.\s]?(\d{4})/g,
    replace: (match, p1, p2, p3) => `${p1}-****-${p3}`
  },
  // 주민번호: 900101-1234567 → 900101-*******
  ssn: {
    pattern: /(\d{6})[-\s]?(\d{7})/g,
    replace: (match, front, back) => `${front}-*******`
  },
  // 면허번호: 제12345호 → 제*****호
  licenseNo: {
    pattern: /제(\d{4,6})호/g,
    replace: (match, num) => `제${'*'.repeat(num.length)}호`
  },
  // IP 주소: 192.168.1.100 → 192.168.***
  ip: {
    pattern: /(\d{1,3}\.\d{1,3})\.\d{1,3}\.\d{1,3}/g,
    replace: (match, prefix) => `${prefix}.***`
  },
  // 카드번호: 1234-5678-9012-3456 → ****-****-****-3456
  cardNumber: {
    pattern: /(\d{4})[-\s]?(\d{4})[-\s]?(\d{4})[-\s]?(\d{4})/g,
    replace: (match, p1, p2, p3, p4) => `****-****-****-${p4}`
  }
};

// PII 컬럼 (컬럼명 기반 자동 마스킹)
const PII_COLUMNS = [
  'U_EMAIL', 'EMAIL', 'MAIL',
  'U_TEL', 'U_PHONE', 'PHONE', 'TEL', 'MOBILE',
  'U_JUMIN', 'SSN', 'RESIDENT_NO',
  'LICENSE_NO', 'U_LICENSE',
  'LOGIN_IP', 'IP_ADDR', 'CLIENT_IP',
  'CARD_NO', 'ACCOUNT_NO',
  'PASSWORD', 'PWD', 'U_PWD'
];

const KNOWN_TABLES = {
  USERS: [
    "U_ID",
    "U_EMAIL",
    "U_NAME",
    "U_KIND",
    "U_ALIVE",
    "U_REG_DATE",
    "U_STATUS",
  ],
  USER_DETAIL: [
    "U_ID",
    "U_MAJOR_CODE_1",
    "U_MAJOR_CODE_2",
    "U_WORK_TYPE_1",
    "U_OFFICE_ZIP",
    "U_OFFICE_ADDR",
    "U_HOSPITAL_NAME",
    "U_CAREER_YEAR",
  ],
  CODE_MASTER: [
    "CODE_TYPE",
    "CODE_VALUE",
    "CODE",
    "CODE_NAME",
    "CODE_ORDER",
    "USE_FLAG",
    "KBN",
  ],
  CODE_LOC: ["ZIP_CODE", "SIDO", "SIGUNGU", "DONG", "FULL_ADDR"],
  USER_LOGIN: ["U_ID", "LOGIN_DATE", "LOGIN_IP"],
  COMMENT: [
    "COMMENT_IDX",
    "BOARD_IDX",
    "SVC_CODE",
    "U_ID",
    "CONTENT",
    "PARENT_IDX",
    "REG_DATE",
  ],
  BOARD_MUZZIMA: [
    "BOARD_IDX",
    "CTG_CODE",
    "U_ID",
    "TITLE",
    "CONTENT",
    "READ_CNT",
    "AGREE_CNT",
    "REG_DATE",
  ],
};

const LARGE_TABLES = {
  USER_LOGIN: { rows: "2267만", warning: "반드시 WHERE 조건과 LIMIT 사용" },
  COMMENT: { rows: "1826만", warning: "반드시 BOARD_IDX로 조회" },
  BOARD_MUZZIMA: { rows: "337만", warning: "LIMIT 필수" },
};

export class AnalysisAgent {
  constructor(config = {}) {
    this.projectRoot = config.projectRoot || process.cwd();
    this.maxTokens = config.maxTokens || 8192;
    this.maxRetries = config.maxRetries || SECURITY_LIMITS.MAX_RETRIES;

    // [Fix v4.3.4] .env 환경변수 우선 사용 (P0 인프라 구성)
    this.dbConfig = config.dbConfig || {
      host: process.env.DB_HOST || "222.122.26.242",
      port: parseInt(process.env.DB_PORT || "3306"),
      database: process.env.DB_NAME || "medigate",
      user: process.env.DB_USER || "ai_readonly",
      password: process.env.DB_PASS || config.dbPassword || "",
    };

    this.outputDir =
      config.outputDir || path.join(this.projectRoot, "workspace", "analysis");

    this.providerName = config.provider || "anthropic";
    this.providerConfig = config.providerConfig || {};
    this.fallbackOrder = config.fallbackOrder || [
      "anthropic",
      "openai",
      "gemini",
    ];
    this.useFallback = config.useFallback !== false;

    // P1-3: 세션별 토큰 사용량 추적
    this._sessionUsage = { inputTokens: 0, outputTokens: 0 };

    // P2-1: Query Library 초기화 (Milestone 3)
    this.queryLibrary = new QueryLibrary({
      libraryPath: path.join(this.projectRoot, 'orchestrator', 'skills', 'query', 'library')
    });
    this._queryLibraryInitialized = false;

    this._initProvider();
  }

  _initProvider() {
    try {
      this.provider = ProviderFactory.create(this.providerName, {
        ...this.providerConfig,
        maxTokens: this.maxTokens,
      });

      if (!this.provider.isAvailable()) {
        console.warn(
          `[AnalysisAgent] Primary provider ${this.providerName} is not available`
        );
        if (this.useFallback) {
          this.provider = ProviderFactory.getFirstAvailable(
            this.fallbackOrder,
            {
              [this.providerName]: this.providerConfig,
            }
          );
        }
      }
    } catch (error) {
      console.error(
        `[AnalysisAgent] Provider initialization failed: ${error.message}`
      );
      this.provider = null;
    }
  }

  async _sendMessage(systemPrompt, userMessage, timeout = 60000) {
    if (!this.provider) {
      throw new Error("[AnalysisAgent] No available provider");
    }

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () =>
          reject(new Error(`[AnalysisAgent] API 호출 타임아웃 (${timeout}ms)`)),
        timeout
      );
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

    const result = await Promise.race([apiCall(), timeoutPromise]);

    // P1-3: 세션별 토큰 사용량 누적
    if (result?.usage) {
      this._sessionUsage.inputTokens += result.usage.inputTokens || result.usage.input_tokens || 0;
      this._sessionUsage.outputTokens += result.usage.outputTokens || result.usage.output_tokens || 0;
    }

    return result;
  }

  /**
   * P1-3: 세션 토큰 사용량 초기화
   */
  _resetSessionUsage() {
    this._sessionUsage = { inputTokens: 0, outputTokens: 0 };
  }

  /**
   * P1-3: 세션 토큰 사용량 반환
   */
  _getSessionUsage() {
    return { ...this._sessionUsage };
  }

  // ========== 메인 분석 함수 ==========

  async analyze(prd, taskId = null, options = {}) {
    console.log("\n[AnalysisAgent] ========== 분석 시작 ==========");

    // P1-3: 세션 토큰 사용량 초기화
    this._resetSessionUsage();

    // [Fix v4.3.0] Case-Centric 경로 지원: options.outputDir 우선 사용
    if (options.outputDir) {
      this.outputDir = options.outputDir;
    } else if (taskId) {
      // Fallback: docs/cases/{taskId}/analysis (Case-Centric 기본값)
      this.outputDir = path.join(
        this.projectRoot,
        "docs",
        "cases",
        taskId,
        "analysis"
      );
    }
    console.log(`[AnalysisAgent] 산출물 경로: ${this.outputDir}`);

    const results = {
      success: false,
      outputs: [],
      queries: [],
      data: [],
      insights: null,
      errors: [],
      taskId: taskId,
      outputDir: this.outputDir,
      // P1-3: 토큰 사용량 추적
      usage: { inputTokens: 0, outputTokens: 0 },
    };

    try {
      // Step 1: PRD 파싱
      console.log("\n[Step 1] PRD 파싱...");
      let prdObj = prd;
      if (typeof prd === "string") {
        prdObj = this._convertStringPRDtoObject(prd);
      }
      const requirements = this.parseAnalysisRequirements(prdObj);
      console.log(
        `  - 목적: ${
          requirements.objective
            ? requirements.objective.substring(0, 50) + "..."
            : "❌"
        }`
      );
      console.log(
        `  - 필요 테이블: ${requirements.tables.map((t) => t.name).join(", ")}`
      );

      // Step 2: 스키마 검증
      console.log("\n[Step 2] 스키마 검증...");
      const schemaValidation = this.validateSchema(requirements.tables);
      if (!schemaValidation.valid) {
        console.warn(`  - 경고: ${schemaValidation.warnings.join(", ")}`);
      }

      // Step 3: SQL 쿼리 생성
      console.log("\n[Step 3] SQL 쿼리 생성...");
      const rawQueries = await this.generateQueries(requirements);
      // ✅ [Fix] 쿼리 정규화 (undefined 방지)
      const queries = this._normalizeQueries(rawQueries);
      results.queries = queries;
      console.log(`  - 생성된 쿼리 ${queries.length}개`);

      // 디버깅: 생성된 쿼리 이름 확인
      queries.forEach((q) => console.log(`    > ${q.name}`));

      // Step 3.5: SQL 검증 게이트 (P0-3)
      console.log("\n[Step 3.5] SQL 검증 게이트 (P0-3)...");
      const sqlValidator = new SQLValidator({ strictMode: true });
      const validationResult = sqlValidator.validateAll(queries);

      if (!validationResult.allValid) {
        console.error(`  ❌ SQL 검증 실패: ${validationResult.blockedCount}/${validationResult.totalQueries} 쿼리 차단`);

        // 위반 사항 로깅
        for (const result of validationResult.results) {
          if (!result.valid) {
            console.error(`    - ${result.name}: ${result.summary}`);
            for (const v of result.violations) {
              console.error(`      [${v.severity}] ${v.message}`);
            }
          }
        }

        // 재시도 가능 여부 확인
        const canRetry = validationResult.results.every(r => r.valid || r.canRetry);

        if (!canRetry) {
          // CRITICAL 위반 - 즉시 중단
          results.success = false;
          results.errors.push(`SQL 검증 실패 (CRITICAL): ${validationResult.blockedCount}개 쿼리 차단`);
          results.sqlValidation = validationResult;
          console.log("\n[AnalysisAgent] ========== SQL 검증 실패 - 조기 종료 ==========\n");
          return results;
        }

        // ERROR 위반 - 피드백 반영 재생성 시도
        console.log("  → LLM 피드백 반영 재생성 시도...");
        const regeneratedQueries = await this._regenerateQueriesWithFeedback(
          requirements,
          validationResult.results.filter(r => !r.valid)
        );

        if (regeneratedQueries.length > 0) {
          // 재검증
          const revalidation = sqlValidator.validateAll(regeneratedQueries);
          if (revalidation.allValid) {
            console.log("  ✅ 재생성 쿼리 검증 통과");
            queries.length = 0;
            queries.push(...regeneratedQueries);
          } else {
            console.error("  ❌ 재생성 쿼리도 검증 실패 - 진행 불가");
            results.success = false;
            results.errors.push(`SQL 재생성 후에도 검증 실패`);
            results.sqlValidation = revalidation;
            return results;
          }
        }
      } else {
        console.log(`  ✅ SQL 검증 통과: ${validationResult.totalQueries}개 쿼리 모두 안전`);
      }

      results.sqlValidation = validationResult;

      // Step 4: SQL 실행
      console.log("\n[Step 4] SQL 실행...");
      const queryResults = await this.executeQueries(queries);
      results.data = queryResults;

      const successCount = queryResults.filter((r) => r.success).length;
      console.log(`  - 성공: ${successCount}/${queryResults.length}`);

      // Step 4.5: Reviewer Skill 쿼리 결과 검증 (v1.0.3 - AGENT_ARCHITECTURE v2.6.2 준수)
      console.log("\n[Step 4.5] Reviewer Skill: 쿼리 결과 검증...");
      const reviewResult = await this._validateQueryResults(queryResults, prdObj, requirements);

      if (!reviewResult.passed) {
        console.error(`  ❌ Reviewer FAIL (${reviewResult.score}/100): ${reviewResult.summary}`);
        console.log("  → Phase A 재시작 필요");

        // 검증 실패 결과 반환 (Orchestrator에서 재시도 결정)
        results.reviewResult = reviewResult;
        results.success = false;
        results.errors.push(`Reviewer Skill FAIL: ${reviewResult.summary}`);

        // Fail-Fast: 리포트 생성 없이 조기 종료
        console.log("\n[AnalysisAgent] ========== 검증 실패 - 조기 종료 ==========\n");
        return results;
      }

      console.log(`  ✅ Reviewer PASS (${reviewResult.score}/100)`);
      results.reviewResult = reviewResult;

      // Step 5: 결과 해석
      if (prdObj.type === "MIXED" || prdObj.pipeline === "mixed") {
        console.log("\n[Step 5] 결과 해석 (MIXED)...");
        results.insights = await this.interpretResults(
          queryResults,
          requirements
        );
      }

      // Step 6: 산출물 생성
      console.log("\n[Step 6] 산출물 생성...");
      results.outputs = await this.generateOutputs(
        queries,
        queryResults,
        results.insights,
        prdObj
      );

      results.success = true;
      results.summary = this.generateSummary(
        queryResults,
        results.insights,
        prdObj
      );
    } catch (error) {
      console.error(`\n[AnalysisAgent] 오류 발생: ${error.message}`);
      results.errors.push(error.message);
    }

    // P1-3: 세션 토큰 사용량을 결과에 복사
    results.usage = this._getSessionUsage();

    console.log("\n[AnalysisAgent] ========== 분석 완료 ==========\n");
    return results;
  }

  // ========== Helpers ==========

  /**
   * ✅ [New] 쿼리 객체 정규화 (LLM 출력 보정)
   */
  _normalizeQueries(queries) {
    if (!Array.isArray(queries)) return [];

    return queries.map((q, index) => {
      // LLM이 뱉을 수 있는 다양한 키 매핑
      const name =
        q.name || q.queryName || q.query_name || `query_${index + 1}`;
      const sql = q.sql || q.query || q.querySql || q.sql_query || "";
      const description = q.description || q.desc || "";

      return { name, sql, description };
    });
  }

  /**
   * [P0-3] 검증 실패 쿼리 재생성 (피드백 반영)
   */
  async _regenerateQueriesWithFeedback(requirements, failedResults) {
    const feedbackPrompt = `
## 쿼리 재생성 요청

이전에 생성한 SQL 쿼리가 보안 검증에 실패했습니다.
아래 위반 사항을 수정하여 다시 생성하세요.

### 위반 사항:
${failedResults.map(r => `
- **${r.name}**:
${r.violations.map(v => `  - [${v.severity}] ${v.message}`).join('\n')}
`).join('\n')}

### 필수 수정 사항:
1. SELECT * 대신 필요한 컬럼만 명시적으로 나열
2. 민감 컬럼 (U_PASSWD, U_EMAIL, U_NAME, U_SID, U_TEL 등) 제거
3. 대용량 테이블 (USER_LOGIN, COMMENT, BOARD_MUZZIMA) 조회 시 LIMIT 추가

### 허용된 컬럼 (DOMAIN_SCHEMA.md 기준):
- USERS: U_ID, U_KIND, U_ALIVE, U_REG_DATE
- USER_DETAIL: U_ID, U_MAJOR_CODE_1, U_MAJOR_CODE_2, U_WORK_TYPE_1
- CODE_MASTER: CODE_TYPE, CODE_VALUE, CODE_NAME, CODE_ORDER, USE_FLAG

위 규칙을 준수하여 쿼리를 재생성하세요.
`;

    const systemPrompt = `당신은 SQL 전문가입니다.
보안 검증에 실패한 쿼리를 수정하여 재생성합니다.
반드시 JSON 포맷으로 응답하세요: { "queries": [{ "name": "...", "sql": "..." }] }
SELECT * 절대 금지. 민감 컬럼 조회 금지. 한국어 설명 금지.`;

    const userMessage = `${feedbackPrompt}

원래 요구사항:
${requirements.objective}

테이블:
${JSON.stringify(requirements.tables)}`;

    try {
      const response = await this._sendMessage(systemPrompt, userMessage);
      const regenerated = this._parseQueriesFromResponse(response.content);
      return this._normalizeQueries(regenerated);
    } catch (error) {
      console.error(`  [Regenerate] 재생성 실패: ${error.message}`);
      return [];
    }
  }

  _convertStringPRDtoObject(prdText) {
    const obj = {
      type: "QUANTITATIVE",
      pipeline: "analysis",
      originalText: prdText,
    };
    const objectiveMatch = prdText.match(
      /##\s*1\.\s*(목적|Objective)[\s\S]*?([\s\S]*?)(?=##|$)/i
    );
    if (objectiveMatch) obj.objective = objectiveMatch[2].trim();

    const criteriaMatch = prdText.match(
      /##\s*3\.\s*(성공 지표|Success Metrics)[\s\S]*?([\s\S]*?)(?=##|$)/i
    );
    if (criteriaMatch)
      obj.successCriteria = criteriaMatch[2]
        .trim()
        .split("\n")
        .filter((line) => line.trim().startsWith("-"));

    if (prdText.includes("MIXED") || prdText.includes("mixed")) {
      obj.type = "MIXED";
      obj.pipeline = "mixed";
    }
    return obj;
  }

  parseAnalysisRequirements(prd) {
    // [P2-1 Fix] originalText를 문자열로 보장
    let originalText = prd.originalText || prd;
    if (typeof originalText !== 'string') {
      originalText = JSON.stringify(originalText);
    }

    const requirements = {
      objective: prd.objective || prd.목적 || "",
      tables: [],
      constraints: prd.constraints || ["SELECT only"],
      originalText: originalText,
    };
    requirements.tables = this.inferTablesFromPRD(prd);
    return requirements;
  }

  inferTablesFromPRD(prd) {
    const inferred = [];
    const prdText = (
      typeof prd === "string" ? prd : prd.originalText || JSON.stringify(prd)
    ).toLowerCase();

    if (prdText.includes("회원") || prdText.includes("user")) {
      inferred.push({ name: "USERS", columns: ["U_ID", "U_KIND", "U_ALIVE"] });
    }
    if (prdText.includes("전문과목") || prdText.includes("major")) {
      inferred.push({
        name: "USER_DETAIL",
        columns: ["U_ID", "U_MAJOR_CODE_1"],
      });
    }
    if (prdText.includes("코드") || prdText.includes("code_name")) {
      inferred.push({ name: "CODE_MASTER", columns: ["CODE", "CODE_NAME"] });
    }
    if (prdText.includes("로그인")) {
      inferred.push({ name: "USER_LOGIN", columns: ["U_ID", "LOGIN_DATE"] });
    }
    return inferred;
  }

  validateSchema(tables) {
    const result = { valid: true, warnings: [] };
    for (const table of tables) {
      const tableName = table.name.toUpperCase();
      if (!KNOWN_TABLES[tableName]) {
        result.warnings.push(`알 수 없는 테이블: ${tableName}`);
      }
    }
    return result;
  }

  /**
   * [P2-1] Hybrid Search 기반 쿼리 생성 (Milestone 3)
   *
   * Flow:
   * 1. Query Library 초기화 (최초 1회)
   * 2. 질문 의도 분석 → 라이브러리 매칭 시도
   * 3. 매칭 성공 → 템플릿 로드 및 파라미터 주입 [Source: Library]
   * 4. 매칭 실패 → LLM 동적 생성 [Source: Generated]
   */
  async generateQueries(requirements) {
    // Step 1: Query Library 초기화 (최초 1회)
    if (!this._queryLibraryInitialized) {
      try {
        await this.queryLibrary.initialize();
        this._queryLibraryInitialized = true;
      } catch (error) {
        console.warn(`[AnalysisAgent] Query Library 초기화 실패: ${error.message}`);
      }
    }

    // Step 2: Hybrid Search - 라이브러리 매칭 시도
    // [Fix] originalText를 우선 사용하여 PRD 전체 내용을 검색
    const querySource = requirements.originalText || requirements.objective || '';
    console.log(`  [Hybrid Search] 검색 대상 텍스트 길이: ${querySource.length}자`);
    const match = this.queryLibrary.findMatchingTemplate(querySource);

    if (match) {
      // Step 3: 매칭 성공 → 템플릿에서 쿼리 로드 [Source: Library]
      console.log(`  📚 [Source: Library] Using template: ${match.template.file}`);

      // 파라미터 추출 (PRD에서 날짜 등 파싱)
      const params = this._extractQueryParams(requirements);

      const libraryQueries = this.queryLibrary.loadQueries(match.key, params);

      if (libraryQueries.length > 0) {
        console.log(`  ✅ ${libraryQueries.length}개 쿼리 로드 완료 (Library)`);
        return libraryQueries;
      }

      console.log(`  ⚠️ 템플릿 로드 실패, LLM 생성으로 전환`);
    }

    // Step 4: 매칭 실패 → LLM 동적 생성 [Source: Generated]
    console.log(`  🤖 [Source: Generated] LLM 동적 SQL 생성`);
    return await this._generateQueriesWithLLM(requirements);
  }

  /**
   * PRD에서 쿼리 파라미터 추출
   */
  _extractQueryParams(requirements) {
    const params = {};
    const text = requirements.originalText || '';

    // 날짜 파라미터 추출 (YYYY-MM-DD 형식)
    const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      params.since_date = dateMatch[1];
    }

    // 기본값 설정
    if (!params.since_date) {
      // 기본값: 1년 전
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      params.since_date = oneYearAgo.toISOString().split('T')[0];
    }

    return params;
  }

  /**
   * LLM 기반 동적 SQL 생성 (기존 로직)
   */
  async _generateQueriesWithLLM(requirements) {
    // [P0-1] SELECT * 금지 및 DOMAIN_SCHEMA 기반 SQL 생성 규칙 (v4.3.14)
    const SQL_GENERATION_RULES = `
## SQL 생성 필수 규칙 (DOMAIN_SCHEMA.md 준수)

### 1. SELECT * 절대 금지 ❌
- "SELECT *" 사용 금지. 항상 필요한 컬럼만 명시적으로 나열하세요.
- 예시 (잘못됨): SELECT * FROM USERS
- 예시 (올바름): SELECT U_ID, U_KIND, U_ALIVE FROM USERS

### 2. 허용된 컬럼만 사용 (DOMAIN_SCHEMA.md 기준)
- USERS: U_ID, U_KIND, U_ALIVE, U_REG_DATE (U_EMAIL, U_NAME 조회 금지)
- USER_DETAIL: U_ID, U_MAJOR_CODE_1, U_MAJOR_CODE_2, U_WORK_TYPE_1, U_OFFICE_ZIP, U_HOSPITAL_NAME, U_CAREER_YEAR
- CODE_MASTER: CODE_TYPE, CODE_VALUE, CODE_NAME, CODE_ORDER, USE_FLAG
- USER_LOGIN: U_ID, LOGIN_DATE (LOGIN_IP 조회 금지, 최근 3개월만)
- COMMENT: COMMENT_IDX, BOARD_IDX, SVC_CODE, REG_DATE (U_ID는 집계용만)
- BOARD_MUZZIMA: BOARD_IDX, CTG_CODE, TITLE, READ_CNT, AGREE_CNT, REG_DATE

### 3. 민감 컬럼 조회 절대 금지 ❌
- 금지 컬럼: U_PASSWD, U_PASSWD_ENC, U_EMAIL, U_NAME, U_SID, U_SID_ENC, U_TEL, U_IP, LOGIN_IP, U_JUMIN
- 위 컬럼이 포함된 쿼리는 실행이 차단됩니다.

### 4. 대용량 테이블 LIMIT 필수
- USER_LOGIN (2267만행): WHERE 조건 + LIMIT 1000 필수
- COMMENT (1826만행): BOARD_IDX 조건 + LIMIT 1000 필수
- BOARD_MUZZIMA (337만행): LIMIT 1000 필수
`;

    const systemPrompt = `당신은 SQL 전문가입니다.
${SQL_GENERATION_RULES}

반드시 JSON 포맷으로 응답하세요: { "queries": [{ "name": "...", "sql": "..." }] }
한국어 설명 금지. 위 규칙을 위반하면 쿼리가 차단됩니다.`;

    const userMessage = `요구사항:\n${
      requirements.objective
    }\n\n테이블:\n${JSON.stringify(requirements.tables)}\n\nPRD원문:\n${
      requirements.originalText
    }`;

    const response = await this._sendMessage(systemPrompt, userMessage);
    const queries = this._parseQueriesFromResponse(response.content);

    // [P2-1] 소스 태깅 추가
    return queries.map(q => ({
      ...q,
      source: 'generated'
    }));
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
    } catch {
      return [];
    }
  }

  async executeQueries(queries) {
    const results = [];

    // [Fix v4.3.3] 실제 DB 연결 시도
    let dbConnection = null;
    let useRealDB = false;

    try {
      // MySQL2 동적 import (설치되어 있을 경우)
      const mysql = await import('mysql2/promise').catch(() => null);

      if (mysql && this.dbConfig) {
        console.log(`  [DB] 연결 시도: ${this.dbConfig.host}:${this.dbConfig.port}/${this.dbConfig.database}`);

        dbConnection = await mysql.default.createConnection({
          host: this.dbConfig.host,
          port: this.dbConfig.port,
          database: this.dbConfig.database,
          user: this.dbConfig.user,
          password: this.dbConfig.password,
          connectTimeout: 10000,
        });

        console.log(`  [DB] ✅ 연결 성공`);
        useRealDB = true;
      }
    } catch (dbError) {
      console.warn(`  [DB] ⚠️ 연결 실패: ${dbError.message}`);
      console.warn(`  [DB] Mock 모드로 전환 (실제 데이터 없음)`);
    }

    for (const query of queries) {
      const queryName = query.name || "unnamed_query";
      // [P2-1] 쿼리 소스 로깅 (Library vs Generated)
      const sourceTag = query.source === 'library' ? '📚 Library' : '🤖 Generated';
      console.log(`  - 실행 중: ${queryName} [${sourceTag}]`);

      const result = {
        name: queryName,
        sql: query.sql,
        data: [],
        rowCount: 0,
        success: false,
        error: null,
        source: query.source || 'unknown',  // P2-1: 소스 추적
      };

      if (useRealDB && dbConnection) {
        try {
          // 실제 쿼리 실행 (SELECT만 허용)
          if (!query.sql.trim().toUpperCase().startsWith('SELECT')) {
            throw new Error('SELECT 쿼리만 허용됩니다');
          }

          const [rows] = await dbConnection.execute(query.sql);
          result.data = Array.isArray(rows) ? rows.slice(0, 1000) : []; // 최대 1000행
          result.rowCount = result.data.length;
          result.success = true;
          console.log(`    ✅ ${result.rowCount}행 반환`);
        } catch (queryError) {
          result.error = queryError.message;
          result.success = false;
          console.log(`    ❌ 쿼리 오류: ${queryError.message}`);
        }
      } else {
        // Mock 모드: DB 연결 없이 SQL 파일만 생성
        result.success = true;
        result.data = [];
        result.rowCount = 0;
        result.mock = true;
        console.log(`    ⚠️ Mock 모드 (데이터 없음)`);
      }

      results.push(result);
    }

    // DB 연결 종료
    if (dbConnection) {
      await dbConnection.end();
      console.log(`  [DB] 연결 종료`);
    }

    // [New v4.3.4] Security Filter: PII 마스킹 적용
    console.log(`  [Security] PII 마스킹 적용 중...`);
    const maskedResults = results.map(r => this._applyPIIMasking(r));
    const maskedCount = maskedResults.reduce((sum, r) => sum + (r.piiMaskedCount || 0), 0);
    if (maskedCount > 0) {
      console.log(`  [Security] ✅ ${maskedCount}개 PII 필드 마스킹 완료`);
    }

    return maskedResults;
  }

  /**
   * [New v4.3.4] PII 마스킹 적용 (Security Filter)
   * - 컬럼명 기반 자동 마스킹
   * - 패턴 기반 값 마스킹
   */
  _applyPIIMasking(queryResult) {
    if (!queryResult.data || queryResult.data.length === 0) {
      return queryResult;
    }

    let maskedCount = 0;
    const maskedData = queryResult.data.map(row => {
      const maskedRow = { ...row };

      for (const [col, value] of Object.entries(row)) {
        if (value === null || value === undefined) continue;

        const upperCol = col.toUpperCase();
        const strValue = String(value);

        // 1. 컬럼명 기반 마스킹 (PASSWORD 등은 완전 마스킹)
        if (PII_COLUMNS.some(pii => upperCol.includes(pii))) {
          if (upperCol.includes('PASSWORD') || upperCol.includes('PWD')) {
            maskedRow[col] = '********';
          } else if (upperCol.includes('EMAIL') || upperCol.includes('MAIL')) {
            maskedRow[col] = strValue.replace(PII_PATTERNS.email.pattern, PII_PATTERNS.email.replace);
          } else if (upperCol.includes('TEL') || upperCol.includes('PHONE') || upperCol.includes('MOBILE')) {
            maskedRow[col] = strValue.replace(PII_PATTERNS.phone.pattern, PII_PATTERNS.phone.replace);
          } else if (upperCol.includes('JUMIN') || upperCol.includes('SSN')) {
            maskedRow[col] = strValue.replace(PII_PATTERNS.ssn.pattern, PII_PATTERNS.ssn.replace);
          } else if (upperCol.includes('IP')) {
            maskedRow[col] = strValue.replace(PII_PATTERNS.ip.pattern, PII_PATTERNS.ip.replace);
          } else if (upperCol.includes('LICENSE')) {
            maskedRow[col] = strValue.replace(PII_PATTERNS.licenseNo.pattern, PII_PATTERNS.licenseNo.replace);
          } else if (upperCol.includes('CARD') || upperCol.includes('ACCOUNT')) {
            maskedRow[col] = strValue.replace(PII_PATTERNS.cardNumber.pattern, PII_PATTERNS.cardNumber.replace);
          }
          maskedCount++;
          continue;
        }

        // 2. 패턴 기반 마스킹 (컬럼명과 무관하게 값 자체 검사)
        if (PII_PATTERNS.email.pattern.test(strValue)) {
          PII_PATTERNS.email.pattern.lastIndex = 0; // reset regex
          maskedRow[col] = strValue.replace(PII_PATTERNS.email.pattern, PII_PATTERNS.email.replace);
          maskedCount++;
        } else if (PII_PATTERNS.ssn.pattern.test(strValue)) {
          PII_PATTERNS.ssn.pattern.lastIndex = 0;
          maskedRow[col] = strValue.replace(PII_PATTERNS.ssn.pattern, PII_PATTERNS.ssn.replace);
          maskedCount++;
        }
      }

      return maskedRow;
    });

    return {
      ...queryResult,
      data: maskedData,
      piiMaskedCount: maskedCount,
    };
  }

  async interpretResults(results, requirements) {
    // [Fix v4.3.4] Option C Hybrid: 코드 레벨 통계 + LLM 비즈니스 인사이트
    // [Hotfix] 3-Way State Handling (PO 지시 2025-12-26)
    const insights = {
      patterns: [],
      insights: [],
      recommendations: [],
      llmInsights: null,  // LLM 생성 비즈니스 인사이트
      dataAvailable: false,
      state: null,  // 'success_with_data' | 'success_no_data' | 'connection_failure'
    };

    // [Hotfix] 3-Way State 판별
    const mockResults = results.filter(r => r.mock === true);
    const successResults = results.filter(r => r.success && !r.mock);
    const resultsWithData = results.filter(r => r.success && r.rowCount > 0);

    // State 1: ❌ Connection Failure (Mock 모드)
    if (mockResults.length > 0 && successResults.length === 0) {
      insights.state = 'connection_failure';
      console.log(`  [Interpret] ❌ DB 연결 실패 (Mock 모드로 전환됨)`);
      insights.insights.push({
        finding: "DB 연결 실패",
        implication: "❌ DB 연결이 불가능하여 Mock 모드로 실행되었습니다. VPN/방화벽/권한 설정을 확인하세요.",
        action: "IT팀/DBA에 연결 상태 점검 요청",
      });
      return insights;
    }

    // State 2: ⚠️ Success but No Data
    if (resultsWithData.length === 0 && successResults.length > 0) {
      insights.state = 'success_no_data';
      console.log(`  [Interpret] ⚠️ DB 연결 성공, 쿼리 실행 완료 - 조건에 맞는 데이터 없음 (0 rows)`);
      insights.insights.push({
        finding: "데이터 없음 (조건 불일치)",
        implication: "✅ DB 연결 및 쿼리 실행은 성공했으나, 조건에 맞는 데이터가 없습니다 (0 rows 반환).",
        action: "WHERE 조건 완화 또는 데이터 존재 여부 확인 필요",
      });
      // 빈 결과도 분석 완료로 간주 (Mock 모드 아님)
      insights.dataAvailable = false;
      return insights;
    }

    // State 3: ✅ Success with Data
    insights.state = 'success_with_data';

    insights.dataAvailable = true;
    console.log(`  [Interpret] 📊 ${resultsWithData.length}개 쿼리 결과 분석 중...`);

    // Step 1: 코드 레벨 통계 계산
    const codeStats = this._calculateCodeLevelStats(resultsWithData);
    insights.patterns = codeStats.patterns;
    insights.insights = codeStats.insights;

    // 총 데이터 행 수에 따른 권장사항
    const totalRows = resultsWithData.reduce((sum, r) => sum + r.rowCount, 0);
    if (totalRows > 10000) {
      insights.recommendations.push({
        priority: "HIGH",
        action: "대용량 데이터 페이징 처리 필요",
        expectedImpact: "성능 향상 및 UI 응답성 개선",
      });
    }

    // Step 2: LLM 기반 비즈니스 인사이트 생성 (Option C 핵심)
    console.log(`  [Interpret] 🤖 LLM 비즈니스 인사이트 생성 중...`);
    try {
      insights.llmInsights = await this._generateLLMInsights(resultsWithData, requirements, codeStats);
      console.log(`  [Interpret] ✅ LLM 인사이트 생성 완료`);
    } catch (llmError) {
      console.warn(`  [Interpret] ⚠️ LLM 인사이트 생성 실패: ${llmError.message}`);
      insights.llmInsights = { error: llmError.message };
    }

    console.log(`  [Interpret] ✅ 인사이트 ${insights.insights.length}개, 패턴 ${insights.patterns.length}개, 권장사항 ${insights.recommendations.length}개`);

    return insights;
  }

  /**
   * [New v4.3.4] 코드 레벨 통계 계산
   */
  _calculateCodeLevelStats(resultsWithData) {
    const patterns = [];
    const insights = [];

    for (const result of resultsWithData) {
      if (result.data.length > 0) {
        const sampleRow = result.data[0];
        const columns = Object.keys(sampleRow);

        patterns.push({
          name: result.name,
          description: `${result.rowCount}행 반환, 컬럼: ${columns.slice(0, 5).join(', ')}${columns.length > 5 ? '...' : ''}`,
          significance: result.rowCount > 100 ? "high" : "medium",
        });

        // 숫자형 컬럼 통계
        for (const col of columns) {
          const values = result.data.map(row => {
            const v = row[col];
            return typeof v === 'number' ? v : (typeof v === 'string' ? parseFloat(v) : NaN);
          }).filter(v => !isNaN(v));

          if (values.length > 0) {
            const sum = values.reduce((a, b) => a + b, 0);
            const avg = sum / values.length;
            const max = Math.max(...values);
            const min = Math.min(...values);

            insights.push({
              finding: `${result.name}.${col}`,
              implication: `총합: ${sum.toLocaleString()}, 평균: ${avg.toFixed(2)}, 최대: ${max.toLocaleString()}, 최소: ${min.toLocaleString()}, 건수: ${values.length}`,
              stats: { sum, avg, max, min, count: values.length }
            });
          }
        }
      }
    }

    return { patterns, insights };
  }

  /**
   * [New v4.3.4] LLM 기반 비즈니스 인사이트 생성 (Option C 핵심)
   */
  async _generateLLMInsights(resultsWithData, requirements, codeStats) {
    // 데이터 요약 생성 (LLM 컨텍스트용, 최대 20행씩)
    const dataSummary = resultsWithData.map(r => ({
      queryName: r.name,
      sql: r.sql,
      rowCount: r.rowCount,
      sampleData: r.data.slice(0, 20),
    }));

    const systemPrompt = `당신은 데이터 분석 전문가입니다.
쿼리 결과를 바탕으로 비즈니스 인사이트를 도출하세요.

응답 형식 (JSON):
{
  "executiveSummary": "경영진 요약 (2-3문장)",
  "keyFindings": [
    { "finding": "발견사항", "businessImpact": "비즈니스 영향", "actionable": true/false }
  ],
  "trends": [
    { "metric": "지표명", "direction": "증가/감소/유지", "magnitude": "퍼센트" }
  ],
  "recommendations": [
    { "priority": "HIGH/MEDIUM/LOW", "action": "권장 조치", "expectedROI": "예상 효과" }
  ],
  "dataQuality": {
    "completeness": 0-100,
    "concerns": ["우려사항"]
  }
}`;

    const userMessage = `## 분석 목적
${requirements.objective || '(명시되지 않음)'}

## 쿼리 결과 요약
${JSON.stringify(dataSummary, null, 2)}

## 코드 레벨 통계
${JSON.stringify(codeStats, null, 2)}

위 데이터를 기반으로 비즈니스 인사이트를 도출하세요.`;

    const response = await this._sendMessage(systemPrompt, userMessage);

    // JSON 파싱
    try {
      const jsonMatch = response.content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      return JSON.parse(response.content);
    } catch {
      return {
        executiveSummary: response.content.substring(0, 500),
        parseError: true
      };
    }
  }

  async generateOutputs(queries, results, insights, prd) {
    const outputs = [];
    const resultsDir = path.join(this.outputDir, "results");
    if (!fs.existsSync(resultsDir))
      fs.mkdirSync(resultsDir, { recursive: true });

    // ✅ [Fix] 쿼리 파일 생성 로직 보강
    for (const query of queries) {
      if (!query.sql) continue;

      const safeName = (query.name || "query").replace(/[^a-z0-9_-]/gi, "_");
      const filename = `${safeName}.sql`;
      const filepath = path.join(resultsDir, filename);

      fs.writeFileSync(filepath, query.sql, "utf-8");
      outputs.push({ type: "SQL_QUERY", path: filepath, name: query.name });
      console.log(`    - results/${filename}`);
    }

    // [Fix v4.3.3] 풍부한 리포트 생성
    const reportPath = path.join(this.outputDir, "analysis_report.md");
    let reportContent = `# Analysis Report\n\n`;
    reportContent += `**생성 시각**: ${new Date().toISOString()}\n`;
    reportContent += `**Task**: ${prd.objective || "(Objective)"}\n\n`;

    // 쿼리 실행 요약
    reportContent += `## 1. 쿼리 실행 요약\n\n`;
    reportContent += `| 쿼리명 | 상태 | 반환 행 |\n`;
    reportContent += `|--------|------|--------|\n`;

    const totalRows = results.reduce((sum, r) => sum + (r.rowCount || 0), 0);
    const successCount = results.filter(r => r.success).length;

    for (const result of results) {
      const status = result.mock ? "⚠️ Mock" : (result.success ? "✅ 성공" : "❌ 실패");
      reportContent += `| ${result.name} | ${status} | ${result.rowCount || 0} |\n`;
    }

    reportContent += `\n**총 ${results.length}개 쿼리 중 ${successCount}개 성공, 총 ${totalRows}행 반환**\n\n`;

    // 인사이트 섹션
    if (insights) {
      reportContent += `## 2. 발견된 인사이트\n\n`;

      if (insights.insights && insights.insights.length > 0) {
        for (const insight of insights.insights) {
          reportContent += `### ${insight.finding}\n`;
          reportContent += `${insight.implication}\n\n`;
        }
      } else {
        reportContent += `(인사이트 없음 - 데이터 분석 결과가 없거나 Mock 모드로 실행됨)\n\n`;
      }

      // 패턴 섹션
      if (insights.patterns && insights.patterns.length > 0) {
        reportContent += `## 3. 식별된 패턴\n\n`;
        for (const pattern of insights.patterns) {
          reportContent += `- **${pattern.name}** (${pattern.significance}): ${pattern.description}\n`;
        }
        reportContent += `\n`;
      }

      // 권장사항 섹션
      if (insights.recommendations && insights.recommendations.length > 0) {
        reportContent += `## 4. 권장사항\n\n`;
        for (const rec of insights.recommendations) {
          reportContent += `- [${rec.priority}] **${rec.action}**: ${rec.expectedImpact}\n`;
        }
        reportContent += `\n`;
      }
    }

    // [Hotfix] 3-Way State 기반 주의사항 메시지
    const hasMock = results.some(r => r.mock);
    const hasRealSuccess = results.some(r => r.success && !r.mock);
    const hasData = results.some(r => r.rowCount > 0);

    if (hasMock && !hasRealSuccess) {
      // State 1: ❌ Connection Failure
      reportContent += `## ❌ DB 연결 실패\n\n`;
      reportContent += `이 리포트는 **Mock 모드**로 생성되었습니다. DB 연결이 불가능했습니다.\n\n`;
      reportContent += `**확인 사항:**\n`;
      reportContent += `- DB 연결 정보 (host, port, user, password)\n`;
      reportContent += `- VPN/방화벽 설정\n`;
      reportContent += `- mysql2 패키지 설치: \`npm install mysql2\`\n`;
      reportContent += `\n**조치:** IT팀/DBA에 연결 상태 점검을 요청하세요.\n`;
    } else if (hasRealSuccess && !hasData) {
      // State 2: ⚠️ Success but No Data
      reportContent += `## ⚠️ 데이터 없음\n\n`;
      reportContent += `✅ **DB 연결 및 쿼리 실행은 성공**했으나, 조건에 맞는 데이터가 없습니다 (0 rows).\n\n`;
      reportContent += `**가능한 원인:**\n`;
      reportContent += `- WHERE 조건이 너무 엄격함\n`;
      reportContent += `- 해당 테이블에 실제 데이터가 없음\n`;
      reportContent += `- 조회 권한은 있으나 데이터 접근 제한\n`;
      reportContent += `\n**조치:** 쿼리 조건을 완화하거나 데이터 존재 여부를 확인하세요.\n`;
    }
    // State 3: ✅ Success with Data - 별도 메시지 불필요

    fs.writeFileSync(reportPath, reportContent, "utf-8");
    outputs.push({ type: "REPORT", path: reportPath });
    console.log(`    - analysis_report.md (${reportContent.length} bytes)`);

    return outputs;
  }

  /**
   * Reviewer Skill을 사용한 쿼리 결과 검증 (v1.0.3)
   * AGENT_ARCHITECTURE v2.6.2: Query Skill 직후 Reviewer Skill 검증
   *
   * @param {Array} queryResults - 쿼리 실행 결과
   * @param {Object} prd - PRD 객체
   * @param {Object} requirements - 분석 요구사항
   * @returns {Object} 검증 결과 { passed, score, summary, issues }
   */
  async _validateQueryResults(queryResults, prd, requirements) {
    try {
      // ReviewerSkill 초기화
      const reviewer = new ReviewerSkill({
        projectRoot: this.projectRoot,
      });
      await reviewer.initialize();

      // 쿼리 결과를 ReviewerSkill 입력 형식으로 변환
      const outputs = {
        queryResults: queryResults.map((r) => ({
          name: r.name,
          sql: r.sql,
          rowCount: r.rowCount || 0,
          success: r.success,
          mock: r.mock || false,
          error: r.error,
        })),
        totalRows: queryResults.reduce((sum, r) => sum + (r.rowCount || 0), 0),
        successRate: queryResults.length > 0
          ? queryResults.filter((r) => r.success).length / queryResults.length
          : 0,
      };

      // PRD 정보 구성
      const prdInfo = {
        objective: prd.objective || requirements?.objective || "",
        requirements: prd.requirements || [],
        constraints: requirements?.constraints || ["SELECT only"],
      };

      // ReviewerSkill 검증 호출 (query_results 스코프)
      const reviewResult = await reviewer.validate({
        prd: prdInfo,
        outputs: outputs,
        validationScope: ["syntax", "semantic", "prd_match"],
      });

      // 쿼리 결과 특화 검증 추가
      const customChecks = this._performQuerySpecificChecks(queryResults, prd);

      // 최종 점수 계산 (ReviewerSkill 70% + 커스텀 체크 30%)
      const finalScore = Math.round(
        (reviewResult.score || 0) * 0.7 + customChecks.score * 0.3
      );

      const passed = finalScore >= 80 && customChecks.criticalIssues === 0;

      return {
        passed,
        score: finalScore,
        summary: passed
          ? "쿼리 결과 검증 통과"
          : `검증 실패: ${reviewResult.issues?.length || 0}개 이슈, ${customChecks.criticalIssues}개 치명적 오류`,
        details: reviewResult.details || {},
        issues: [...(reviewResult.issues || []), ...customChecks.issues],
        customChecks,
      };
    } catch (error) {
      console.warn(`  [Reviewer] 검증 중 오류: ${error.message}`);

      // Fallback: 기본 검증 (ReviewerSkill 실패 시)
      return this._fallbackValidation(queryResults, prd);
    }
  }

  /**
   * 쿼리 결과 특화 검증 (Reviewer Skill 보완)
   */
  _performQuerySpecificChecks(queryResults, prd) {
    const issues = [];
    let score = 100;
    let criticalIssues = 0;

    // 1. 전체 쿼리 실패 검사
    const allFailed = queryResults.every((r) => !r.success);
    if (allFailed && queryResults.length > 0) {
      issues.push({
        severity: "HIGH",
        category: "query_execution",
        description: "모든 쿼리가 실패했습니다",
        recommendation: "SQL 문법 및 테이블명을 확인하세요",
      });
      score -= 50;
      criticalIssues++;
    }

    // 2. 데이터 없음 검사 (Mock 제외)
    const realQueries = queryResults.filter((r) => !r.mock);
    const emptyResults = realQueries.filter((r) => r.success && r.rowCount === 0);
    if (emptyResults.length > 0 && emptyResults.length === realQueries.length) {
      issues.push({
        severity: "MEDIUM",
        category: "data_quality",
        description: `${emptyResults.length}개 쿼리가 데이터 0건 반환`,
        recommendation: "WHERE 조건 및 기간 설정을 확인하세요",
      });
      score -= 20;
    }

    // 3. Mock 모드 경고
    const mockQueries = queryResults.filter((r) => r.mock);
    if (mockQueries.length > 0) {
      issues.push({
        severity: "LOW",
        category: "data_source",
        description: `${mockQueries.length}개 쿼리가 Mock 모드로 실행됨 (DB 연결 없음)`,
        recommendation: "실제 분석을 위해 DB 연결을 확인하세요",
      });
      score -= 10;
    }

    // 4. 쿼리 오류율 검사
    const errorQueries = queryResults.filter((r) => r.error);
    if (errorQueries.length > queryResults.length * 0.5) {
      issues.push({
        severity: "HIGH",
        category: "query_errors",
        description: `${errorQueries.length}/${queryResults.length} 쿼리에서 오류 발생`,
        recommendation: "SQL 쿼리 생성 로직을 검토하세요",
      });
      score -= 30;
      criticalIssues++;
    }

    return {
      score: Math.max(0, score),
      issues,
      criticalIssues,
    };
  }

  /**
   * Fallback 검증 (ReviewerSkill 사용 불가 시)
   */
  _fallbackValidation(queryResults, prd) {
    const successCount = queryResults.filter((r) => r.success).length;
    const totalRows = queryResults.reduce((sum, r) => sum + (r.rowCount || 0), 0);

    // 간단한 점수 계산
    let score = 50; // 기본 점수

    if (queryResults.length > 0) {
      score += (successCount / queryResults.length) * 30; // 성공률 30점
    }

    if (totalRows > 0) {
      score += 20; // 데이터 존재 시 20점
    }

    const passed = score >= 80;

    return {
      passed,
      score: Math.round(score),
      summary: passed
        ? "Fallback 검증 통과"
        : `Fallback 검증 실패 (${successCount}/${queryResults.length} 성공, ${totalRows}행)`,
      issues: [],
      fallback: true,
    };
  }

  generateSummary(results, insights, prd) {
    return {
      totalQueries: results.length,
      successCount: results.filter((r) => r.success).length,
    };
  }
}

export default AnalysisAgent;
