# 2025-12-31 예외케이스 테스트 및 파이프라인 수정

## 개요

ATO-System-B Orchestrator의 예외 케이스(Case 01-10) 테스트 및 버그 수정 작업

---

## 완료된 작업

### 1. Case 06 (Circular Reference) 버그 수정

**문제**: design 파이프라인이 Phase B에서 종료되지 않고 Phase C(코딩)까지 실행됨

**원인**: `isDesignOnly` 조건이 `options.mode === 'design'`일 때만 true로 설정됨

**수정 파일**: `orchestrator/orchestrator.js`

```javascript
// Before (Line 730-732)
const isDesignOnly = options.mode === 'design';

// After
const isDesignOnly = selectedPipeline === 'design' || options.mode === 'design';
```

---

### 2. Case 05 (Oversized PRD) - ReviewerTool에 prd_scope 검증 추가

**목적**: 초대형 PRD(165개 기능 > 50개 제한) 감지

**수정 파일**: `orchestrator/tools/reviewer/index.js`

#### 추가된 상수
```javascript
const WEIGHTS = {
  syntax: 0.10,
  semantic: 0.15,
  prd_match: 0.25,
  prd_scope: 0.10,  // PRD 범위 검증
  cross_ref: 0.40
};

const PASS_CRITERIA = {
  minScore: 80,
  maxHighIssues: 0,
  minPrdMatchRate: 0.80,
  maxFeaturesPerIteration: 50  // 단일 iteration 최대 기능 수
};
```

#### 추가된 메서드: `_validatePrdScope`
```javascript
async _validatePrdScope(prd) {
  // 체크리스트 항목 카운트 (- [ ] 패턴)
  const checklistMatches = content.match(/- \[ \]/g) || [];
  const featureCount = checklistMatches.length;

  const isOversized = featureCount > PASS_CRITERIA.maxFeaturesPerIteration;
  // ...
}
```

---

### 3. Verbose 로그 정리

사용자 피드백: "cli 출력이 너무 많아"

**수정 내용**:
- `orchestrator/tools/reviewer/index.js`: `this.log()` → `this.debug()`
- `orchestrator/tools/base/BaseTool.js`: initialize 로그를 debug로 변경

```javascript
// Before
this.log('Starting validation');

// After
this.debug('Starting validation');
```

---

### 4. 테스트 문서 생성

#### PRD-SUCCESS-A-analysis.md
- **위치**: `docs/cases/case-except/PRD-SUCCESS-A-analysis.md`
- **목적**: Analysis 파이프라인(Phase A만) 테스트용
- **핵심 기능**:
  - 의사 회원(U_KIND='DOC001') 중 활성(U_ALIVE='Y') 회원 수 조회
  - 최근 30일 로그인 기록 기준 활성/비활성 분류
  - 전문과목(U_MAJOR_CODE_1)별 분포 분석

#### PRD-SUCCESS-B-design.md
- **위치**: `docs/cases/case-except/PRD-SUCCESS-B-design.md`
- **목적**: Design 파이프라인(Phase B만) 테스트용
- **핵심 기능**:
  - 프로필 편집 화면 (기본 정보, 전문과목, 근무지, 프로필 사진)
  - 저장 및 취소 기능

#### 예외케이스-cli출력.md
- **위치**: `docs/cases/case-except/예외케이스-cli출력.md`
- **변경 사항**: README.md에서 이름 변경, Success A/B 예상 CLI 출력 추가

---

## 수정된 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `orchestrator/orchestrator.js` | isDesignOnly 조건 수정, _countPRDFeatures 제거 |
| `orchestrator/tools/reviewer/index.js` | prd_scope 검증 추가, verbose 로그 → debug |
| `orchestrator/tools/base/BaseTool.js` | initialize 로그 → debug |
| `docs/cases/case-except/PRD-SUCCESS-A-analysis.md` | 신규 생성 |
| `docs/cases/case-except/PRD-SUCCESS-B-design.md` | 신규 생성 |
| `docs/cases/case-except/예외케이스-cli출력.md` | README.md에서 이름 변경, 내용 추가 |

---

## TODO (다음 작업)

- [ ] Success A 파이프라인 CLI 실행 및 출력 검증
- [ ] Success B 파이프라인 CLI 실행 및 출력 검증
- [ ] C, analyzed_design, ui_mockup, full 파이프라인 PRD 및 예상 출력 추가

---

## 참고: 파이프라인 타입 정의

| 타입 | Phase 조합 | 상태 |
|------|-----------|------|
| `analysis` | A만 | ✅ 구현됨 |
| `design` | B만 | ✅ 구현됨 |
| `mixed` | A → B | ✅ 구현됨 |
| `code` | C만 | 🚧 미구현 |
| `analyzed_design` | A → B | 🚧 미구현 (mixed로 대체) |
| `ui_mockup` | B → C | 🚧 미구현 |
| `full` | A → B → C | 🚧 미구현 |

---

## 관련 문서

- `.claude/workflows/ROLE_ARCHITECTURE.md` - 파이프라인 아키텍처 정의
- `docs/cases/case-except/` - 예외 케이스 테스트 PRD 모음
