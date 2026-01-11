/**
 * Query Library - 템플릿 엔진 및 Hybrid Search
 *
 * PO 지시 (Milestone 3, P2-1):
 * - 검증된 쿼리 템플릿 우선 사용
 * - LLM 환각(Hallucination) 위험 최소화
 * - [Source: Library] / [Source: Generated] 구분 로깅
 *
 * @version 1.0.0
 * @since 2025-12-26
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 템플릿 매핑 (키워드 → 템플릿 파일)
const TEMPLATE_MAPPINGS = {
  // active_users.sql 매핑
  'active_users': {
    file: 'active_users.sql',
    keywords: [
      '활성 사용자', '활성사용자', '활성 회원', '활성회원',
      'active user', 'active users',
      '사용자 현황', '회원 현황', '유저 현황',
      '사용자 통계', '회원 통계', '유저 통계',
      '가입자', '신규 가입', '회원 수', '사용자 수',
      '사용자 분포', '회원 분포', '유형별 사용자', '유형별 회원'
    ],
    description: '활성 사용자 현황, 유형별 분포, 신규 가입자 추이',
    queries: [
      { name: 'total_active_users', index: 0, description: '전체 활성 사용자 수' },
      { name: 'active_users_by_type', index: 1, description: '유형별 활성 사용자 분포' },
      { name: 'monthly_new_users', index: 2, description: '월별 신규 가입자 추이' },
      { name: 'user_status_distribution', index: 3, description: '유형별 활성/비활성 비율' }
    ]
  },
  // job_posting.sql 매핑
  'job_posting': {
    file: 'job_posting.sql',
    keywords: [
      '채용', '채용공고', '구인', '구직', '일자리',
      'job', 'jobs', 'posting', 'recruit', 'recruitment',
      '공고 현황', '채용 현황', '공고 통계', '채용 통계',
      '인기 공고', '조회수', '기업 채용'
    ],
    description: '채용공고 현황, 월별 추이, 인기 공고',
    queries: [
      { name: 'posting_status_summary', index: 0, description: '전체 채용공고 현황' },
      { name: 'monthly_posting_trend', index: 1, description: '월별 채용공고 등록 추이' },
      { name: 'top_postings', index: 2, description: '인기 채용공고 TOP 10' },
      { name: 'posting_by_company_type', index: 3, description: '기업 유형별 채용공고 분포' }
    ]
  }
};

export class QueryLibrary {
  constructor(options = {}) {
    this.libraryPath = options.libraryPath || __dirname;
    this.templates = new Map();
    this.loaded = false;
  }

  /**
   * 라이브러리 초기화 - 모든 템플릿 로드
   */
  async initialize() {
    if (this.loaded) return;

    for (const [key, config] of Object.entries(TEMPLATE_MAPPINGS)) {
      const filePath = path.join(this.libraryPath, config.file);

      try {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const queries = this._parseSQLFile(content);

          this.templates.set(key, {
            ...config,
            content,
            queries: queries,
            path: filePath
          });
        }
        // 파일 없음 경고 제거 - 정상 동작임
      } catch (error) {
        // 에러는 디버그 모드에서만 출력
        if (process.env.DEBUG === 'true') {
          console.error(`  ❌ ${config.file}: ${error.message}`);
        }
      }
    }

    this.loaded = true;
  }

  /**
   * SQL 파일 파싱 - 개별 쿼리 추출
   * 주석 (-- 1. xxx) 기준으로 쿼리 분리
   */
  _parseSQLFile(content) {
    const queries = [];
    const lines = content.split('\n');

    let currentQuery = null;
    let currentSQL = [];

    for (const line of lines) {
      // 헤더 주석 스킵 (파일 설명)
      if (line.startsWith('-- Query Library:') ||
          line.startsWith('-- Category:') ||
          line.startsWith('-- Description:') ||
          line.startsWith('-- Version:') ||
          line.startsWith('-- Created:') ||
          line.startsWith('-- 허용된') ||
          line.startsWith('-- - ') ||
          line.startsWith('-- Parameters:') ||
          line.trim() === '--') {
        continue;
      }

      // 쿼리 시작 주석 (-- 1. 전체 활성 사용자 수)
      const queryHeaderMatch = line.match(/^--\s*(\d+)\.\s*(.+)$/);
      if (queryHeaderMatch) {
        // 이전 쿼리 저장
        if (currentQuery && currentSQL.length > 0) {
          queries.push({
            ...currentQuery,
            sql: currentSQL.join('\n').trim()
          });
        }

        // 새 쿼리 시작
        currentQuery = {
          index: parseInt(queryHeaderMatch[1]) - 1,
          name: this._generateQueryName(queryHeaderMatch[2]),
          description: queryHeaderMatch[2].trim()
        };
        currentSQL = [];
        continue;
      }

      // SQL 본문 수집
      if (currentQuery && line.trim()) {
        currentSQL.push(line);
      }
    }

    // 마지막 쿼리 저장
    if (currentQuery && currentSQL.length > 0) {
      queries.push({
        ...currentQuery,
        sql: currentSQL.join('\n').trim()
      });
    }

    return queries;
  }

  /**
   * 쿼리 이름 생성 (한글 설명 → snake_case)
   */
  _generateQueryName(description) {
    const nameMap = {
      '전체 활성 사용자 수': 'total_active_users',
      '유형별 활성 사용자 분포': 'active_users_by_type',
      '월별 신규 가입자 추이': 'monthly_new_users',
      '유형별 활성/비활성 비율': 'user_status_distribution',
      '전체 채용공고 현황': 'posting_status_summary',
      '월별 채용공고 등록 추이': 'monthly_posting_trend',
      '인기 채용공고 TOP 10': 'top_postings',
      '기업 유형별 채용공고 분포': 'posting_by_company_type'
    };

    return nameMap[description.trim()] ||
           description.toLowerCase()
             .replace(/[^\w\s가-힣]/g, '')
             .replace(/\s+/g, '_')
             .substring(0, 30);
  }

  /**
   * Hybrid Search: 질문 의도 분석 → 라이브러리 매칭
   *
   * @param {string|Object} query - 사용자 질문 또는 PRD 목적 (문자열 또는 객체)
   * @returns {Object|null} 매칭된 템플릿 또는 null
   */
  findMatchingTemplate(query) {
    if (!this.loaded) {
      return null;
    }

    // 입력 정규화: 객체인 경우 문자열로 변환
    let queryText = query;
    if (typeof query !== 'string') {
      if (query && typeof query === 'object') {
        queryText = query.originalText || query.objective || JSON.stringify(query);
      } else {
        queryText = String(query || '');
      }
    }

    const queryLower = queryText.toLowerCase();
    let bestMatch = null;
    let maxScore = 0;

    for (const [key, template] of this.templates) {
      let score = 0;

      // 키워드 매칭 점수 계산
      for (const keyword of template.keywords) {
        if (queryLower.includes(keyword.toLowerCase())) {
          // 긴 키워드 매칭에 더 높은 점수
          score += keyword.length;
        }
      }

      if (score > maxScore) {
        maxScore = score;
        bestMatch = { key, template, score };
      }
    }

    // 최소 점수 임계값 (너무 약한 매칭 방지)
    const MIN_SCORE = 4;
    if (bestMatch && bestMatch.score >= MIN_SCORE) {
      return bestMatch;
    }

    return null;
  }

  /**
   * 템플릿에서 쿼리 로드 (파라미터 주입)
   *
   * @param {string} templateKey - 템플릿 키 (예: 'active_users')
   * @param {Object} params - 파라미터 (예: { since_date: '2024-01-01' })
   * @param {Array<number>} queryIndices - 가져올 쿼리 인덱스 (없으면 전체)
   * @returns {Array} 쿼리 배열 [{ name, sql, source: 'library' }]
   */
  loadQueries(templateKey, params = {}, queryIndices = null) {
    const template = this.templates.get(templateKey);
    if (!template) {
      return [];
    }

    let queries = template.queries;

    // 특정 인덱스만 선택
    if (queryIndices && Array.isArray(queryIndices)) {
      queries = queries.filter((_, idx) => queryIndices.includes(idx));
    }

    // 파라미터 주입
    const processedQueries = queries.map(q => {
      let sql = q.sql;

      // {{param}} 형식 치환
      for (const [key, value] of Object.entries(params)) {
        const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        sql = sql.replace(placeholder, value);
      }

      return {
        name: q.name,
        sql: sql,
        description: q.description,
        source: 'library',  // P2-1 요구사항: 소스 구분
        templateKey: templateKey,
        templateFile: template.file
      };
    });

    return processedQueries;
  }

  /**
   * 사용 가능한 모든 템플릿 목록
   */
  listTemplates() {
    const list = [];
    for (const [key, template] of this.templates) {
      list.push({
        key,
        file: template.file,
        description: template.description,
        queryCount: template.queries.length,
        keywords: template.keywords.slice(0, 5)  // 처음 5개만
      });
    }
    return list;
  }

  /**
   * 템플릿 존재 여부 확인
   */
  hasTemplate(key) {
    return this.templates.has(key);
  }
}

export default QueryLibrary;
