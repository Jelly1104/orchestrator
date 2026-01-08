# PRD_GUIDE.md

> **버전**: 3.0.0 | **수정일**: 2026-01-08
> **정의**: PRD 분석 및 Gap Check 가이드
> **대상**: Leader | **로딩**: 작업 시

---

## PRD Gap Check

> **시점**: Phase 진입 전, PRD 입력 직후
> **목적**: PRD 필수 항목 누락 여부 확인 및 보완 요청

### 필수 항목 (4개)

| 항목                             | 질문           | 검증 기준                              |
| -------------------------------- | -------------- | -------------------------------------- |
| **목적** (Objective)             | 왜 만드는가?   | "~를 위해 ~를 만든다" 형태로 요약 가능 |
| **타겟 유저** (Target User)      | 누가 쓰는가?   | 페르소나/역할 명확 정의                |
| **핵심 기능** (Core Features)    | 무엇을 하는가? | 테스트 가능한 단위 (동사+목적어)       |
| **성공 지표** (Success Criteria) | 어떻게 판단?   | 정량 측정 또는 명확한 완료 조건        |

### 누락 시 질문

```
"PRD에서 [항목명]이 명확하지 않습니다. 어떻게 정의하면 될까요?"
```

### Gap Check 흐름

```
PRD 입력 → Leader가 필수 4개 항목 확인
  ├─ 모두 충족 → HANDOFF 생성 → Phase 진입
  └─ 누락 있음 → 사용자에게 질문 (HITL) → 보완 후 재확인
```

---

## 파이프라인 정의

> **파이프라인 타입**: 6가지 파이프라인(analysis, design, code, analyzed_design, ui_mockup, full) 정의는 `ROLE_ARCHITECTURE.md`의 **파이프라인 타입** 섹션 참조

> **🔑 HANDOFF 필수**: 모든 파이프라인은 Leader가 생성한 `HANDOFF.md`를 기반으로 실행됩니다.
>
> - Leader → `{ pipeline: "...", handoff: {...} }` 출력
> - 해당 Phase의 Role이 HANDOFF를 입력으로 받아 작업 수행

---

## 조건부 필수 항목

### 데이터 요구사항 (analysis 파이프라인 필수)

> analysis, analyzed_design, full 파이프라인인 경우 PRD에 데이터 요구사항 포함 필수

```yaml
data_requirements:
  tables:
    - name: {테이블명}
      columns: [{컬럼1}, {컬럼2}, ...]

db_connection:
  host: "{호스트}"
  database: "{DB명}"
```

---

## PRD 완성도 체크

| 구분   | 항목                               | 체크 |
| ------ | ---------------------------------- | :--: |
| 필수   | 목적, 타겟, 기능, 지표             | [ ]  |
| 조건부 | 데이터 요구사항 (analysis 포함 시) | [ ]  |
| 선택   | 참조 서비스, 제약사항              | [ ]  |

**검증 규칙**:

1. 필수 4개 미충족 → PRD 보완 요청
2. analysis/analyzed_design/full인데 데이터 요구사항 없음 → 보완 요청

**END OF PRD_GUIDE.md**
