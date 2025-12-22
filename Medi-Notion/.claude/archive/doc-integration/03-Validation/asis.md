# 03-Validation AS-IS

> **분석 대상**: 검증 관련 3종
> - `.claude/global/OUTPUT_VALIDATION.md`
> - `.claude/global/PRD_GAP_CHECK.md`
> - `.claude/global/QUALITY_GATES.md`
> **분석일**: 2025-12-18

---

## 📊 현황 요약

| 문서 | 크기 | 예상 토큰 | 현재 로딩 Agent |
|------|------|----------|----------------|
| OUTPUT_VALIDATION.md | ~9,000자 | ~2,300 토큰 | ❌ 없음 |
| PRD_GAP_CHECK.md | ~10,500자 | ~2,600 토큰 | ❌ 없음 |
| QUALITY_GATES.md | ~10,200자 | ~2,500 토큰 | Leader (일부) |
| **합계** | **~29,700자** | **~7,400 토큰** | - |

---

## 📄 각 문서 핵심 내용

### 1. OUTPUT_VALIDATION.md (v1.1.0)

**목적**: 산출물 자동 검증 - Syntax, PRD 매칭, 스키마 정합성

**핵심 구조**:
```
검증 3단계:
├── Step 1: Syntax/Lint 검증
│   ├── INSERT/UPDATE/DELETE 금지
│   └── DROP/TRUNCATE/ALTER 금지
├── Step 2: PRD 체크리스트 매칭 (3단계 알고리즘)
│   ├── 1단계: 파일명 직접 매칭
│   ├── 2단계: 콘텐츠 키워드 매칭 (도메인 특화)
│   └── 3단계: SQL 블록 개별 매칭
└── Step 3: 스키마 정합성 검증
    └── DOMAIN_SCHEMA.md 대조
```

**파이프라인 위치**: 개발 후 검토 단계

---

### 2. PRD_GAP_CHECK.md (v1.1.0)

**목적**: PRD 분석 후 누락/모호한 부분 사전 확인

**핵심 구조**:
```
Gap Check 5단계:
├── Step 1: 필수 항목 체크 (목적, 타겟, 기능, 지표)
├── Step 2: 레퍼런스 매칭 (PRD_REFERENCE_MAP 참조)
├── Step 3: 간극 질문 생성
│   ├── 산출물 관련 확인
│   ├── 데이터 관련 확인
│   └── 제약사항 관련 확인
├── Step 4: 사용자 확인 (Y/N/E)
└── Step 5: 확정 PRD → OUTPUT_VALIDATION으로 전달
```

**도메인 키워드 맵**: 활성 회원, 전문과목, 근무형태 등 매핑

---

### 3. QUALITY_GATES.md (v1.5.0)

**목적**: 배포 전 최종 품질 검증 (최후의 수문장)

**핵심 구조**:
```
검증 영역 (11개):
├── 0. 환경 검증 (Pre-flight)
├── 1. 코드 품질 (Schema Compliance)
├── 2. 테스트 (커버리지 ≥ 90%)
├── 3. 보안 (PHI 보호, Full Scan 방지)
├── 4. 성능 (API 응답 목표)
├── 5. 문서 동기화
├── 6. Safety Check (룰북 불변성)
├── 7. LLM 호환성
├── 8. 통합 검증
├── 9. Orchestrator 자동 검증
└── 10. Output Validation 연동 (v1.5.0)
```

---

## 🔍 현재 Agent 로딩 현황

### leader.js
```javascript
// 현재 로딩하는 문서
'.claude/global/QUALITY_GATES.md'  // ✅ 로딩됨

// ❌ OUTPUT_VALIDATION.md 미로딩
// ❌ PRD_GAP_CHECK.md 미로딩
```

### output-validator.js
```javascript
// ❌ 문서 로딩 메서드 없음!
// OUTPUT_VALIDATION.md 내용이 코드에 하드코딩됨
```

### prd-analyzer.js
```javascript
// ❌ PRD_GAP_CHECK.md 미로딩
// 키워드 맵이 코드에 하드코딩됨
```

---

## ⚠️ 문제점

1. **문서-코드 불일치**: OUTPUT_VALIDATION.md와 PRD_GAP_CHECK.md의 로직이 코드에 하드코딩
2. **Leader만 QUALITY_GATES 로딩**: SubAgent, CodeAgent는 품질 기준 모름
3. **키워드 맵 분산**: PRD_GAP_CHECK.md와 prd-analyzer.js에 중복 정의
4. **검증 흐름 단절**: Gap Check → Output Validation 연동이 문서에만 있고 코드에 미반영

---

## 📊 중복 분석

| 중복 항목 | 문서 A | 문서 B | 중복도 |
|----------|--------|--------|--------|
| PRD 매칭 알고리즘 | OUTPUT_VALIDATION 섹션2.2 | QUALITY_GATES 섹션10.2 | ~80% |
| 도메인 키워드 맵 | PRD_GAP_CHECK 섹션9 | OUTPUT_VALIDATION 섹션2.2 | ~70% |
| 검증 결과 포맷 | OUTPUT_VALIDATION 섹션3 | QUALITY_GATES 섹션8,9 | ~50% |

---

## 📁 원본 파일 위치

```
/Users/m2-mini/Desktop/eunah/Medi-Notion/.claude/global/OUTPUT_VALIDATION.md
/Users/m2-mini/Desktop/eunah/Medi-Notion/.claude/global/PRD_GAP_CHECK.md
/Users/m2-mini/Desktop/eunah/Medi-Notion/.claude/global/QUALITY_GATES.md
```
