/**
 * Output Validator (자체 검증 모듈) v1.2.0
 *
 * Native Agent 산출물 생성 후 검증 수행:
 * 1. Syntax/Lint 검증 (SQL, Markdown 등)
 * 2. PRD 체크리스트 매칭 검증
 * 3. 스키마 정합성 검증 (DOMAIN_SCHEMA.md 기반)
 * 4. 설계 문서 품질 검증 (IA, Wireframe, SDD) - v1.1.0 추가
 * 5. Score 기반 PASS/FAIL 판정 (80점 기준) - v1.2.0 추가
 *
 * @version 1.2.0
 */

import fs from 'fs';
import path from 'path';

// 스키마에서 추출한 알려진 테이블/컬럼
const KNOWN_SCHEMA = {
  tables: {
    USERS: {
      columns: ['U_ID', 'U_EMAIL', 'U_NAME', 'U_KIND', 'U_ALIVE', 'U_REG_DATE'],
      primaryKey: 'U_ID'
    },
    USER_DETAIL: {
      columns: ['U_ID', 'U_MAJOR_CODE_1', 'U_MAJOR_CODE_2', 'U_WORK_TYPE_1', 'U_WORK_TYPE_2', 'U_HOSPITAL_NAME', 'U_LOCATION_CODE'],
      primaryKey: 'U_ID'
    },
    USER_LOGIN: {
      columns: ['U_ID', 'LOGIN_DATE', 'LOGIN_IP'],
      primaryKey: null,
      warning: '🚨 Extreme - 최근 3개월만 조회 권장'
    },
    COMMENT: {
      columns: ['COMMENT_IDX', 'BOARD_IDX', 'SVC_CODE', 'U_ID', 'CONTENT', 'PARENT_IDX', 'REG_DATE'],
      primaryKey: 'COMMENT_IDX',
      warning: '🚨 Extreme - BOARD_IDX로 조회 필수'
    },
    BOARD_MUZZIMA: {
      columns: ['BOARD_IDX', 'CTG_CODE', 'U_ID', 'TITLE', 'CONTENT', 'READ_CNT', 'AGREE_CNT', 'REG_DATE'],
      primaryKey: 'BOARD_IDX',
      warning: '🔴 High - TEXT 타입 주의'
    },
    CODE_MASTER: {
      columns: ['CODE_TYPE', 'CODE_VALUE', 'CODE_NAME', 'CODE_ORDER', 'USE_FLAG'],
      primaryKey: null
    },
    CODE_LOC: {
      columns: ['ZIP_CODE', 'SIDO', 'SIGUNGU', 'DONG', 'FULL_ADDR'],
      primaryKey: 'ZIP_CODE'
    }
  },
  // 허용된 JOIN 패턴
  allowedJoinPatterns: [
    ['BOARD_*', 'USERS'],
    ['COMMENT', 'USERS'],
    ['CBIZ_REC*', 'USERS'],
    ['USERS', 'USER_DETAIL']
  ],
  // 금지된 JOIN 패턴
  forbiddenJoinPatterns: [
    ['USERS', 'USER_LOGIN', 'COMMENT'],
    ['USERS', 'USER_DETAIL', 'USER_CI'],
    ['USERS', 'POINT_GRANT', 'CBIZ_*']
  ]
};

export class OutputValidator {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
  }

  /**
   * 전체 검증 실행
   * v1.2.0: Score 기반 PASS/FAIL 판정 (80점 기준)
   * @param {Object} outputs - 산출물 목록 { name, type, content }[]
   * @param {Object} prdAnalysis - PRD 분석 결과 (Gap Check)
   * @returns {Object} - 검증 결과
   */
  validate(outputs, prdAnalysis) {
    const results = {
      passed: true,
      score: 100,              // v1.2.0: 총 Score (100점 만점)
      timestamp: new Date().toISOString(),
      summary: {
        total: outputs.length,
        syntaxPassed: 0,
        prdMatched: 0,
        schemaValid: 0,
        designDocs: {
          total: 0,
          passed: 0,
          avgScore: 0
        }
      },
      scoreBreakdown: {        // v1.2.0: Score 세부 내역
        syntax: 25,            // 25점 만점
        schema: 25,            // 25점 만점
        prdMatch: 30,          // 30점 만점
        security: 20           // 20점 만점
      },
      details: [],
      errors: [],
      warnings: [],
      designDocResults: []
    };

    // 1. 각 산출물별 검증
    outputs.forEach((output, index) => {
      const detail = {
        index: index + 1,
        name: output.name,
        type: output.type,
        checks: {
          syntax: null,
          prdMatch: null,
          schema: null
        }
      };

      // Syntax 검증
      const syntaxResult = this.checkSyntax(output);
      detail.checks.syntax = syntaxResult;
      if (syntaxResult.passed) results.summary.syntaxPassed++;
      if (!syntaxResult.passed) {
        results.errors.push(...syntaxResult.errors.map(e => ({
          output: output.name,
          type: 'SYNTAX',
          message: e
        })));
      }

      // 설계 문서 검증 결과 집계 (v1.1.0)
      if (syntaxResult.designDoc) {
        results.summary.designDocs.total++;
        if (syntaxResult.designDoc.passed) {
          results.summary.designDocs.passed++;
        }
        results.designDocResults.push({
          name: output.name,
          docType: syntaxResult.designDoc.docType,
          passed: syntaxResult.designDoc.passed,
          score: syntaxResult.designDoc.score,
          checklist: syntaxResult.designDoc.checklist
        });
      }

      // 스키마 정합성 검증 (SQL인 경우)
      if (output.type === 'SQL' || output.type === 'sql') {
        const schemaResult = this.checkSchemaValidity(output.content);
        detail.checks.schema = schemaResult;
        if (schemaResult.passed) results.summary.schemaValid++;
        if (!schemaResult.passed) {
          results.errors.push(...schemaResult.errors.map(e => ({
            output: output.name,
            type: 'SCHEMA',
            message: e
          })));
        }
        if (schemaResult.warnings.length > 0) {
          results.warnings.push(...schemaResult.warnings.map(w => ({
            output: output.name,
            type: 'SCHEMA_WARNING',
            message: w
          })));
        }
      }

      results.details.push(detail);
    });

    // 2. PRD 체크리스트 매칭 검증
    if (prdAnalysis && prdAnalysis.deliverables) {
      const matchResult = this.checkPRDMatch(outputs, prdAnalysis.deliverables);
      results.prdMatch = matchResult;
      results.summary.prdMatched = matchResult.matched;

      if (!matchResult.passed) {
        results.errors.push(...matchResult.missing.map(m => ({
          output: null,
          type: 'PRD_MISMATCH',
          message: `PRD 체크리스트 항목 누락: "${m}"`
        })));
      }
    }

    // 설계 문서 평균 점수 계산 (v1.1.0)
    if (results.designDocResults.length > 0) {
      const totalScore = results.designDocResults.reduce((sum, doc) => sum + (doc.score || 0), 0);
      results.summary.designDocs.avgScore = Math.round(totalScore / results.designDocResults.length);
    }

    // ========== v1.2.0: Score 기반 판정 (80점 기준) ==========
    // Syntax 점수 계산 (25점 만점)
    const syntaxRate = results.summary.total > 0
      ? results.summary.syntaxPassed / results.summary.total
      : 1;
    results.scoreBreakdown.syntax = Math.round(25 * syntaxRate);

    // Schema 점수 계산 (25점 만점)
    const schemaOutputs = results.details.filter(d => d.checks.schema);
    const schemaRate = schemaOutputs.length > 0
      ? schemaOutputs.filter(d => d.checks.schema?.passed).length / schemaOutputs.length
      : 1;
    results.scoreBreakdown.schema = Math.round(25 * schemaRate);

    // PRD 체크리스트 매칭 점수 계산 (30점 만점)
    if (results.prdMatch) {
      const prdRate = results.prdMatch.total > 0
        ? results.prdMatch.matched / results.prdMatch.total
        : 1;
      results.scoreBreakdown.prdMatch = Math.round(30 * prdRate);
    }

    // 보안 점수 계산 (20점 만점)
    // 보안 에러가 있으면 감점
    const securityErrors = results.errors.filter(e =>
      e.message?.includes('INSERT') ||
      e.message?.includes('UPDATE') ||
      e.message?.includes('DELETE') ||
      e.message?.includes('DROP')
    );
    results.scoreBreakdown.security = securityErrors.length === 0 ? 20 : 0;

    // 총 Score 계산
    results.score = results.scoreBreakdown.syntax +
                    results.scoreBreakdown.schema +
                    results.scoreBreakdown.prdMatch +
                    results.scoreBreakdown.security;

    // 최종 판정 (80점 기준)
    const hasDesignDocs = results.summary.designDocs.total > 0;
    if (hasDesignDocs) {
      // 설계 문서 모드: 평균 점수 70점 이상 + 총 Score 80점 이상
      results.passed = results.summary.designDocs.avgScore >= 70 && results.score >= 80;
    } else {
      // 코드 모드: 총 Score 80점 이상
      results.passed = results.score >= 80;
    }

    return results;
  }

  /**
   * Syntax/Lint 검증
   */
  checkSyntax(output) {
    const result = {
      passed: true,
      errors: [],
      warnings: [],
      designDoc: null  // 설계 문서 검증 결과 (v1.1.0)
    };

    const content = output.content || '';

    if (output.type === 'SQL' || output.type === 'sql') {
      // SQL 기본 검증
      const sqlChecks = this.validateSQL(content);
      result.errors.push(...sqlChecks.errors);
      result.warnings.push(...sqlChecks.warnings);
    } else if (output.type === 'Markdown' || output.type === 'markdown') {
      // Markdown 기본 검증
      const mdChecks = this.validateMarkdown(content);
      result.errors.push(...mdChecks.errors);
      result.warnings.push(...mdChecks.warnings);

      // 설계 문서 품질 검증 (v1.1.0)
      const designDocType = this.detectDesignDocType(output.name || '', content);
      if (designDocType) {
        const designResult = this.validateDesignDocument(output);
        result.designDoc = designResult;
        result.errors.push(...designResult.errors);
        result.warnings.push(...designResult.warnings);
      }
    }

    result.passed = result.errors.length === 0;
    return result;
  }

  /**
   * SQL 문법 검증
   */
  validateSQL(sql) {
    const errors = [];
    const warnings = [];

    // 빈 쿼리 체크
    if (!sql || sql.trim().length === 0) {
      errors.push('SQL 쿼리가 비어있습니다');
      return { errors, warnings };
    }

    // INSERT/UPDATE/DELETE 금지
    const dangerousPatterns = [
      { pattern: /\bINSERT\s+INTO\b/i, message: 'INSERT 문 사용 금지' },
      { pattern: /\bUPDATE\s+\w+\s+SET\b/i, message: 'UPDATE 문 사용 금지' },
      { pattern: /\bDELETE\s+FROM\b/i, message: 'DELETE 문 사용 금지' },
      { pattern: /\bDROP\s+(TABLE|DATABASE)\b/i, message: 'DROP 문 사용 금지' },
      { pattern: /\bTRUNCATE\b/i, message: 'TRUNCATE 문 사용 금지' },
      { pattern: /\bALTER\s+TABLE\b/i, message: 'ALTER TABLE 문 사용 금지' }
    ];

    dangerousPatterns.forEach(({ pattern, message }) => {
      if (pattern.test(sql)) {
        errors.push(message);
      }
    });

    // SELECT * 경고
    if (/\bSELECT\s+\*/i.test(sql)) {
      warnings.push('SELECT * 대신 필요한 컬럼만 명시하세요');
    }

    // LIMIT 없는 대용량 테이블 쿼리 경고
    const largeTablePattern = /\bFROM\s+(USER_LOGIN|COMMENT|BOARD_MUZZIMA)\b/i;
    if (largeTablePattern.test(sql) && !/\bLIMIT\b/i.test(sql)) {
      warnings.push('대용량 테이블 쿼리에 LIMIT 절 추가를 권장합니다');
    }

    // 세미콜론 누락 경고
    if (!sql.trim().endsWith(';')) {
      warnings.push('SQL 문 끝에 세미콜론(;)이 없습니다');
    }

    return { errors, warnings };
  }

  /**
   * Markdown 문법 검증
   */
  validateMarkdown(md) {
    const errors = [];
    const warnings = [];

    if (!md || md.trim().length === 0) {
      errors.push('Markdown 콘텐츠가 비어있습니다');
      return { errors, warnings };
    }

    // 제목(#) 없음 경고
    if (!/^#/m.test(md)) {
      warnings.push('문서에 제목(#)이 없습니다');
    }

    // 깨진 링크 패턴 체크
    const brokenLinkPattern = /\[([^\]]+)\]\(\s*\)/g;
    if (brokenLinkPattern.test(md)) {
      warnings.push('빈 링크가 포함되어 있습니다');
    }

    return { errors, warnings };
  }

  // ========== 설계 문서 품질 검증 (v1.1.0) ==========

  /**
   * 설계 문서 유형 감지
   * @param {string} fileName - 파일명
   * @param {string} content - 콘텐츠
   * @returns {string|null} - 'IA' | 'Wireframe' | 'SDD' | null
   */
  detectDesignDocType(fileName, content) {
    const nameLower = fileName.toLowerCase();
    const contentLower = content.toLowerCase();

    if (nameLower.includes('ia') || nameLower === 'ia.md') {
      return 'IA';
    }
    if (nameLower.includes('wireframe') || nameLower.includes('wf')) {
      return 'Wireframe';
    }
    if (nameLower.includes('sdd') || nameLower.includes('system design')) {
      return 'SDD';
    }

    // 콘텐츠 기반 감지
    if (contentLower.includes('information architecture') || contentLower.includes('정보 구조')) {
      return 'IA';
    }
    if (contentLower.includes('wireframe') || contentLower.includes('화면 설계') || contentLower.includes('┌')) {
      return 'Wireframe';
    }
    if (contentLower.includes('system design') || contentLower.includes('api 명세') || contentLower.includes('데이터 모델')) {
      return 'SDD';
    }

    return null;
  }

  /**
   * 설계 문서 품질 검증 통합
   * @param {Object} output - { name, type, content }
   * @returns {Object} - { passed, errors, warnings, score }
   */
  validateDesignDocument(output) {
    const docType = this.detectDesignDocType(output.name, output.content);

    if (!docType) {
      return {
        passed: true,
        docType: null,
        errors: [],
        warnings: ['설계 문서 유형을 감지할 수 없습니다'],
        score: 50
      };
    }

    switch (docType) {
      case 'IA':
        return this.validateIA(output.content);
      case 'Wireframe':
        return this.validateWireframe(output.content);
      case 'SDD':
        return this.validateSDD(output.content);
      default:
        return { passed: true, docType, errors: [], warnings: [], score: 100 };
    }
  }

  /**
   * IA (Information Architecture) 문서 검증
   * 검증 항목:
   * - 계층 구조 존재
   * - 네비게이션 정의
   * - 데이터 소스 명시
   */
  validateIA(content) {
    const result = {
      passed: true,
      docType: 'IA',
      errors: [],
      warnings: [],
      score: 100,
      checklist: {
        hasHierarchy: false,
        hasNavigation: false,
        hasDataSource: false,
        hasRouting: false
      }
    };

    if (!content || content.trim().length < 100) {
      result.errors.push('IA 문서가 너무 짧습니다 (최소 100자 이상)');
      result.score -= 50;
    }

    // 계층 구조 체크 (헤딩 레벨 또는 들여쓰기)
    const hasHeadingHierarchy = /^#{1,4}\s/m.test(content);
    const hasIndentHierarchy = /^\s{2,}-/m.test(content) || /└|├|│/m.test(content);
    result.checklist.hasHierarchy = hasHeadingHierarchy || hasIndentHierarchy;
    if (!result.checklist.hasHierarchy) {
      result.warnings.push('계층 구조가 명확하지 않습니다');
      result.score -= 10;
    }

    // 네비게이션 정의 체크
    const navKeywords = ['navigation', '네비게이션', '메뉴', 'gnb', 'lnb', '탭', 'tab', '사이드바'];
    result.checklist.hasNavigation = navKeywords.some(kw => content.toLowerCase().includes(kw));
    if (!result.checklist.hasNavigation) {
      result.warnings.push('네비게이션 구조 정의가 없습니다');
      result.score -= 10;
    }

    // 데이터 소스 명시 체크
    const dataKeywords = ['데이터', 'data', 'api', '테이블', 'table', '소스', 'source', 'db'];
    result.checklist.hasDataSource = dataKeywords.some(kw => content.toLowerCase().includes(kw));
    if (!result.checklist.hasDataSource) {
      result.warnings.push('데이터 소스 명시가 없습니다');
      result.score -= 10;
    }

    // 라우팅/URL 패턴 체크
    const routingPatterns = ['/api/', '/page/', 'route', '경로', 'url', 'endpoint'];
    result.checklist.hasRouting = routingPatterns.some(kw => content.toLowerCase().includes(kw));

    result.passed = result.errors.length === 0;
    return result;
  }

  /**
   * Wireframe 문서 검증
   * 검증 항목:
   * - ASCII 또는 컴포넌트 설명 존재
   * - 인터랙션 정의
   * - 데이터 바인딩 명시
   */
  validateWireframe(content) {
    const result = {
      passed: true,
      docType: 'Wireframe',
      errors: [],
      warnings: [],
      score: 100,
      checklist: {
        hasVisual: false,
        hasComponents: false,
        hasInteraction: false,
        hasDataBinding: false
      }
    };

    if (!content || content.trim().length < 200) {
      result.errors.push('Wireframe 문서가 너무 짧습니다 (최소 200자 이상)');
      result.score -= 50;
    }

    // 시각적 요소 체크 (ASCII art 또는 컴포넌트 설명)
    const hasAsciiArt = /[┌┐└┘├┤┬┴┼│─]/.test(content) || /\[.*\].*\[.*\]/m.test(content);
    const hasComponentDesc = /컴포넌트|component|button|input|card|list|form/i.test(content);
    result.checklist.hasVisual = hasAsciiArt || hasComponentDesc;
    if (!result.checklist.hasVisual) {
      result.errors.push('화면 시각화(ASCII) 또는 컴포넌트 설명이 없습니다');
      result.score -= 30;
    }

    // 컴포넌트 설명 체크
    const componentKeywords = ['헤더', 'header', '푸터', 'footer', '버튼', 'button', '입력', 'input', '카드', 'card', '리스트', 'list'];
    result.checklist.hasComponents = componentKeywords.filter(kw => content.toLowerCase().includes(kw)).length >= 2;
    if (!result.checklist.hasComponents) {
      result.warnings.push('컴포넌트 설명이 부족합니다 (최소 2개 이상)');
      result.score -= 10;
    }

    // 인터랙션 정의 체크
    const interactionKeywords = ['클릭', 'click', '탭', 'tap', '스크롤', 'scroll', '인터랙션', 'interaction', '액션', 'action', 'hover', '이동', 'navigate'];
    result.checklist.hasInteraction = interactionKeywords.some(kw => content.toLowerCase().includes(kw));
    if (!result.checklist.hasInteraction) {
      result.warnings.push('인터랙션(사용자 액션) 정의가 없습니다');
      result.score -= 10;
    }

    // 데이터 바인딩 체크
    const bindingKeywords = ['바인딩', 'binding', '필드', 'field', 'props', '데이터', 'api response', '연결'];
    result.checklist.hasDataBinding = bindingKeywords.some(kw => content.toLowerCase().includes(kw));
    if (!result.checklist.hasDataBinding) {
      result.warnings.push('데이터 바인딩 정의가 없습니다');
      result.score -= 10;
    }

    result.passed = result.errors.length === 0;
    return result;
  }

  /**
   * SDD (System Design Document) 검증
   * 검증 항목:
   * - API 명세 존재
   * - 데이터 모델 정의
   * - 비기능 요구사항 (성능/보안)
   */
  validateSDD(content) {
    const result = {
      passed: true,
      docType: 'SDD',
      errors: [],
      warnings: [],
      score: 100,
      checklist: {
        hasAPISpec: false,
        hasDataModel: false,
        hasErrorHandling: false,
        hasNonFunctional: false
      }
    };

    if (!content || content.trim().length < 300) {
      result.errors.push('SDD 문서가 너무 짧습니다 (최소 300자 이상)');
      result.score -= 50;
    }

    // API 명세 체크
    const apiKeywords = ['api', 'endpoint', 'get', 'post', 'put', 'delete', 'request', 'response', 'http'];
    result.checklist.hasAPISpec = apiKeywords.filter(kw => content.toLowerCase().includes(kw)).length >= 2;
    if (!result.checklist.hasAPISpec) {
      result.errors.push('API 명세가 없습니다');
      result.score -= 25;
    }

    // 데이터 모델 체크
    const dataModelKeywords = ['데이터 모델', 'data model', '테이블', 'table', '스키마', 'schema', '컬럼', 'column', 'entity', '엔티티'];
    result.checklist.hasDataModel = dataModelKeywords.some(kw => content.toLowerCase().includes(kw));
    if (!result.checklist.hasDataModel) {
      result.warnings.push('데이터 모델 정의가 없습니다');
      result.score -= 15;
    }

    // 에러 처리 체크
    const errorKeywords = ['에러', 'error', '예외', 'exception', '실패', 'fail', '오류', 'status code', '400', '404', '500'];
    result.checklist.hasErrorHandling = errorKeywords.some(kw => content.toLowerCase().includes(kw));
    if (!result.checklist.hasErrorHandling) {
      result.warnings.push('에러 처리 명세가 없습니다');
      result.score -= 10;
    }

    // 비기능 요구사항 체크
    const nfrKeywords = ['성능', 'performance', '보안', 'security', '인증', 'auth', '캐싱', 'cache', '확장', 'scale', '모니터링', 'monitoring'];
    result.checklist.hasNonFunctional = nfrKeywords.some(kw => content.toLowerCase().includes(kw));
    if (!result.checklist.hasNonFunctional) {
      result.warnings.push('비기능 요구사항(성능/보안)이 없습니다');
      result.score -= 10;
    }

    result.passed = result.errors.length === 0;
    return result;
  }

  /**
   * 스키마 정합성 검증
   */
  checkSchemaValidity(sql) {
    const result = {
      passed: true,
      errors: [],
      warnings: [],
      tablesUsed: [],
      columnsUsed: [],
      cteNames: []
    };

    if (!sql) return result;

    // CTE(WITH절) 이름 추출 (테이블로 오인 방지)
    const ctePattern = /\bWITH\s+([A-Z][A-Z_0-9]+)\s+AS\s*\(/gi;
    let cteMatch;
    while ((cteMatch = ctePattern.exec(sql)) !== null) {
      result.cteNames.push(cteMatch[1].toUpperCase());
    }

    // 테이블명 추출
    const tablePattern = /\b(FROM|JOIN)\s+(`)?([A-Z][A-Z_0-9]+)(`)?/gi;
    let match;
    while ((match = tablePattern.exec(sql)) !== null) {
      const tableName = match[3].toUpperCase();
      // CTE 이름은 제외
      if (!result.tablesUsed.includes(tableName) && !result.cteNames.includes(tableName)) {
        result.tablesUsed.push(tableName);
      }
    }

    // 알려지지 않은 테이블 체크 (CTE 제외)
    result.tablesUsed.forEach(table => {
      // CTE 이름이면 스킵
      if (result.cteNames.includes(table)) return;

      if (!KNOWN_SCHEMA.tables[table]) {
        // 와일드카드 패턴 테이블 허용 (BOARD_*, CBIZ_REC* 등)
        const isWildcardMatch = ['BOARD_', 'CBIZ_REC', 'CBIZ_LEASE'].some(prefix =>
          table.startsWith(prefix)
        );
        if (!isWildcardMatch) {
          result.warnings.push(`알 수 없는 테이블: ${table} (DOMAIN_SCHEMA.md에 정의되지 않음)`);
        }
      }
    });

    // 알려진 테이블의 컬럼 검증
    const columnPattern = /\b([A-Z][A-Z_0-9]+)\.([A-Z][A-Z_0-9]+)\b/gi;
    while ((match = columnPattern.exec(sql)) !== null) {
      const table = match[1].toUpperCase();
      const column = match[2].toUpperCase();

      if (KNOWN_SCHEMA.tables[table]) {
        const tableInfo = KNOWN_SCHEMA.tables[table];
        if (!tableInfo.columns.includes(column)) {
          result.errors.push(`알 수 없는 컬럼: ${table}.${column}`);
        }
      }

      result.columnsUsed.push(`${table}.${column}`);
    }

    // 테이블 경고 메시지 추가
    result.tablesUsed.forEach(table => {
      if (KNOWN_SCHEMA.tables[table]?.warning) {
        result.warnings.push(`${table}: ${KNOWN_SCHEMA.tables[table].warning}`);
      }
    });

    // 금지된 JOIN 패턴 체크
    if (result.tablesUsed.length >= 3) {
      result.warnings.push(`3개 이상 테이블 JOIN 감지 (${result.tablesUsed.join(', ')}) - Leader Agent 승인 필요`);
    }

    result.passed = result.errors.length === 0;
    return result;
  }

  /**
   * PRD 체크리스트 매칭 검증 (개선: 콘텐츠 기반 다중 매칭)
   */
  checkPRDMatch(outputs, deliverables) {
    const result = {
      passed: true,
      total: deliverables.length,
      matched: 0,
      missing: [],
      mapping: []
    };

    // 모든 산출물의 콘텐츠를 합쳐서 전체 검색 풀 생성
    const contentPool = outputs.map(o => ({
      name: o.name,
      content: (o.content || '').toLowerCase(),
      type: o.type
    }));

    // 각 PRD 체크리스트 항목에 대해 매칭 시도
    deliverables.forEach(deliverable => {
      const item = deliverable.item;
      const type = deliverable.type;

      // 1단계: 파일명 직접 매칭
      let matchingOutput = contentPool.find(output =>
        output.name && this.fuzzyMatch(output.name, item)
      );

      // 2단계: 콘텐츠 내 키워드 매칭 (강화된 로직 v1.1.0)
      if (!matchingOutput) {
        matchingOutput = contentPool.find(output => {
          // 설계 문서(Markdown)는 타입 매칭 완화 - 키워드 매칭만으로 충분
          const isDesignDoc = output.type === 'Markdown' || output.name?.endsWith('.md');
          const typeMatch = isDesignDoc || this.matchDeliverableType(output.type, type);
          // 강화된 키워드 매칭: PRD 항목의 핵심 키워드 추출
          const keywordMatch = this.matchContentByItem(output.content, item, type);
          return typeMatch && keywordMatch;
        });
      }

      // 3단계: SQL 파일 내 개별 쿼리 블록 매칭
      if (!matchingOutput) {
        for (const output of contentPool) {
          if (output.type === 'SQL' || output.name?.endsWith('.sql')) {
            const queryBlocks = this.extractSQLBlocks(output.content);
            const matchedBlock = queryBlocks.find(block =>
              this.matchContentByItem(block.content, item, type)
            );
            if (matchedBlock) {
              matchingOutput = {
                name: `${output.name} (${matchedBlock.name || 'query'})`,
                content: matchedBlock.content,
                type: 'SQL'
              };
              break;
            }
          }
        }
      }

      if (matchingOutput) {
        result.matched++;
        result.mapping.push({
          prdItem: item,
          output: matchingOutput.name,
          matchType: 'MATCHED'
        });
      } else {
        result.missing.push(item);
        result.mapping.push({
          prdItem: item,
          output: null,
          matchType: 'MISSING'
        });
      }
    });

    result.passed = result.missing.length === 0;
    return result;
  }

  /**
   * SQL 파일에서 개별 쿼리 블록 추출
   */
  extractSQLBlocks(content) {
    const blocks = [];
    if (!content) return blocks;

    // 주석으로 구분된 쿼리 블록 추출
    // 패턴: -- 쿼리명 또는 /* 쿼리명 */ 다음에 오는 SQL
    const commentPattern = /(?:--\s*(.+?)$|\/\*\s*(.+?)\s*\*\/)\s*([\s\S]*?)(?=(?:--\s*\w|\/\*|\z))/gim;
    let match;

    while ((match = commentPattern.exec(content)) !== null) {
      const name = match[1] || match[2] || '';
      const sql = (match[3] || '').trim();
      if (sql) {
        blocks.push({ name: name.trim(), content: sql.toLowerCase() });
      }
    }

    // 패턴 매칭 실패 시 전체 콘텐츠를 하나의 블록으로
    if (blocks.length === 0) {
      blocks.push({ name: 'main', content: content.toLowerCase() });
    }

    return blocks;
  }

  /**
   * PRD 항목별 콘텐츠 매칭 (강화 로직 v1.1.0)
   */
  matchContentByItem(content, item, type) {
    if (!content || !item) return false;

    const itemLower = item.toLowerCase();
    const contentLower = content.toLowerCase();

    // PRD 항목별 키워드 매핑 (도메인 특화 - 확장)
    const itemKeywordMap = {
      // 기존 매핑
      '활성 회원 세그먼트': ['u_alive', 'active', '활성', 'segment'],
      '프로필-행동 조인': ['join', 'user_detail', 'profile', '프로필'],
      '전문과목별 분포': ['u_major_code', 'major', '전문과목', 'distribution', '분포'],
      '근무형태별 분포': ['u_work_type', 'work_type', '근무형태', 'distribution', '분포'],
      '프로파일 요약 리포트': ['report', 'summary', '요약', '리포트', 'profile'],
      'trigger 후보': ['trigger', 'use case', 'g1', '후보', 'proposal'],
      'sql': ['select', 'from', 'where', 'join'],
      'analysis': ['분석', 'analysis', 'insight', '비교'],
      'report': ['리포트', 'report', 'summary', '요약'],
      // 채용추천 Agent 관련 매핑 (v1.1.0)
      '추천': ['recommendation', 'recommend', 'match', '추천', '매칭', 'ranking'],
      '결과': ['result', 'response', '결과', 'output', 'list'],
      'ui': ['ui', 'screen', 'wireframe', '화면', 'frontend', '컴포넌트', 'card'],
      '점수': ['score', 'scoring', '점수', 'algorithm', '알고리즘', 'weight'],
      '산출': ['calculate', 'compute', '산출', 'engine', 'logic'],
      '로직': ['logic', 'algorithm', '로직', 'rule', 'formula'],
      '회원': ['user', 'member', '회원', 'u_id', 'profile'],
      '프로필': ['profile', 'user_detail', '프로필', 'preference', '선호'],
      '기반': ['based', '기반', 'using', 'from', 'source']
    };

    // 항목명에서 핵심 키워드 추출 (부분 매칭 포함)
    let targetKeywords = [];
    for (const [key, keywords] of Object.entries(itemKeywordMap)) {
      // 부분 매칭: 항목에 키가 포함되거나, 키에 항목 단어가 포함되면 매칭
      const keyLower = key.toLowerCase();
      if (itemLower.includes(keyLower) || keyLower.includes(itemLower.split(' ')[0])) {
        targetKeywords.push(...keywords);
      }
    }

    // 기본 키워드 추출 (공백/특수문자로 분리)
    const basicKeywords = itemLower
      .replace(/[()（）\[\]]/g, ' ')
      .split(/[\s\-_]+/)
      .filter(w => w.length > 1 && !['vs', 'the', 'and', 'for', 'a', 'an'].includes(w));

    targetKeywords = [...new Set([...targetKeywords, ...basicKeywords])];

    // 매칭 점수 계산 (v1.1.0: 가중치 적용)
    let matchScore = 0;
    let maxScore = targetKeywords.length;

    for (const kw of targetKeywords) {
      if (contentLower.includes(kw)) {
        matchScore += 1;
      }
      // 유사 키워드도 부분 매칭 (점수 0.5)
      else if (kw.length >= 3 && contentLower.includes(kw.substring(0, kw.length - 1))) {
        matchScore += 0.5;
      }
    }

    // 매칭률 30% 이상이면 매칭 (기존 50%에서 완화)
    const matchRate = maxScore > 0 ? matchScore / maxScore : 0;

    return matchRate >= 0.3;
  }

  /**
   * 퍼지 매칭 (유사도 기반)
   */
  fuzzyMatch(str1, str2) {
    // 정규화: 특수문자, 공백, 하이픈 제거 후 소문자로
    const normalize = s => s.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
    const n1 = normalize(str1);
    const n2 = normalize(str2);

    // 포함 관계 체크
    if (n1.includes(n2) || n2.includes(n1)) return true;

    // 핵심 키워드만 추출 (괄호 안 내용 제거, 조사/접미사 제거)
    const extractKeywords = s => {
      return s
        .replace(/\([^)]*\)/g, '') // 괄호 안 내용 제거
        .toLowerCase()
        .split(/[\s\-_]+/) // 공백, 하이픈, 언더스코어로 분리
        .filter(w => w.length > 1); // 1글자 제거
    };

    const words1 = extractKeywords(str1);
    const words2 = extractKeywords(str2);

    // 키워드 매칭 (40% 이상 일치하면 매칭 성공)
    const matchCount = words1.filter(w1 =>
      words2.some(w2 => w1.includes(w2) || w2.includes(w1))
    ).length;

    const threshold = Math.min(words1.length, words2.length) * 0.4;
    return matchCount >= threshold;
  }

  /**
   * 산출물 유형 매칭 (개선: 유연한 유형 매핑)
   */
  matchDeliverableType(outputType, prdType) {
    const typeMap = {
      'SQL': ['sql', 'query', 'sql_query', '쿼리', 'code'], // Code도 SQL 포함 가능
      'Markdown': ['markdown', 'report', 'document', '리포트', '문서'],
      'Analysis': ['analysis', 'insight', '분석', '인사이트', 'code', 'report'], // 분석은 코드나 리포트로 구현 가능
      'Report': ['report', 'summary', '요약', '리포트', 'code', 'markdown'],
      'Proposal': ['proposal', '제안', '후보', 'code', 'report', 'analysis'],
      'Code': ['code', 'typescript', 'javascript', 'ts', 'js'],
      'Table': ['table', 'data', '테이블', '데이터']
    };

    const normalizedOutput = (outputType || '').toLowerCase();
    const normalizedPrd = (prdType || '').toLowerCase();

    // 동일 유형이면 바로 매칭
    if (normalizedOutput === normalizedPrd) return true;

    // PRD 유형에 대해 허용된 출력 유형 체크
    for (const [prdKey, aliases] of Object.entries(typeMap)) {
      if (prdKey.toLowerCase() === normalizedPrd || aliases.includes(normalizedPrd)) {
        if (aliases.includes(normalizedOutput)) {
          return true;
        }
      }
    }

    // Code 타입은 대부분의 PRD 유형 구현 가능
    if (normalizedOutput === 'code') {
      return true;
    }

    return false;
  }

  /**
   * 키워드 포함 체크
   */
  containsKeywords(content, item) {
    const keywords = item.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const contentLower = content.toLowerCase();
    const matchCount = keywords.filter(kw => contentLower.includes(kw)).length;
    return matchCount >= keywords.length * 0.3; // 30% 이상 키워드 매칭
  }

  /**
   * 검증 결과 포맷팅
   * v1.2.0: Score 정보 추가
   */
  formatValidationResult(result) {
    let output = '';

    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    output += '🔍 자체 검증 (Output Validation) 결과\n';
    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    // 요약 (v1.2.0: Score 추가)
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    output += `상태: ${status}\n`;
    output += `📊 총점: ${result.score || 0}/100점 (80점 이상 PASS)\n\n`;

    // Score 세부 내역 (v1.2.0)
    if (result.scoreBreakdown) {
      output += `📈 점수 내역:\n`;
      output += `  - Syntax:      ${result.scoreBreakdown.syntax}/25\n`;
      output += `  - Schema:      ${result.scoreBreakdown.schema}/25\n`;
      output += `  - PRD 매칭:    ${result.scoreBreakdown.prdMatch}/30\n`;
      output += `  - 보안:        ${result.scoreBreakdown.security}/20\n\n`;
    }

    output += `산출물: ${result.summary.total}개\n`;
    output += `  - Syntax 통과: ${result.summary.syntaxPassed}/${result.summary.total}\n`;
    output += `  - Schema 유효: ${result.summary.schemaValid}/${result.details.filter(d => d.checks.schema).length}\n`;

    // 설계 문서 검증 결과 (v1.1.0)
    if (result.summary.designDocs && result.summary.designDocs.total > 0) {
      output += `  - 설계 문서: ${result.summary.designDocs.passed}/${result.summary.designDocs.total} (평균 ${result.summary.designDocs.avgScore}점)\n`;
    }

    if (result.prdMatch) {
      output += `  - PRD 매칭: ${result.prdMatch.matched}/${result.prdMatch.total}\n`;
    }

    // 에러
    if (result.errors.length > 0) {
      output += '\n❌ 오류:\n';
      result.errors.forEach((e, i) => {
        output += `  ${i + 1}. [${e.type}] ${e.message}\n`;
        if (e.output) output += `     → 산출물: ${e.output}\n`;
      });
    }

    // 경고
    if (result.warnings.length > 0) {
      output += '\n⚠️  경고:\n';
      result.warnings.forEach((w, i) => {
        output += `  ${i + 1}. [${w.type}] ${w.message}\n`;
      });
    }

    // PRD 매핑
    if (result.prdMatch && result.prdMatch.mapping.length > 0) {
      output += '\n📋 PRD 체크리스트 매핑:\n';
      result.prdMatch.mapping.forEach((m, i) => {
        const icon = m.matchType === 'MATCHED' ? '✅' : '❌';
        output += `  ${i + 1}. ${icon} ${m.prdItem}\n`;
        if (m.output) output += `     → ${m.output}\n`;
        else output += `     → (누락)\n`;
      });
    }

    // 설계 문서 상세 결과 (v1.1.0)
    if (result.designDocResults && result.designDocResults.length > 0) {
      output += '\n📐 설계 문서 품질 검증:\n';
      result.designDocResults.forEach((doc, i) => {
        const icon = doc.passed ? '✅' : '⚠️';
        output += `  ${i + 1}. ${icon} ${doc.name} (${doc.docType}) - ${doc.score}점\n`;
        if (doc.checklist) {
          const checks = Object.entries(doc.checklist)
            .map(([key, val]) => `${val ? '✓' : '✗'} ${key}`)
            .join(', ');
          output += `     체크리스트: ${checks}\n`;
        }
      });
    }

    output += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';

    return output;
  }
}

export default OutputValidator;
