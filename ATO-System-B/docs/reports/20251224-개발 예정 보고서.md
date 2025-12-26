# ATO-System-B 개발 예정 보고서

> **작성일**: 2025-12-24
> **최종 업데이트**: 2025-12-26
> **작성 기준**: case6-retest8 테스트 결과, 설계 vs 실제 동작 비교, 품질 비교 보고서
> **목적**: 현재 상태 분석 기반 개발 로드맵 정의

---

## 📢 Status Update (2025-12-26)

### ✅ 마일스톤 2 완료: Orchestrator 지능화 (P1-2, P1-3, P2-1)

| 항목 | 상태 | 완료일 | 검증 결과 |
|------|------|--------|-----------|
| P1-2: 케이스별 모드 자동 선택 | ✅ 완료 | 2025-12-26 | case6-retest10: Auto-Routing 정상 |
| P1-3: Phase A/B 토큰 분리 추적 | ✅ 완료 | 2025-12-26 | phaseUsage 로그 확인 |
| P2-1: Query Library 도입 준비 | ✅ 완료 | 2025-12-26 | 2개 템플릿 생성 |

### 📊 Auto-Routing 검증 결과 (case6-retest10)

```
🔍 [Phase 0] PRD 유형 판별 및 파이프라인 자동 선택...
   - PRD 유형: MIXED
   - 추론된 파이프라인: mixed
   - 라우팅 결정: mixed (PRD pipeline 필드 명시)

🔀 [Auto-Routing] MIXED → Mixed Pipeline
   ⚡ AnalysisAgent + LeaderAgent 순차 실행
```

### 🔧 변경된 파일 (Milestone 2)

| 파일 | 변경 내용 | 버전 |
|------|----------|------|
| `orchestrator/orchestrator.js` | Auto-Routing + Phase 토큰 추적 | v4.2.0 |
| `orchestrator/metrics/tracker.js` | phaseUsage 추가 | v1.1.0 |
| `orchestrator/agents/analysis-agent.js` | 세션 토큰 사용량 추적 | v1.0.6 |
| `orchestrator/skills/query/library/` | 신규 생성 - Query 템플릿 2개 | v1.0.0 |

---

### ✅ 마일스톤 1 완료: 보안 강화 (P0 + P1-1)

| 항목 | 상태 | 완료일 | 검증 결과 |
|------|------|--------|-----------|
| P0-1: SELECT * 금지 규칙 | ✅ 완료 | 2025-12-26 | case6-retest9: 0% 발생 |
| P0-2: 민감 컬럼 블랙리스트 | ✅ 완료 | 2025-12-26 | 15개 컬럼 차단 정책 |
| P0-3: 쿼리 검증 게이트 | ✅ 완료 | 2025-12-26 | sql-validator.js 구현 |
| P1-1: Phase B Reviewer | ✅ 완료 | 2025-12-26 | 100점/100점 PASS |

### 📊 성공 지표 달성 현황

| 지표 | retest8 (이전) | retest10 (현재) | 목표 | 상태 |
|------|---------------|----------------|------|------|
| SELECT * 발생률 | 80% (4/5) | **0% (0/1)** | 0% | ✅ 달성 |
| Phase B Reviewer 호출률 | 0% | **100%** | 100% | ✅ 달성 |
| 민감 컬럼 노출 | 17개+ | **0개** | 0개 | ✅ 달성 |
| 설계 문서 품질 점수 | - | **100점** | 80점+ | ✅ 달성 |
| Auto-Routing 정확도 | - | **100%** | 100% | ✅ 달성 |
| Phase 토큰 분리 추적 | 미구현 | **구현 완료** | 구현 | ✅ 달성 |

### 🔧 변경된 파일 (Milestone 1)

| 파일 | 변경 내용 | 버전 |
|------|----------|------|
| `orchestrator/agents/analysis-agent.js` | SQL 생성 프롬프트 + 검증 게이트 호출 | v1.0.5 |
| `orchestrator/security/sql-validator.js` | 신규 생성 - SELECT */민감컬럼 검출 | v1.0.0 |
| `orchestrator/orchestrator.js` | Phase B Reviewer 호출 추가 | v4.1.0 |
| `.claude/rules/DB_ACCESS_POLICY.md` | 민감 컬럼 블랙리스트 섹션 추가 | v1.2.0 |

---

## 1. 현황 요약

### 1.1 현재 구현 상태

| 구분 | 상태 | 설명 |
|------|------|------|
| **Phase A (Analysis)** | ✅ 구현됨 | AnalysisAgent, SQL 생성/실행, ReviewerSkill, **SQL Validator** |
| **Phase B (Design)** | ✅ 구현됨 | LeaderAgent, 4개 설계 문서 생성, **Phase B Reviewer** |
| **Phase C (Implementation)** | ⏳ 미구현 | SubAgent, CodeAgent 코드 생성 |
| **Phase D (Security)** | ✅ 강화됨 | 입력 검증, Rate Limiting, **SQL Validator Gate** |

### 1.2 주요 성과 (v4.3.14)

- AnthropicProvider 스트리밍 지원 추가
- OpenAI 모델 gpt-4o 변경 (16K 토큰)
- 4개 설계 문서 정상 생성 (IA, Wireframe, SDD, HANDOFF)
- **[신규] SELECT * 금지 및 DOMAIN_SCHEMA 기반 컬럼 화이트리스트**
- **[신규] SQL 검증 게이트 (executeQueries 전 차단)**
- **[신규] Phase B Reviewer 호출 (설계 문서 품질 검증)**

### 1.3 발견된 이슈

| 이슈 | 심각도 | 상태 |
|------|--------|------|
| **SELECT * Hallucination** | 🔴 Critical | ✅ 해결 (2025-12-26) |
| **Phase B Reviewer 미호출** | 🟡 High | ✅ 해결 (2025-12-26) |
| **Doc-Sync 미구현** | 🟡 High | ⏳ 미해결 |
| **Skill 분리 미완료** | 🟢 Medium | ⏳ 미해결 |

---

## 2. 개발 우선순위

### P0: 보안 및 안정성 (즉시)

| 항목 | 설명 | 예상 작업량 |
|------|------|------------|
| **SELECT * 금지 규칙** | Analysis Agent 프롬프트에 SELECT * 사용 금지 추가 | 0.5일 |
| **민감 컬럼 블랙리스트** | DB_ACCESS_POLICY.md에 U_PASSWD, U_EMAIL 등 금지 컬럼 정의 | 0.5일 |
| **쿼리 검증 게이트** | SQL 실행 전 SELECT * 패턴 검출 및 차단 | 1일 |

### P1: 품질 개선 (단기)

| 항목 | 설명 | 예상 작업량 |
|------|------|------------|
| **Phase B Reviewer 호출** | 설계 문서 생성 후 품질 검증 추가 | 1일 |
| **케이스별 모드 자동 선택** | PRD 분석 시 DB 연동 필요 여부 판단 → Extension/Pipeline 자동 선택 | 2일 |
| **Phase A 토큰 분리 추적** | AnalysisAgent 토큰 사용량 별도 로깅 | 0.5일 |

### P2: 기능 확장 (중기)

| 항목 | 설명 | 예상 작업량 |
|------|------|------------|
| **Query Library 도입** | 사전 검증된 쿼리 템플릿 라이브러리 | 3일 |
| **Doc-Sync (Notion)** | Phase 완료 후 Notion 자동 동기화 | 2일 |
| **Skill 모듈 분리** | Query Skill, Designer Skill 별도 모듈화 | 3일 |

### P3: 아키텍처 개선 (장기)

| 항목 | 설명 | 예상 작업량 |
|------|------|------------|
| **Phase C 구현** | HANDOFF.md 기반 코드 생성 파이프라인 | 5일 |
| **HITL 체크포인트 활성화** | autoApprove=OFF 프로덕션 모드 | 2일 |
| **컬럼 화이트리스트** | PRD별 허용 컬럼 목록 자동 생성 | 2일 |

---

## 3. 상세 개발 계획

### 3.1 P0-1: SELECT * 금지 규칙

**현황**:
```
retest8에서 5개 쿼리 중 4개가 SELECT * 사용
→ 17개+ 민감 컬럼 노출 (U_PASSWD_ENC, U_EMAIL, U_SID_ENC 등)
```

**개발 내용**:
```javascript
// analysis-agent.js 수정
const SQL_GENERATION_RULES = `
## SQL 생성 규칙 (필수 준수)

1. **SELECT * 절대 금지**
   - 항상 필요한 컬럼만 명시적으로 나열
   - 예시: SELECT U_ID, U_KIND, U_ALIVE FROM USERS

2. **민감 컬럼 조회 금지**
   - 금지 컬럼: U_PASSWD, U_PASSWD_ENC, U_EMAIL, U_NAME, U_SID, U_SID_ENC, U_TEL, U_IP
   - 위반 시 쿼리 실행 차단

3. **대용량 테이블 LIMIT 필수**
   - USER_LOGIN (2267만행): LIMIT 1000 필수
   - COMMENT (1826만행): LIMIT 1000 필수
`;
```

**검증 방법**:
- case6-retest9 실행 후 생성된 SQL에 SELECT * 포함 여부 확인

### 3.2 P0-2: 쿼리 검증 게이트

**현황**:
```
ReviewerSkill은 쿼리 결과만 검증
SQL 내용 자체는 검증하지 않음
```

**개발 내용**:
```javascript
// security/sql-validator.js (신규)
export class SQLValidator {
  static validate(sql) {
    const violations = [];

    // SELECT * 검출
    if (/SELECT\s+\*\s+FROM/i.test(sql)) {
      violations.push({
        type: 'SELECT_STAR_FORBIDDEN',
        severity: 'CRITICAL',
        message: 'SELECT * 사용 금지 - 필요한 컬럼만 명시하세요'
      });
    }

    // 민감 컬럼 검출
    const sensitiveColumns = ['U_PASSWD', 'U_EMAIL', 'U_SID', 'U_TEL'];
    for (const col of sensitiveColumns) {
      if (new RegExp(`\\b${col}\\b`, 'i').test(sql)) {
        violations.push({
          type: 'SENSITIVE_COLUMN_ACCESS',
          severity: 'CRITICAL',
          column: col
        });
      }
    }

    return { valid: violations.length === 0, violations };
  }
}
```

### 3.3 P1-1: Phase B Reviewer 호출

**현황**:
```
설계 문서 생성 후 품질 검증 없이 바로 저장
설계 vs 실제 동작 비교: Phase B Reviewer 미호출
```

**개발 내용**:
```javascript
// orchestrator.js - runDesignPhase() 수정
async runDesignPhase(prdContent, analysisResults) {
  // 1. Leader Agent로 설계 문서 생성
  const designResult = await this.leader.generateDesignDocuments(prdContent, analysisResults);

  // 2. [추가] Reviewer Skill로 품질 검증
  const reviewer = new ReviewerSkill({ projectRoot: this.projectRoot });
  const reviewResult = await reviewer.validate(designResult.documents, {
    scope: ['structure', 'completeness', 'prd_match'],
    minScore: 80
  });

  if (!reviewResult.passed) {
    console.warn('[Phase B] Reviewer FAIL - 재생성 필요');
    // 피드백 반영 후 재생성 로직
  }

  // 3. 파일 저장
  await this.saveDesignDocuments(designResult.documents);
}
```

### 3.4 P1-2: 케이스별 모드 자동 선택

**현황**:
```
DB 연동 필요: Extension 모드 권장 (안전한 쿼리)
DB 연동 불필요: Retest 모드 권장 (풍부한 화면)
현재는 수동 선택 필요
```

**개발 내용**:
```javascript
// agents/prd-analyzer.js 수정
const DB_KEYWORDS = [
  /회원\s*조회/i, /데이터\s*분석/i, /통계/i, /실시간/i,
  /로그인\s*패턴/i, /세그먼트/i, /분포\s*분석/i,
  /DB/i, /쿼리/i, /테이블/i, /집계/i, /SELECT/i
];

function determineMode(prdContent) {
  const requiresDB = DB_KEYWORDS.some(pattern => pattern.test(prdContent));

  return {
    mode: requiresDB ? 'extension' : 'pipeline',
    reason: requiresDB
      ? 'DB 연동 키워드 감지 → Extension 모드 (안전한 쿼리)'
      : 'DB 연동 불필요 → Pipeline 모드 (풍부한 화면)'
  };
}
```

### 3.5 P2-1: Query Library 도입

**현황**:
```
Analysis Agent가 동적으로 SQL 생성 → 비결정적 결과
extension1의 SDD 사전 정의 쿼리가 더 안전
```

**개발 내용**:
```
orchestrator/queries/
├── library.json              # 쿼리 메타데이터
├── segment/
│   ├── active_users.sql      # 활성 회원 세그먼트
│   ├── user_distribution.sql # 회원 분포
│   └── login_pattern.sql     # 로그인 패턴
└── README.md                 # 사용 가이드
```

```json
// library.json
{
  "queries": [
    {
      "id": "segment_active_users",
      "name": "활성 회원 세그먼트 조회",
      "file": "segment/active_users.sql",
      "tables": ["USERS", "CODE_MASTER"],
      "parameters": ["start_date", "end_date"],
      "prd_keywords": ["활성", "세그먼트", "회원 분류"]
    }
  ]
}
```

---

## 4. 개발 일정

### 마일스톤 1: 보안 강화 ✅ 완료 (2025-12-26)

| 일차 | 작업 | 담당 | 상태 |
|------|------|------|------|
| D+1 | SELECT * 금지 규칙 추가 | Analysis Agent | ✅ 완료 |
| D+1 | 민감 컬럼 블랙리스트 추가 | DB_ACCESS_POLICY | ✅ 완료 |
| D+1 | 쿼리 검증 게이트 구현 | Security Layer | ✅ 완료 |
| D+1 | Phase B Reviewer 호출 추가 | Orchestrator | ✅ 완료 |

**검증 결과**: case6-retest9 실행 → SELECT * 0% / Phase B Reviewer 100점 PASS

### 마일스톤 2: 품질 개선 (진행 예정)

| 일차 | 작업 | 담당 | 상태 |
|------|------|------|------|
| D+2~3 | 케이스별 모드 자동 선택 | PRD Analyzer | ⏳ 예정 |
| D+4 | 토큰 추적 분리 | Metrics | ⏳ 예정 |

### 마일스톤 3: 기능 확장 (진행 예정)

| 일차 | 작업 | 담당 | 상태 |
|------|------|------|------|
| D+5~7 | Query Library 구현 | Analysis Agent | ⏳ 예정 |
| D+8~9 | Doc-Sync (Notion) 구현 | Skills | ⏳ 예정 |
| D+10~11 | Skill 모듈 분리 | Architecture | ⏳ 예정 |

---

## 5. 테스트 계획

### 5.1 P0 검증 테스트

```bash
# SELECT * 금지 검증
node orchestrator/index.js --prd docs/cases/case6/PRD.md --task-id case6-retest9

# 확인 항목:
# 1. 생성된 SQL에 SELECT * 없어야 함
# 2. 민감 컬럼 (U_PASSWD, U_EMAIL 등) 조회 없어야 함
# 3. 감사 로그에 차단 기록 있어야 함
```

### 5.2 P1 검증 테스트

```bash
# Phase B Reviewer 검증
node orchestrator/index.js --prd docs/cases/case6/PRD.md --task-id case6-retest10

# 확인 항목:
# 1. 로그에 "[Phase B] Reviewer PASS" 또는 "FAIL" 출력
# 2. Reviewer 점수 80점 이상
```

### 5.3 회귀 테스트

| 테스트 | 예상 결과 |
|--------|----------|
| case6-retest9 | SELECT * 없음, 4개 문서 생성 |
| case5-dormancy | 기존 동작 유지 |
| case4-analysis | 기존 동작 유지 |

---

## 6. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| Query Library가 PRD 커버 못함 | AI 동적 생성 fallback | 미매칭 시 SELECT * 금지된 동적 생성 |
| Phase B Reviewer로 지연 | 2~3분 추가 소요 | 병렬 실행 검토 |
| Skill 분리로 호환성 깨짐 | 기존 코드 수정 필요 | 점진적 마이그레이션 |

---

## 7. 성공 지표

| 지표 | retest8 | retest9 | 목표 | 달성 |
|------|---------|---------|------|------|
| SELECT * 발생률 | 80% (4/5) | **0% (0/3)** | 0% | ✅ |
| Phase B Reviewer 호출률 | 0% | **100%** | 100% | ✅ |
| 민감 컬럼 노출 | 17개+ | **0개** | 0개 | ✅ |
| 설계 문서 품질 점수 | - | **100점** | 80점+ | ✅ |
| Hallucination 발생률 | ~40% | **TBD** | < 5% | ⏳ |

---

## 8. 참조 문서

| 문서 | 경로 |
|------|------|
| Orchestrator 작동 원리 | `docs/reports/20251224-Orchestrator 작동 원리 및 LLM 개입 시점+아키텍쳐요약.md` |
| 설계 vs 실제 동작 비교 | `docs/reports/20251224-설계 vs 실제 동작 비교.md` |
| 품질 비교 보고서 v04 | `docs/develo-report/case6-retest8 vs extension 품질 비교 보고서-v04.md` |
| 아키텍처 설계 | `.claude/workflows/AGENT_ARCHITECTURE.md` |

---

**END OF REPORT**
