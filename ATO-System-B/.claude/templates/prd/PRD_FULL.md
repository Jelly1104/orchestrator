# PRD_FULL.md

> **버전**: 1.0.0 | **수정일**: 2026-01-06
> **정의**: 전체 PRD 템플릿 (Orchestrator용)
> **대상**: Human | **로딩**: 필요 시

---

## 사용 방법

1. `{placeholder}` 형식의 값을 실제 내용으로 대체
2. `pipeline` 값에 따라 필요한 Phase만 작성
3. 완성된 PRD는 `.claude/project/PRD.md`에 저장
4. Orchestrator가 자동으로 파이프라인 라우팅

---

# PRD: {프로젝트명}

| 항목          | 내용                                                |
| ------------- | --------------------------------------------------- |
| **Case ID**   | {case-id}                                           |
| **PRD 버전**  | 1.0.0                                               |
| **작성일**    | {YYYY-MM-DD}                                        |
| **작성자**    | {작성자명}                                          |
| **Pipeline**  | {analysis|design|code|analyzed_design|ui_mockup|full} |
| **참조 문서** | PRD_GUIDE.md, DOMAIN_SCHEMA.md, DB_ACCESS_POLICY.md |

---

## 목적 (Objective)

{이 기능이 해결하려는 문제와 목표를 1-2문장으로 명확하게 기술}

> **요약**: "{한 줄 요약}"

---

## 타겟 유저 (Target User)

| 항목              | 설명                       |
| ----------------- | -------------------------- |
| **Persona**       | {대상 사용자 특성}         |
| **Pain Point**    | {현재 겪는 불편함}         |
| **Needs**         | {필요로 하는 것}           |
| **사용 시나리오** | {언제/어디서/어떻게 사용}  |

---

## 핵심 기능 (Core Features)

| ID  | Phase | 기능명     | 설명               | 검증 방법          |
| --- | ----- | ---------- | ------------------ | ------------------ |
| F1  | A     | {기능명1}  | {기능 설명}        | {어떻게 검증할지}  |
| F2  | B     | {기능명2}  | {기능 설명}        | {어떻게 검증할지}  |
| F3  | C     | {기능명3}  | {기능 설명}        | {어떻게 검증할지}  |

---

## 성공 지표 (Success Criteria)

### 정량적 지표 (Phase A - 자동 검증)

| 지표       | 목표값     | 측정 방법        | 실패 시 조치     |
| ---------- | ---------- | ---------------- | ---------------- |
| {지표명1}  | {목표값}   | {측정 방법}      | {조치 방법}      |
| {지표명2}  | {목표값}   | {측정 방법}      | {조치 방법}      |

### 정성적 지표 (Phase B - HITL 검증)

| 지표       | 판단 기준              | 검증자         |
| ---------- | ---------------------- | -------------- |
| {지표명1}  | {어떤 기준으로 판단}   | Human Reviewer |
| {지표명2}  | {어떤 기준으로 판단}   | Human Reviewer |

---

## PRD 유형 및 파이프라인

```yaml
pipeline: {analysis|design|code|analyzed_design|ui_mockup|full}
rationale: "{이 파이프라인을 선택한 이유}"

phases:
  - id: A
    name: Analysis
    input: {입력 문서}
    output: {산출물 목록}

  - id: B
    name: Design
    input: Phase A 결과물
    output: {산출물 목록}

  - id: C
    name: Implementation
    input: Phase B 결과물 + HANDOFF.md
    output:
      - {산출물1}
      - {산출물2}
```

---

## 데이터 요구사항 (Data Requirements)

### 대상 테이블

```yaml
data_requirements:
  tables:
    - name: {테이블명}
      columns: [{컬럼1}, {컬럼2}, ...]
      row_count: {예상 행 수}
      risk_level: {LOW|MEDIUM|HIGH|EXTREME}
      index_columns: [{인덱스 컬럼}]

db_connection:
  host: "{호스트}"
  database: "{DB명}"
  account: "ai_readonly"
  permission: SELECT_ONLY
```

### SQL 제약 사항

| #   | 제약 사항                       | 검증 방법     |
| --- | ------------------------------- | ------------- |
| 1   | {제약사항1}                     | {검증 방법}   |
| 2   | {제약사항2}                     | {검증 방법}   |

---

## 레퍼런스 서비스 (Reference)

| 서비스         | 참고 패턴          | 적용 포인트         |
| -------------- | ------------------ | ------------------- |
| {서비스명1}    | {어떤 패턴}        | {무엇을 참고}       |
| {서비스명2}    | {어떤 패턴}        | {무엇을 참고}       |

---

## 산출물 체크리스트 (Deliverables)

### Phase A (Analysis)

```yaml
deliverables:
  - name: "{파일명}"
    type: {SQL_QUERY|ANALYSIS_TABLE}
    criteria:
      - {기준1}
      - {기준2}
    validation: {검증 방법}
```

### Phase B (Design)

```yaml
deliverables:
  - name: "{파일명}"
    type: {REPORT|METADATA}
    criteria:
      - {기준1}
      - {기준2}
    validation: {검증 방법}
```

### Phase C (Implementation)

```yaml
deliverables:
  - name: "{컴포넌트명}"
    type: SOURCE_CODE
    location: "{경로}"
    criteria:
      - {기준1}
      - {기준2}
    validation: {검증 방법}
```

---

## 제약사항 (Constraints)

| 카테고리     | 항목       | 설명                          |
| ------------ | ---------- | ----------------------------- |
| **보안**     | {항목명}   | {제약사항 설명}               |
| **성능**     | {항목명}   | {제약사항 설명}               |
| **규격**     | {항목명}   | {제약사항 설명}               |
| **톤앤매너** | {항목명}   | {제약사항 설명}               |

---

## HITL 체크포인트

| Phase  | 체크포인트     | 승인 조건              | 실패 시            |
| ------ | -------------- | ---------------------- | ------------------ |
| A→B    | {체크포인트명} | {승인 조건}            | Phase A 재실행     |
| B→C    | {체크포인트명} | {승인 조건}            | 대본 수정 요청     |
| C 완료 | {체크포인트명} | {승인 조건}            | 코드 수정 요청     |
| 최종   | {체크포인트명} | {승인 조건}            | 배포 보류          |

---

## 변경 이력

| 버전  | 날짜       | 변경 내용     |
| ----- | ---------- | ------------- |
| 1.0.0 | {날짜}     | 초기 버전     |

---

**END OF PRD**
