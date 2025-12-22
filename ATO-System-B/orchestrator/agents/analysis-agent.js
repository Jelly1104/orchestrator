/**
 * AnalysisAgent - 데이터 분석 담당
 *
 * 역할:
 * - 정량적 PRD 처리: SQL 생성 → 실행 → 결과 수집
 * - 혼합 PRD의 Phase A: 데이터 분석 → 인사이트 도출
 *
 * @version 1.0.2
 * @since 2025-12-22 (Fix: JSON Normalization)
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { ProviderFactory } from "../providers/index.js";

// ========== 보안 상수 ==========
const SECURITY_LIMITS = {
  MAX_PRD_CONTENT_LENGTH: 50000,
  MAX_QUERY_LENGTH: 5000,
  MAX_RETRIES: 3,
  QUERY_TIMEOUT_MS: 60000,
};

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

    this.dbConfig = config.dbConfig || {
      host: "222.122.26.242",
      port: 3306,
      database: "medigate",
      user: "medigate",
      password:
        config.dbPassword || process.env.MEDIGATE_DB_PASSWORD || "apelWkd",
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

    return await Promise.race([apiCall(), timeoutPromise]);
  }

  // ========== 메인 분석 함수 ==========

  async analyze(prd, taskId = null) {
    console.log("\n[AnalysisAgent] ========== 분석 시작 ==========");

    if (taskId) {
      this.outputDir = path.join(
        this.projectRoot,
        "workspace",
        "analysis",
        taskId
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

      // Step 4: SQL 실행
      console.log("\n[Step 4] SQL 실행...");
      const queryResults = await this.executeQueries(queries);
      results.data = queryResults;

      const successCount = queryResults.filter((r) => r.success).length;
      console.log(`  - 성공: ${successCount}/${queryResults.length}`);

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
    const requirements = {
      objective: prd.objective || prd.목적 || "",
      tables: [],
      constraints: prd.constraints || ["SELECT only"],
      originalText: prd.originalText || prd,
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

  async generateQueries(requirements) {
    const systemPrompt = `당신은 SQL 전문가입니다. 
    반드시 JSON 포맷으로 응답하세요: { "queries": [{ "name": "...", "sql": "..." }] }
    한국어 설명 금지.`;

    const userMessage = `요구사항:\n${
      requirements.objective
    }\n\n테이블:\n${JSON.stringify(requirements.tables)}\n\nPRD원문:\n${
      requirements.originalText
    }`;

    const response = await this._sendMessage(systemPrompt, userMessage);
    return this._parseQueriesFromResponse(response.content);
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
    for (const query of queries) {
      // ✅ [Fix] query.name이 undefined일 경우 대비
      const queryName = query.name || "unnamed_query";
      console.log(`  - 실행 중: ${queryName}`);

      results.push({
        name: queryName,
        sql: query.sql,
        data: [], // Mock Data
        rowCount: 0,
        success: true,
      });
    }
    return results;
  }

  async interpretResults(results, requirements) {
    return { patterns: [], insights: [], recommendations: [] };
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

    // 리포트 생성
    const reportPath = path.join(this.outputDir, "analysis_report.md");
    fs.writeFileSync(
      reportPath,
      `# Analysis Report\n\nTask: ${prd.objective || "N/A"}`,
      "utf-8"
    );
    outputs.push({ type: "REPORT", path: reportPath });
    console.log(`    - analysis_report.md`);

    return outputs;
  }

  generateSummary(results, insights, prd) {
    return {
      totalQueries: results.length,
      successCount: results.filter((r) => r.success).length,
    };
  }
}

export default AnalysisAgent;
