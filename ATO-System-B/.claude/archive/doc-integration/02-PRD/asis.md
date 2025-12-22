# 02-PRD AS-IS

> **분석 대상**: PRD 관련 3종
> - `.claude/global/PRD_TEMPLATE_V2.md`
> - `.claude/global/PRD_TYPE_PIPELINE.md`
> - `.claude/global/PRD_REFERENCE_MAP.md`
> **분석일**: 2025-12-18

---

## 📊 현황 요약

| 문서 | 크기 | 예상 토큰 | 현재 로딩 Agent |
|------|------|----------|----------------|
| PRD_TEMPLATE_V2.md | ~15,400자 | ~3,800 토큰 | ❌ 없음 |
| PRD_TYPE_PIPELINE.md | ~11,600자 | ~2,900 토큰 | ❌ 없음 |
| PRD_REFERENCE_MAP.md | ~7,200자 | ~1,800 토큰 | ❌ 없음 |
| **합계** | **~34,200자** | **~8,500 토큰** | - |

---

## 📄 각 문서 핵심 내용

### 1. PRD_TEMPLATE_V2.md (v2.0.0)

**목적**: PRD 작성 템플릿 - 필수 6개 + 선택 6개 항목

**핵심 구조**:
```
필수 항목 (6개):
├── 1. 목적 (Objective)
├── 2. 타겟 유저 (Target User)
├── 3. 핵심 기능 (Core Features)
├── 4. 성공 지표 (Success Criteria)
├── 5. PRD 유형 (Type) ⭐ NEW in v2
│   └── QUANTITATIVE | QUALITATIVE | MIXED
└── 6. 파이프라인 (Pipeline) ⭐ NEW in v2
    └── analysis | design | mixed

선택 항목 (6개):
├── 제약사항
├── 데이터 요구사항 (정량적 PRD 필수!)
├── 레퍼런스
├── 산출물 유형
├── 범위 (In/Out of Scope)
└── 타임라인
```

**v2 핵심 변경**: Case #4/#5 교훈 반영 → type/pipeline 필드 필수화

---

### 2. PRD_TYPE_PIPELINE.md (v1.0)

**목적**: PRD 유형 판별 + 파이프라인 라우팅

**핵심 구조**:
```
1. PRD 유형 분류 기준
├── 1.1 유형 판별 매트릭스 (정량/정성/혼합)
├── 1.2 키워드 기반 판별
│   ├── quantitative_keywords: 분석, 통계, SQL, 쿼리...
│   ├── qualitative_keywords: 설계, UX, 제안...
│   └── mixed_indicators: 분석 → 제안
└── 1.3 산출물 기반 판별

2. 유형별 처리 파이프라인
├── 2.1 정량적 PRD 파이프라인
│   └── Step 1~5: 데이터 파싱 → 쿼리 설계 → 실행 → 해석 → 산출물
├── 2.2 정성적 PRD 파이프라인
│   └── Step 1~5: 요구사항 분석 → 아키텍처 → 상세 설계 → 구현 → 산출물
└── 2.3 혼합 PRD 파이프라인
    └── Phase 1(분석) → Phase 2(설계)
```

**PRDAnalyzer 연관성**: 유형 판별 알고리즘의 원본

---

### 3. PRD_REFERENCE_MAP.md (v1.0)

**목적**: PRD 키워드 → 유사 서비스/패턴 자동 매핑

**핵심 구조**:
```
카테고리별 레퍼런스:
├── 2.1 데이터 분석 → Amplitude, Mixpanel
├── 2.2 CRUD 서비스 → Admin 템플릿
├── 2.3 온보딩/가이드 → Slack, Notion
├── 2.4 커뮤니케이션 → GitHub, Slack
└── 2.5 시각화 → Google Analytics, Tableau
```

**활용 시점**: PRD에 레퍼런스가 없을 때 자동 제안

---

## 🔍 현재 Agent 로딩 현황

### prd-analyzer.js
```javascript
// ❌ 3개 문서 모두 로딩하지 않음!
// 하드코딩된 키워드만 사용

const QUANTITATIVE_KEYWORDS = [
  '분석', '통계', '세그먼트', '코호트', ...
];

// PRD_TYPE_PIPELINE.md의 내용을 코드에 하드코딩
```

### leader.js
```javascript
// ❌ PRD 템플릿/파이프라인 문서 로딩 없음
// PRD.md만 직접 읽음
```

---

## ⚠️ 문제점

1. **문서-코드 불일치**: PRD_TYPE_PIPELINE.md의 키워드가 prd-analyzer.js에 하드코딩 → 문서 수정해도 코드에 반영 안됨
2. **템플릿 미참조**: PRD_TEMPLATE_V2.md가 있지만 PRD 검증 시 참조하지 않음
3. **레퍼런스 미활용**: PRD_REFERENCE_MAP.md가 설계 단계에서 활용되지 않음

---

## 📊 중복 분석

| 중복 항목 | 문서 A | 문서 B | 중복도 |
|----------|--------|--------|--------|
| 유형 판별 기준 | TEMPLATE_V2 섹션5 | TYPE_PIPELINE 섹션1 | ~70% |
| 파이프라인 설명 | TEMPLATE_V2 섹션6 | TYPE_PIPELINE 섹션2 | ~60% |
| 키워드 매칭 | TYPE_PIPELINE 1.2 | REFERENCE_MAP 전체 | ~30% |

---

## 📁 원본 파일 위치

```
/Users/m2-mini/Desktop/eunah/Medi-Notion/.claude/global/PRD_TEMPLATE_V2.md
/Users/m2-mini/Desktop/eunah/Medi-Notion/.claude/global/PRD_TYPE_PIPELINE.md
/Users/m2-mini/Desktop/eunah/Medi-Notion/.claude/global/PRD_REFERENCE_MAP.md
```
