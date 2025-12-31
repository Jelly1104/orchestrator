/**
 * PRD Analyzer - PRD 파싱, 유형 판별, Gap Check
 *
 * Leader Agent가 plan() 전에 실행하여:
 * 1. PRD 유형 판별 (정량/정성/혼합)
 * 2. 필수 항목 체크
 * 3. 산출물 체크리스트 추출
 * 4. 레퍼런스 매칭
 * 5. Gap Check 결과 생성
 */

import fs from 'fs';
import path from 'path';

// 키워드 정의
const QUANTITATIVE_KEYWORDS = [
  '분석', '통계', '세그먼트', '코호트', 'KPI',
  '수치', '비율', '퍼센트', '증가', '감소',
  '조회', '집계', '카운트', '합계', '평균',
  'SQL', '쿼리', '데이터베이스', '테이블'
];

const QUALITATIVE_KEYWORDS = [
  '설계', 'UX', 'UI', '사용자 경험',
  '제안', '추천', '개선안', '방향',
  '여정', '플로우', '시나리오',
  '인터뷰', '피드백', '휴리스틱',
  '온보딩', '가이드', '와이어프레임'
];

// 레퍼런스 맵 (PRD_REFERENCE_MAP.md 기반)
const REFERENCE_MAP = {
  'segment_analysis': {
    keywords: ['세그먼트', '분석', '패턴', '코호트'],
    reference: 'Amplitude Segmentation',
    pattern: '필터 → 그룹핑 → 비교 → 인사이트',
    category: '데이터 분석 > 세그먼트 분석'
  },
  'kpi_dashboard': {
    keywords: ['KPI', '대시보드', '지표', '모니터링'],
    reference: 'Google Analytics / Metabase',
    pattern: 'KPI 카드 + 트렌드 차트 + 필터',
    category: '시각화 > 통계 대시보드'
  },
  'admin_crud': {
    keywords: ['관리', '목록', '등록', '수정', '삭제', '어드민'],
    reference: 'Admin 템플릿',
    pattern: '검색 + 필터 + 테이블 + 페이지네이션',
    category: 'CRUD > 관리 페이지'
  },
  'onboarding': {
    keywords: ['온보딩', '가이드', '튜토리얼', '첫 사용', '웰컴'],
    reference: 'Slack / Notion 온보딩',
    pattern: '단계별 진행 → 체크리스트 → 완료',
    category: '온보딩 > 스텝 가이드'
  },
  'ux_design': {
    keywords: ['UX', '설계', '사용자 경험', '인터랙션'],
    reference: '일반 UX 패턴',
    pattern: '사용자 리서치 → 와이어프레임 → 프로토타입',
    category: '설계 > UX 설계'
  }
};

export class PRDAnalyzer {
  constructor(projectRoot) {
    this.projectRoot = projectRoot || process.cwd();
  }

  /**
   * PRD 전체 분석 (Gap Check 포함)
   * v1.2.0: gapCheck.missing 배열 추가 (HITL 트리거 연동)
   */
  async analyze(prdContent) {
    const result = {
      prdType: null,
      requiredFields: {},
      deliverables: [],
      reference: null,
      dataRequirements: [],
      gaps: [],
      missing: [],          // HITL 트리거용 누락 항목 배열
      confirmationNeeded: []
    };

    // 1. 필수 항목 체크
    result.requiredFields = this.checkRequiredFields(prdContent);

    // 2. 산출물 체크리스트 추출
    result.deliverables = this.extractDeliverables(prdContent);

    // 3. 유형 판별
    result.prdType = this.classifyPRD(prdContent, result.deliverables);

    // 4. 레퍼런스 매칭
    result.reference = this.matchReference(prdContent);

    // 5. 데이터 요구사항 추출 (정량적일 때)
    if (result.prdType === 'QUANTITATIVE' || result.prdType === 'MIXED') {
      result.dataRequirements = this.extractDataRequirements(prdContent);
    }

    // 6. Gap 식별
    result.gaps = this.identifyGaps(result);

    // 6.1 missing 배열 추출 (HITL 트리거용)
    result.missing = result.gaps.missing || [];

    // 7. 확인 필요 항목 생성
    result.confirmationNeeded = this.generateConfirmations(result);

    return result;
  }

  /**
   * 필수 항목 체크
   */
  checkRequiredFields(prdContent) {
    const fields = {
      objective: { exists: false, content: '' },
      targetUser: { exists: false, content: '' },
      coreFeatures: { exists: false, content: '' },
      successCriteria: { exists: false, content: '' }
    };

    // 목적 체크
    const objectivePatterns = [/목적|objective|개요|overview/i, /왜|why|문제|problem/i];
    for (const pattern of objectivePatterns) {
      if (pattern.test(prdContent)) {
        fields.objective.exists = true;
        break;
      }
    }

    // 타겟 유저 체크
    const targetPatterns = [/타겟|target|대상|user|사용자|유저/i];
    for (const pattern of targetPatterns) {
      if (pattern.test(prdContent)) {
        fields.targetUser.exists = true;
        break;
      }
    }

    // 핵심 기능 체크
    const featurePatterns = [/기능|feature|scope|범위|요구사항|requirement/i];
    for (const pattern of featurePatterns) {
      if (pattern.test(prdContent)) {
        fields.coreFeatures.exists = true;
        break;
      }
    }

    // 성공 지표 체크
    const criteriaPatterns = [/성공|success|지표|criteria|kpi|목표/i, /acceptance/i];
    for (const pattern of criteriaPatterns) {
      if (pattern.test(prdContent)) {
        fields.successCriteria.exists = true;
        break;
      }
    }

    return fields;
  }

  /**
   * 산출물 체크리스트 추출 (개선됨)
   * - PRD 메타데이터(목적, 타겟 등)와 실제 기능 항목을 분리
   * - 기능 섹션 내의 항목만 추출
   */
  extractDeliverables(prdContent) {
    const deliverables = [];

    // PRD 메타데이터 키워드 (체크리스트에서 제외)
    const META_KEYWORDS = [
      '목적', 'objective', '타겟', 'target', '유저', 'user',
      'type', 'pipeline', 'prd', '산출물', 'deliverable',
      '성공', 'success', '지표', 'criteria', 'kpi',
      '참조', 'reference', '제약', 'constraint', '우선순위', 'priority',
      '비고', 'note', '컨텍스트', 'context', '개요', 'overview'
    ];

    // 프로세스/메타 항목 (체크리스트에서 제외)
    const PROCESS_KEYWORDS = [
      'prd 분석', 'prd분석', '요구사항 추출', '레퍼런스 매칭',
      'ia 설계', 'ia(정보', 'wireframe', 'sdd', 'handoff',
      '문서 작성', '설계 문서'
    ];

    /**
     * 항목이 실제 기능인지 확인
     */
    const isActualFeature = (item) => {
      const itemLower = item.toLowerCase();

      // 메타데이터 키워드 포함 시 제외
      for (const kw of META_KEYWORDS) {
        if (itemLower.includes(kw.toLowerCase())) {
          return false;
        }
      }

      // 프로세스 키워드 포함 시 제외
      for (const kw of PROCESS_KEYWORDS) {
        if (itemLower.includes(kw.toLowerCase())) {
          return false;
        }
      }

      // 너무 짧으면 제외 (5자 미만)
      if (item.length < 5) return false;

      // 괄호로 시작하면 제외 (예: "(Objective)")
      if (/^\(/.test(item)) return false;

      return true;
    };

    // 1. 기능 섹션에서 체크리스트 패턴 추출: - [ ] 또는 - [x]
    const checklistPattern = /- \[[ x]\] (.+)/g;
    let match;
    while ((match = checklistPattern.exec(prdContent)) !== null) {
      const item = match[1].trim();
      if (isActualFeature(item)) {
        deliverables.push({
          item: item,
          type: this.classifyDeliverable(item)
        });
      }
    }

    // 2. 기능/Feature 섹션 내의 항목만 추출
    const featureSectionPattern = /(?:##\s*(?:기능|핵심\s*기능|core\s*feature|feature|scope|범위))[^\n]*\n([\s\S]*?)(?=##|$)/gi;
    const featureSections = prdContent.matchAll(featureSectionPattern);

    for (const section of featureSections) {
      const sectionContent = section[1];

      // F1, F2 등의 기능 ID 패턴
      const featureIdPattern = /(?:F\d+|기능\s*\d+)[:\.\s]+(.+)/g;
      while ((match = featureIdPattern.exec(sectionContent)) !== null) {
        const item = match[1].trim().split('\n')[0]; // 첫 줄만
        if (isActualFeature(item) && item.length < 100) {
          // 중복 체크
          if (!deliverables.some(d => d.item === item)) {
            deliverables.push({
              item: item,
              type: this.classifyDeliverable(item)
            });
          }
        }
      }

      // 불릿 포인트 패턴 (기능 섹션 내)
      const bulletPattern = /[-*]\s+(?!\[)([^-*\n]+)/g;
      while ((match = bulletPattern.exec(sectionContent)) !== null) {
        const item = match[1].trim();
        if (isActualFeature(item) && item.length < 100 && item.length > 10) {
          // 중복 체크
          if (!deliverables.some(d => d.item === item)) {
            deliverables.push({
              item: item,
              type: this.classifyDeliverable(item)
            });
          }
        }
      }
    }

    // 3. 체크리스트가 비어있으면 PRD에서 핵심 기능 키워드로 추출
    if (deliverables.length === 0) {
      // 핵심 기능 패턴 (동사 + 명사 조합)
      const coreFeaturePatterns = [
        /(?:추천|매칭|분석|조회|생성|계산|표시|알림|필터|정렬)[\s\w가-힣]+(?:기능|시스템|로직|UI)/g,
        /(?:회원|사용자|유저)[\s\w가-힣]+(?:프로필|데이터|정보)[\s\w가-힣]*(?:기반|활용)/g
      ];

      for (const pattern of coreFeaturePatterns) {
        while ((match = pattern.exec(prdContent)) !== null) {
          const item = match[0].trim();
          if (item.length > 5 && item.length < 50) {
            if (!deliverables.some(d => d.item === item)) {
              deliverables.push({
                item: item,
                type: this.classifyDeliverable(item)
              });
            }
          }
        }
      }
    }

    return deliverables;
  }

  /**
   * 산출물 유형 분류
   */
  classifyDeliverable(item) {
    const itemLower = item.toLowerCase();

    if (/sql|쿼리|query/.test(itemLower)) return 'SQL';
    if (/분석|분포|비교|통계/.test(itemLower)) return 'ANALYSIS';
    if (/리포트|report|보고서/.test(itemLower)) return 'REPORT';
    if (/제안|proposal|추천/.test(itemLower)) return 'PROPOSAL';
    if (/설계|design|ia|wireframe/.test(itemLower)) return 'DESIGN';
    if (/코드|구현|implementation/.test(itemLower)) return 'CODE';

    return 'OTHER';
  }

  /**
   * PRD 유형 판별
   */
  classifyPRD(prdContent, deliverables) {
    let quantScore = 0;
    let qualScore = 0;

    // 키워드 점수
    const contentLower = prdContent.toLowerCase();
    QUANTITATIVE_KEYWORDS.forEach(kw => {
      if (contentLower.includes(kw.toLowerCase())) quantScore++;
    });
    QUALITATIVE_KEYWORDS.forEach(kw => {
      if (contentLower.includes(kw.toLowerCase())) qualScore++;
    });

    // 산출물 점수
    deliverables.forEach(d => {
      if (['SQL', 'ANALYSIS'].includes(d.type)) quantScore += 2;
      if (['DESIGN', 'PROPOSAL'].includes(d.type)) qualScore += 2;
      if (d.type === 'REPORT') {
        quantScore += 1;
        qualScore += 1;
      }
    });

    // 판별
    if (quantScore > 0 && qualScore > 0) {
      // 둘 다 있으면 비율로 판단
      const ratio = quantScore / (quantScore + qualScore);
      if (ratio > 0.7) return 'QUANTITATIVE';
      if (ratio < 0.3) return 'QUALITATIVE';
      return 'MIXED';
    } else if (quantScore > qualScore) {
      return 'QUANTITATIVE';
    } else {
      return 'QUALITATIVE';
    }
  }

  /**
   * 레퍼런스 매칭
   */
  matchReference(prdContent) {
    const contentLower = prdContent.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    for (const [key, ref] of Object.entries(REFERENCE_MAP)) {
      let score = 0;
      ref.keywords.forEach(kw => {
        if (contentLower.includes(kw.toLowerCase())) score++;
      });

      if (score > bestScore) {
        bestScore = score;
        bestMatch = { key, ...ref, score };
      }
    }

    return bestMatch && bestScore >= 2 ? bestMatch : null;
  }

  /**
   * 데이터 요구사항 추출
   */
  extractDataRequirements(prdContent) {
    const requirements = [];

    // 알려진 테이블명 목록 (DOMAIN_SCHEMA.md 기반)
    const KNOWN_TABLES = [
      'USERS', 'USER_DETAIL', 'USER_LOGIN_LOG', 'USER_ACTION_LOG',
      'CODE_MASTER', 'CODE_LOC', 'CODE_MAJOR', 'CODE_WORK_TYPE',
      'BOARD', 'BOARD_COMMENT', 'BOARD_LIKE',
      'CAREER', 'CAREER_DETAIL',
      'COMMUNITY', 'COMMUNITY_POST', 'COMMUNITY_COMMENT'
    ];

    // 일반적인 약어/키워드 제외
    const EXCLUDE_PATTERNS = [
      'SQL', 'API', 'KPI', 'MVP', 'PRD', 'SDD', 'URL', 'CSV', 'JSON', 'XML',
      'END', 'WHO', 'WHY', 'WHAT', 'HOW', 'WHEN', 'WHERE',
      'HEAVY', 'MEDIUM', 'LIGHT', 'BOTH', 'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT',
      'EXPLORER', 'FOCUSED', 'CRM', 'AI',
      'DOMAIN_SCHEMA', 'DOCUMENT_PIPELINE', 'USE', 'CASE'
    ];

    // 컬럼명 패턴 (U_, C_, B_ 등으로 시작하는 것)
    const COLUMN_PREFIXES = ['U_', 'C_', 'B_', 'P_', 'L_', 'M_', 'S_', 'T_', 'D_', 'A_', 'N_', 'R_'];

    // 테이블명 패턴 (대문자 + 언더스코어)
    const tablePattern = /\b([A-Z][A-Z_]+[A-Z])\b/g;
    const tables = new Set();
    let match;
    while ((match = tablePattern.exec(prdContent)) !== null) {
      const candidate = match[1];
      // 제외 패턴 확인
      if (EXCLUDE_PATTERNS.includes(candidate)) continue;
      // 컬럼명 패턴 제외 (단일 문자 + 언더스코어로 시작)
      const isColumn = COLUMN_PREFIXES.some(prefix => candidate.startsWith(prefix));
      if (isColumn) continue;
      // 알려진 테이블만 추출
      if (KNOWN_TABLES.includes(candidate)) {
        tables.add(candidate);
      }
    }

    tables.forEach(table => {
      requirements.push({ table, columns: [] });
    });

    return requirements;
  }

  /**
   * Gap 식별 (v1.2.0: HITL 트리거용 missing 배열 추가)
   */
  identifyGaps(analysisResult) {
    const gaps = [];
    const missing = []; // HITL 트리거용 누락 항목 배열

    // 필수 항목 누락
    const { requiredFields } = analysisResult;
    if (!requiredFields.objective.exists) {
      gaps.push({ type: 'MISSING_FIELD', field: '목적(Objective)', severity: 'HIGH' });
      missing.push('목적(Objective)');
    }
    if (!requiredFields.targetUser.exists) {
      gaps.push({ type: 'MISSING_FIELD', field: '타겟 유저(Target User)', severity: 'HIGH' });
      missing.push('타겟 유저(Target User)');
    }
    if (!requiredFields.coreFeatures.exists) {
      gaps.push({ type: 'MISSING_FIELD', field: '핵심 기능(Core Features)', severity: 'HIGH' });
      missing.push('핵심 기능(Core Features)');
    }
    if (!requiredFields.successCriteria.exists) {
      gaps.push({ type: 'MISSING_FIELD', field: '성공 지표(Success Criteria)', severity: 'MEDIUM' });
      missing.push('성공 지표(Success Criteria)');
    }

    // 산출물 누락
    if (analysisResult.deliverables.length === 0) {
      gaps.push({ type: 'NO_DELIVERABLES', severity: 'HIGH' });
      missing.push('산출물 체크리스트');
    }

    // 정량적인데 데이터 요구사항 없음
    if (
      (analysisResult.prdType === 'QUANTITATIVE' || analysisResult.prdType === 'MIXED') &&
      analysisResult.dataRequirements.length === 0
    ) {
      gaps.push({ type: 'NO_DATA_REQUIREMENTS', severity: 'MEDIUM' });
      missing.push('데이터 요구사항(테이블/컬럼)');
    }

    // 레퍼런스 없음
    if (!analysisResult.reference) {
      gaps.push({ type: 'NO_REFERENCE', severity: 'LOW' });
    }

    // missing 배열을 gaps에 첨부 (HITL 트리거용)
    gaps.missing = missing;

    return gaps;
  }

  /**
   * 확인 필요 항목 생성
   */
  generateConfirmations(analysisResult) {
    const confirmations = [];

    // 유형 확인
    confirmations.push({
      type: 'PRD_TYPE',
      question: `PRD 유형을 "${this.getPRDTypeLabel(analysisResult.prdType)}"로 판별했습니다. 맞습니까?`,
      options: ['Y', 'N'],
      default: 'Y'
    });

    // 레퍼런스 확인
    if (analysisResult.reference) {
      confirmations.push({
        type: 'REFERENCE',
        question: `레퍼런스: "${analysisResult.reference.reference}" (${analysisResult.reference.pattern})\n이 방향이 맞습니까?`,
        options: ['Y', 'N', 'R (다른 레퍼런스)'],
        default: 'Y'
      });
    }

    // 산출물 확인
    if (analysisResult.deliverables.length > 0) {
      const deliverableList = analysisResult.deliverables
        .map((d, i) => `${i + 1}. ${d.item} (${d.type})`)
        .join('\n');
      confirmations.push({
        type: 'DELIVERABLES',
        question: `산출물 체크리스트 (${analysisResult.deliverables.length}개):\n${deliverableList}\n\n이 목록이 맞습니까?`,
        options: ['Y', 'N', 'E (수정)'],
        default: 'Y'
      });
    }

    // 데이터 요구사항 확인
    if (analysisResult.dataRequirements.length > 0) {
      const tableList = analysisResult.dataRequirements
        .map(r => r.table)
        .join(', ');
      confirmations.push({
        type: 'DATA_REQUIREMENTS',
        question: `데이터 소스: ${tableList}\nDOMAIN_SCHEMA.md와 대조 후 진행합니다. 맞습니까?`,
        options: ['Y', 'N'],
        default: 'Y'
      });
    }

    return confirmations;
  }

  /**
   * PRD v2 유형 판별 (Orchestrator에서 호출)
   * v1.2.0: gapCheck 결과 포함 (HITL 트리거 연동)
   * @param {string} prdContent - PRD 텍스트 내용
   * @returns {Object} - { type, pipeline, gapCheck }
   */
  classifyPRDv2(prdContent) {
    if (!prdContent || typeof prdContent !== 'string') {
      return { type: 'QUALITATIVE', pipeline: 'design', gapCheck: null };
    }

    // PRD v2 명시적 type 필드 추출
    const typeMatch = prdContent.match(/type\s*:\s*(QUANTITATIVE|QUALITATIVE|MIXED)/i);
    // pipeline 필드 - 모든 값을 캡처 (유효성 검사는 orchestrator에서)
    // 테이블 형식: | **Pipeline** | value | 또는 일반 형식: Pipeline: value
    const pipelineMatch = prdContent.match(/\|\s*\*{0,2}Pipeline\*{0,2}\s*\|\s*([^\s|]+)/i)
      || prdContent.match(/pipeline\s*[:\|]\s*(\S+)/i);

    // 산출물 추출 (Gap Check 용)
    const deliverables = this.extractDeliverables(prdContent);

    // Gap Check 실행 (동기 버전)
    const gapCheckResult = this._runGapCheckSync(prdContent, deliverables);

    // type이 명시된 경우
    if (typeMatch) {
      const type = typeMatch[1].toUpperCase();
      const pipeline = pipelineMatch
        ? pipelineMatch[1].toLowerCase()
        : this.inferPipeline(type, prdContent, deliverables);
      return { type, pipeline, gapCheck: gapCheckResult };
    }

    // v2 필드가 없으면 기존 로직으로 추론
    const inferredType = this.classifyPRD(prdContent, deliverables);

    // pipeline이 명시적으로 지정된 경우 그 값을 사용 (유효성 검사는 orchestrator에서)
    const inferredPipeline = pipelineMatch
      ? pipelineMatch[1].toLowerCase()
      : this.inferPipeline(inferredType, prdContent, deliverables);

    return { type: inferredType, pipeline: inferredPipeline, gapCheck: gapCheckResult };
  }

  /**
   * Gap Check 동기 버전 (classifyPRDv2용)
   */
  _runGapCheckSync(prdContent, deliverables) {
    const requiredFields = this.checkRequiredFields(prdContent);
    const prdType = this.classifyPRD(prdContent, deliverables);
    const dataRequirements = (prdType === 'QUANTITATIVE' || prdType === 'MIXED')
      ? this.extractDataRequirements(prdContent)
      : [];
    const reference = this.matchReference(prdContent);

    // Gap 식별
    const gaps = [];
    const missing = [];

    if (!requiredFields.objective.exists) {
      gaps.push({ type: 'MISSING_FIELD', field: '목적(Objective)', severity: 'HIGH' });
      missing.push('목적(Objective)');
    }
    if (!requiredFields.targetUser.exists) {
      gaps.push({ type: 'MISSING_FIELD', field: '타겟 유저(Target User)', severity: 'HIGH' });
      missing.push('타겟 유저(Target User)');
    }
    if (!requiredFields.coreFeatures.exists) {
      gaps.push({ type: 'MISSING_FIELD', field: '핵심 기능(Core Features)', severity: 'HIGH' });
      missing.push('핵심 기능(Core Features)');
    }
    if (!requiredFields.successCriteria.exists) {
      gaps.push({ type: 'MISSING_FIELD', field: '성공 지표(Success Criteria)', severity: 'MEDIUM' });
      missing.push('성공 지표(Success Criteria)');
    }
    if (deliverables.length === 0) {
      gaps.push({ type: 'NO_DELIVERABLES', severity: 'HIGH' });
      missing.push('산출물 체크리스트');
    }
    if ((prdType === 'QUANTITATIVE' || prdType === 'MIXED') && dataRequirements.length === 0) {
      gaps.push({ type: 'NO_DATA_REQUIREMENTS', severity: 'MEDIUM' });
      missing.push('데이터 요구사항(테이블/컬럼)');
    }
    if (!reference) {
      gaps.push({ type: 'NO_REFERENCE', severity: 'LOW' });
    }

    return {
      prdType,
      requiredFields,
      deliverables,
      dataRequirements,
      reference,
      gaps,
      missing,
      hasHighSeverityGaps: gaps.filter(g => g.severity === 'HIGH').length > 0
    };
  }

  /**
   * type에서 pipeline 추론
   *
   * ROLE_ARCHITECTURE.md 정의:
   * - analysis: Phase A만
   * - design: Phase B만
   * - mixed: Phase A → B
   * - full: Phase A → B → C
   *
   * @param {string} type - PRD 유형 (QUANTITATIVE, QUALITATIVE, MIXED)
   * @param {string} prdContent - PRD 원본 텍스트 (Phase C 산출물 감지용)
   * @param {Array} deliverables - 산출물 목록
   * @returns {string} - pipeline 타입
   */
  inferPipeline(type, prdContent = '', deliverables = []) {
    // 기본 매핑
    const mapping = {
      'QUANTITATIVE': 'analysis',
      'QUALITATIVE': 'design',
      'MIXED': 'mixed'
    };

    const basePipeline = mapping[type] || 'design';

    // MIXED 타입일 때 Phase C 산출물이 있으면 full로 승격
    if (type === 'MIXED' && prdContent) {
      // Phase C 관련 키워드 감지
      const phaseCKeywords = [
        /phase\s*c/i,
        /코드\s*(구현|생성)/i,
        /code\s*implementation/i,
        /backend|frontend/i,
        /express|react|api\s*서버/i,
        /\.ts|\.js|\.tsx/i
      ];

      const hasPhaseCOutput = phaseCKeywords.some(pattern => pattern.test(prdContent));

      // 산출물에서 코드 관련 항목 감지
      const hasCodeDeliverable = deliverables.some(d =>
        /code|backend|frontend|서버|api|구현/i.test(d)
      );

      if (hasPhaseCOutput || hasCodeDeliverable) {
        return 'full';
      }
    }

    return basePipeline;
  }

  /**
   * PRD 파싱 (구조화된 객체로 변환)
   * @param {string} prdContent - PRD 텍스트 내용
   * @returns {Object} - 파싱된 PRD 객체
   */
  parsePRD(prdContent) {
    const parsed = {
      objective: '',
      목적: '',
      targetUser: '',
      타겟: '',
      coreFeatures: [],
      기능: [],
      successCriteria: [],
      성공지표: [],
      type: 'QUALITATIVE',
      pipeline: 'design',
      deliverables: [],
      산출물: [],
      dataRequirements: [],
      데이터요구사항: [],
      constraints: ['SELECT only'],
      제약사항: ['SELECT only']
    };

    // 목적 추출
    const objectiveMatch = prdContent.match(/(?:목적|objective)[:\s]*\n?([^\n#]+)/i);
    if (objectiveMatch) {
      parsed.objective = objectiveMatch[1].trim();
      parsed.목적 = parsed.objective;
    }

    // 타겟 유저 추출
    const targetMatch = prdContent.match(/(?:타겟|target\s*user)[:\s]*\n?([^\n#]+)/i);
    if (targetMatch) {
      parsed.targetUser = targetMatch[1].trim();
      parsed.타겟 = parsed.targetUser;
    }

    // 유형/파이프라인 추출
    const classification = this.classifyPRDv2(prdContent);
    parsed.type = classification.type;
    parsed.pipeline = classification.pipeline;

    // 산출물 추출
    const deliverables = this.extractDeliverables(prdContent);
    parsed.deliverables = deliverables.map(d => ({
      name: d.item,
      이름: d.item,
      type: this.mapDeliverableType(d.type),
      타입: this.mapDeliverableType(d.type),
      criteria: '',
      기준: ''
    }));
    parsed.산출물 = parsed.deliverables;

    // 데이터 요구사항 추출
    const dataReqs = this.extractDataRequirements(prdContent);
    parsed.dataRequirements = dataReqs.map(r => ({
      table: r.table,
      테이블: r.table,
      columns: r.columns || [],
      컬럼: r.columns || [],
      purpose: '',
      용도: ''
    }));
    parsed.데이터요구사항 = parsed.dataRequirements;

    // 성공 지표 추출 (체크리스트나 bullet에서)
    const criteriaSection = prdContent.match(/(?:성공\s*지표|success\s*criteria)[:\s]*\n((?:[-*]\s*.+\n?)+)/i);
    if (criteriaSection) {
      const bullets = criteriaSection[1].match(/[-*]\s*(.+)/g) || [];
      parsed.successCriteria = bullets.map(b => b.replace(/^[-*]\s*/, '').trim());
      parsed.성공지표 = parsed.successCriteria;
    }

    return parsed;
  }

  /**
   * 산출물 타입 매핑 (내부 → v2 표준)
   */
  mapDeliverableType(internalType) {
    const mapping = {
      'SQL': 'SQL_QUERY',
      'ANALYSIS': 'ANALYSIS_TABLE',
      'REPORT': 'REPORT',
      'PROPOSAL': 'PROPOSAL',
      'DESIGN': 'IA_DOCUMENT',
      'CODE': 'CODE',
      'OTHER': 'REPORT'
    };
    return mapping[internalType] || 'REPORT';
  }

  /**
   * PRD 유형 라벨
   */
  getPRDTypeLabel(type) {
    const labels = {
      'QUANTITATIVE': '정량적 (데이터 분석 중심)',
      'QUALITATIVE': '정성적 (설계/제안 중심)',
      'MIXED': '혼합 (분석 → 인사이트 → 제안)'
    };
    return labels[type] || type;
  }

  /**
   * Gap Check 결과 포맷팅
   */
  formatGapCheckResult(analysisResult) {
    let output = '';

    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    output += '📋 PRD Gap Check 결과\n';
    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    // 필수 항목 상태
    const rf = analysisResult.requiredFields;
    const fieldCount = Object.values(rf).filter(f => f.exists).length;
    output += `✅ 필수 항목: ${fieldCount}/4 충족\n`;
    output += `   - 목적: ${rf.objective.exists ? '✓' : '✗ (누락)'}\n`;
    output += `   - 타겟 유저: ${rf.targetUser.exists ? '✓' : '✗ (누락)'}\n`;
    output += `   - 핵심 기능: ${rf.coreFeatures.exists ? '✓' : '✗ (누락)'}\n`;
    output += `   - 성공 지표: ${rf.successCriteria.exists ? '✓' : '✗ (누락)'}\n\n`;

    // PRD 유형
    output += `📊 PRD 유형: ${this.getPRDTypeLabel(analysisResult.prdType)}\n\n`;

    // 레퍼런스
    if (analysisResult.reference) {
      output += `🔗 레퍼런스 매칭:\n`;
      output += `   - 카테고리: ${analysisResult.reference.category}\n`;
      output += `   - 참조: ${analysisResult.reference.reference}\n`;
      output += `   - 패턴: ${analysisResult.reference.pattern}\n\n`;
    } else {
      output += `🔗 레퍼런스: 매칭 없음 (일반 패턴 적용)\n\n`;
    }

    // 산출물
    if (analysisResult.deliverables.length > 0) {
      output += `📦 산출물 체크리스트 (${analysisResult.deliverables.length}개):\n`;
      analysisResult.deliverables.forEach((d, i) => {
        output += `   ${i + 1}. ${d.item} → ${d.type}\n`;
      });
      output += '\n';
    } else {
      output += `📦 산출물: 명시된 체크리스트 없음 (PRD 기반 추론 필요)\n\n`;
    }

    // 데이터 요구사항
    if (analysisResult.dataRequirements.length > 0) {
      output += `💾 데이터 소스:\n`;
      analysisResult.dataRequirements.forEach(r => {
        output += `   - ${r.table}\n`;
      });
      output += '\n';
    }

    // Gap
    if (analysisResult.gaps.length > 0) {
      output += `⚠️ 확인 필요 사항:\n`;
      analysisResult.gaps.forEach(gap => {
        const icon = gap.severity === 'HIGH' ? '🔴' : gap.severity === 'MEDIUM' ? '🟡' : '🟢';
        output += `   ${icon} ${this.getGapMessage(gap)}\n`;
      });
      output += '\n';
    }

    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';

    return output;
  }

  /**
   * Gap 메시지 생성
   */
  getGapMessage(gap) {
    const messages = {
      'MISSING_FIELD': `필수 항목 누락: ${gap.field}`,
      'NO_DELIVERABLES': '산출물 체크리스트가 없습니다. PRD 기반으로 추론합니다.',
      'NO_DATA_REQUIREMENTS': '데이터 요구사항이 명시되지 않았습니다. DOMAIN_SCHEMA.md 기반으로 추론합니다.',
      'NO_REFERENCE': '매칭되는 레퍼런스가 없습니다. 일반 패턴을 적용합니다.'
    };
    return messages[gap.type] || gap.type;
  }
}

export default PRDAnalyzer;
