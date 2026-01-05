# Pipeline Refactoring 작업 내역 (DD-2025-003)

> **작성일**: 2025-12-31
> **최종 수정**: 2026-01-05
> **상태**: Completed
> **목적**: 파이프라인 타입 4개 → 6개 확장 및 HITL 아키텍처 변경

---

## 1. 작업 배경

### 1.1 파이프라인 타입 변경

| 기존 (4개) | 신규 (6개)      | 설명              |
| ---------- | --------------- | ----------------- |
| analysis   | analysis        | A만 (유지)        |
| design     | design          | B만 (유지)        |
| mixed      | analyzed_design | A → B (이름 변경) |
| -          | code            | C만 (신규)        |
| -          | ui_mockup       | B → C (신규)      |
| -          | full            | A → B → C (신규)  |

### 1.2 HITL 아키텍처 변경

**AS-IS**: 고정 체크포인트 방식

```
Phase A 완료 → [HITL: 분석 결과 승인] → Phase B
Phase B 완료 → [HITL: 설계 승인] → Phase C
Phase C 완료 → [HITL: 배포 승인] → Deploy
```

**TO-BE**: 검증 실패 시에만 HITL

```
Phase 완료 → ImpLeader 자동 검증 → {Objective Rules Pass?}
  ├─ YES → DocSync → 다음 Phase 또는 완료
  └─ NO  → HITL Review → 3-way 옵션
              ├─ Exception Approval (이번만 예외)
              ├─ Rule Override (규칙 수정)
              └─ Reject → 해당 Phase 재작업
```

---

## 2. 완료된 작업

### 2.1 LLM용 문서 수정

| 파일                 | 버전   | 수정 내용                                                 |
| -------------------- | ------ | --------------------------------------------------------- |
| ROLE_ARCHITECTURE.md | v3.2.0 | 6개 파이프라인 타입, 현재/목표 테이블 분리, SDD 제약 추가 |
| ROLES_DEFINITION.md  | v1.5.0 | 6개 router 값, Coder PRD 참조 금지, SDD↔Code 정합성       |
| PRD_GUIDE.md         | v2.3.0 | 6개 키워드/파이프라인 섹션 (3.1~3.6)                      |
| DOCUMENT_PIPELINE.md | v1.4.1 | 6개 타입별 흐름 상세, 스타일 통일                         |
| HANDOFF_PROTOCOL.md  | v2.1.0 | Mode → Pipeline 용어 통일, 6개 타입 검증                  |

### 2.2 인간용 문서 수정

| 파일      | 섹션                                 | 수정 내용                 |
| --------- | ------------------------------------ | ------------------------- |
| README.md | 1-2 Role-Based Collaboration Model   | HITL 플로우 다이어그램    |
| README.md | 2-1 Phase 기반 파이프라인 흐름       | 6개 분기, HITL 3-way 옵션 |
| README.md | 3-2 Orchestrator vs Leader 역할 구분 | 6개 router 값 테이블      |
| README.md | 5-2 PRD 파이프라인 라우팅            | 6개 분기 다이어그램       |

### 2.3 계획 문서

| 파일                             | 버전   | 추가 내용                  |
| -------------------------------- | ------ | -------------------------- |
| 20251230-파이프라인재정의계획.md | v5.6.0 | 섹션 8 HITL AS-IS vs TO-BE |

### 2.4 코드 수정 (2026-01-05 완료)

| 파일             | 수정 내용                                               |
| ---------------- | ------------------------------------------------------- |
| orchestrator.js  | mixed → analyzed_design 전환, 4개 신규 파이프라인 함수  |
| prd-analyzer.js  | 6개 타입 판별 로직 (inferPipeline 함수)                 |
| index.js         | CLI 6개 파이프라인 지원, completedPhases 로직           |
| PRD_CHECKLIST.md | pipeline 필드 6개 타입 반영                             |

---

## 3. 완료된 작업 상세

### 3.1 문서 수정

- [x] README.md: 섹션 5-2 PRD 파이프라인 라우팅 다이어그램 6개 분기
- [x] README.md: 섹션 5-3 문서 파이프라인 플로우 재작성
- [x] ROLE_ARCHITECTURE.md: 섹션 4 HITL 체크포인트 재정의
- [x] DOCUMENT_PIPELINE.md: HITL 설명 TO-BE로 변경
- [x] HANDOFF_PROTOCOL.md: Mode → Pipeline 용어 통일

### 3.2 코드 수정

- [x] orchestrator.js: runMixedPipeline → runAnalyzedDesignPipeline 이름 변경
- [x] orchestrator.js: runFullPipeline 구현 (A→B→C)
- [x] orchestrator.js: runCodePipeline 추가 (C만)
- [x] orchestrator.js: runUiMockupPipeline 추가 (B→C)
- [x] orchestrator.js: 라우터에 6개 케이스 추가
- [x] orchestrator.js: VALID_PIPELINES 6개로 확장
- [x] orchestrator.js: _getPipelineVisual() 6개 타입 지원
- [x] orchestrator.js: _determineRoutingDecision() 업데이트
- [x] prd-analyzer.js: inferPipeline() 6개 타입 판별 로직
- [x] index.js: CLI 도움말 및 completedPhases 로직

---

## 4. 주요 변경 사항 상세

### 4.1 SDD 기반 코드 구현 제약

**Phase C 설명 변경**:

- 기존: "HANDOFF 기반 코드 구현"
- 변경: "**SDD 기반 코드 구현 (PRD 직접 참조 금지)**"

**code 타입 제약**:

- "**SDD/HANDOFF가 이미 존재하는 경우에 한해 구현만 수행**"
- 가드: `if (!exists(SDD.md)) → HITL: Design Skip Approval`

**Coder 입출력 제약**:

```
| **제약** | PRD.md 직접 참조 금지 | Coder는 SDD/HANDOFF만 참조해야 함 |
```

**ImpLeader 검증 항목**:

```
| 구현 코드 | C | **SDD ↔ Code 정합성**, 보안, 로직 정확성, 테스트 |
```

### 4.2 현재 구현 상태

| 타입            | Phase 조합 | 상태      |
| --------------- | ---------- | --------- |
| analysis        | A만        | ✅ 구현됨 |
| design          | B만        | ✅ 구현됨 |
| analyzed_design | A → B      | ✅ 구현됨 |
| code            | C만        | ✅ 구현됨 |
| ui_mockup       | B → C      | ✅ 구현됨 |
| full            | A → B → C  | ✅ 구현됨 |

### 4.3 문서 참조 스타일 변경

**기존** (금지됨):

```
ROLES_DEFINITION(§2)
섹션 7
```

**변경** (권장됨):

```
Leader (PM & Commander)
PRD 파이프라인 라우팅 섹션
```

---

## 5. 코드 변경 상세

### 5.1 orchestrator.js 주요 변경

```javascript
// VALID_PIPELINES 확장
const VALID_PIPELINES = ['analysis', 'design', 'analyzed_design', 'code', 'ui_mockup', 'full', 'auto'];

// 타입 매핑 변경
const typeToPipeline = {
  'QUANTITATIVE': 'analysis',
  'QUALITATIVE': 'design',
  'MIXED': 'analyzed_design'  // mixed → analyzed_design
};

// 라우팅 분기 추가
if (selectedPipeline === 'analyzed_design') {
  return await this.runAnalyzedDesignPipeline(...);
}
if (selectedPipeline === 'code') {
  return await this.runCodePipeline(...);
}
if (selectedPipeline === 'ui_mockup') {
  return await this.runUiMockupPipeline(...);
}
if (selectedPipeline === 'full') {
  return await this.runFullPipeline(...);
}
```

### 5.2 prd-analyzer.js inferPipeline() 로직

```javascript
inferPipeline(type, prdContent = '', deliverables = []) {
  // SDD/HANDOFF 존재 여부로 code 파이프라인 감지
  const hasExistingSDD = /##\s*SDD|software\s*design\s*document/i.test(prdContent);
  const hasExistingHandoff = /##\s*HANDOFF|##\s*Mode/i.test(prdContent);

  if (type === 'QUALITATIVE') {
    if (hasExistingSDD && hasExistingHandoff) {
      return 'code';  // C만 (이미 설계 완료)
    }
    if (hasPhaseCOutput) {
      return 'ui_mockup';  // B → C
    }
    return 'design';  // B만
  }
  // ...
}
```

### 5.3 신규 파이프라인 함수

| 함수                       | Phase 조합 | 주요 로직                              |
| -------------------------- | ---------- | -------------------------------------- |
| runAnalyzedDesignPipeline  | A → B      | Phase A 실행 → Phase B 실행 → 종료     |
| runCodePipeline            | C만        | SDD 존재 검증 → Phase C 실행           |
| runUiMockupPipeline        | B → C      | Phase B 실행 → Phase C 실행            |
| runFullPipeline            | A → B → C  | Phase A → B → C 순차 실행              |

---

## 6. 테스트 체크리스트

### 6.1 파이프라인 실행 테스트

- [ ] analysis 파이프라인: Phase A만 실행되는지
- [ ] design 파이프라인: Phase B만 실행되는지
- [ ] code 파이프라인: Phase C만 실행되는지
- [ ] analyzed_design 파이프라인: Phase A → B에서 종료되는지
- [ ] ui_mockup 파이프라인: Phase B → C 실행되는지
- [ ] full 파이프라인: Phase A → B → C 실행되는지

### 6.2 HITL 테스트

- [ ] ImpLeader 자동 검증 PASS → HITL 없이 진행
- [ ] ImpLeader 자동 검증 FAIL → HITL Review 진입
- [ ] Exception Approval → 해당 실행만 예외 통과
- [ ] Rule Override → 규칙 수정 후 진행
- [ ] Reject → 해당 Phase 재작업

### 6.3 예외 케이스 테스트

- [ ] Case 01: 빈 PRD → Gap Check FAIL
- [ ] Case 02: 필수 섹션 누락 → Gap Check 경고
- [ ] Case 03: 잘못된 파이프라인 타입 → FAIL
- [ ] Case 05: 초대형 PRD → 토큰 제한 경고

---

## 7. 관련 문서

| 문서                 | 경로                                          | 역할                         |
| -------------------- | --------------------------------------------- | ---------------------------- |
| 계획 문서            | docs/reports/20251230-파이프라인재정의계획.md | 전체 계획 및 체크리스트      |
| ROLE_ARCHITECTURE.md | .claude/workflows/                            | 시스템 지도 (Orchestrator용) |
| ROLES_DEFINITION.md  | .claude/workflows/                            | Role별 매뉴얼 (LLM용)        |
| PRD_GUIDE.md         | .claude/workflows/                            | PRD 작성 가이드              |
| DOCUMENT_PIPELINE.md | .claude/workflows/                            | 문서 생성 파이프라인         |
| HANDOFF_PROTOCOL.md  | .claude/workflows/                            | HANDOFF 양식 정의            |
| README.md            | .claude/                                      | 인간용 시각적 가이드         |

---

## 8. 변경 이력

| 날짜       | 변경 내용                                              |
| ---------- | ------------------------------------------------------ |
| 2025-12-31 | 초안 작성, 문서 수정 완료                              |
| 2026-01-05 | 코드 수정 완료: orchestrator.js, prd-analyzer.js, index.js |
| 2026-01-05 | 6개 파이프라인 전체 구현 완료, 상태 Completed로 변경   |

---

**END OF DOCUMENT**
