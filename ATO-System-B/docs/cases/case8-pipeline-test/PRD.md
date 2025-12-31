# PRD: Pipeline Refactoring 테스트

| 항목          | 내용                           |
| ------------- | ------------------------------ |
| **Case ID**   | case8-pipeline-test            |
| **PRD 버전**  | 1.0.0                          |
| **작성일**    | 2025-12-30                     |
| **작성자**    | ATO Team                       |
| **Type**      | MIXED                          |
| **Pipeline**  | mixed                          |
| **참조 문서** | DOMAIN_SCHEMA.md               |

---

## 1. 목적 (Objective)

Pipeline Refactoring 작업 검증을 위한 테스트 케이스입니다.
- `mixed` 파이프라인이 Phase A → Phase B에서 정상 종료되는지 확인
- 새로운 CLI UX (`printCompletionReport`) 출력 형식 검증

---

## 2. 타겟 유저 (Target User)

| 항목          | 설명                    |
| ------------- | ----------------------- |
| **Persona**   | ATO 개발팀              |
| **Pain Point** | 파이프라인 테스트 필요  |
| **Needs**     | mixed 파이프라인 검증   |

---

## 3. 핵심 기능 (Core Features)

| ID  | Phase | 기능명            | 설명                                      |
| --- | ----- | ----------------- | ----------------------------------------- |
| F1  | A     | 활성 사용자 조회  | USERS 테이블에서 활성 사용자 카운트       |
| F2  | B     | 분석 리포트 작성  | 조회 결과를 바탕으로 간단한 리포트 작성   |

---

## 4. 성공 지표 (Success Criteria)

| 지표              | 목표값              | 측정 방법        |
| ----------------- | ------------------- | ---------------- |
| Phase A 완료      | SQL 실행 성공       | 쿼리 결과 확인   |
| Phase B 완료      | 리포트 생성         | 파일 존재 확인   |
| Phase C 미실행    | Phase C 스킵됨      | 로그 확인        |

---

## 5. PRD 유형 및 파이프라인

```yaml
type: MIXED
pipeline: mixed
rationale: "mixed 파이프라인은 Phase A→B만 실행하고 Phase C는 실행하지 않음"

phases:
  - id: A
    name: Analysis
    agent: AnalysisAgent
    output: active_users.sql

  - id: B
    name: Design
    agent: LeaderAgent
    output: Analysis_Report.md
```

---

## 6. 데이터 요구사항 (Data Requirements)

```yaml
data_requirements:
  tables:
    - name: USERS
      columns: [U_ID, U_KIND, U_ALIVE]
      risk_level: LOW
```

---

## 7. 산출물 체크리스트 (Deliverables)

### Phase A (Analysis)

```yaml
deliverables:
  - name: "active_users.sql"
    type: SQL_QUERY
    criteria:
      - SELECT문만 사용
      - LIMIT 포함
```

### Phase B (Design)

```yaml
deliverables:
  - name: "Analysis_Report.md"
    type: REPORT
    criteria:
      - 분석 결과 요약
```

---

## 변경 이력

| 버전  | 날짜       | 변경 내용    |
| ----- | ---------- | ------------ |
| 1.0.0 | 2025-12-30 | 초기 버전    |

---

**END OF PRD**
