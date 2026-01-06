# PRD 템플릿 (LITE v2)

> **용도**: 인간 + Claude Code 수동 실행용 / Extension 경량 Orchestrator
> **특징**: Phase 구분 없이 단순화된 구조, Skills 연동 지원
> **버전**: 2.0.0
> **최종 업데이트**: 2026-01-06

---

## 사용 방법

1. `{placeholder}` 형식의 값을 실제 내용으로 대체
2. 불필요한 섹션은 삭제 가능
3. 완성된 PRD는 `.claude/project/PRD.md`에 저장
4. Extension에서 `/skill-name` 형식으로 개별 skill 호출 가능

---

# PRD: {프로젝트명}

| 항목          | 내용                |
| ------------- | ------------------- |
| **Case ID**   | {case-id}           |
| **PRD 버전**  | 1.0.0               |
| **작성일**    | {YYYY-MM-DD}        |
| **작성자**    | {작성자명}          |
| **참조 문서** | DOMAIN_SCHEMA.md    |

---

## Skills 연동 (Extension용)

> Extension에서 경량 Orchestrator 실행 시 사용할 Skills 정의

```yaml
# 사용할 Skills 목록 (순서대로 실행)
skills:
  - query           # SQL 생성 및 데이터 분석
  - profiler        # 세그먼트 프로파일링
  - designer        # IA/Wireframe/SDD 설계
  - coder           # 코드 구현
  - reviewer        # 품질 검증

# 입력 파일 (Skills가 참조할 문서)
input:
  handoff: docs/cases/{caseId}/{taskId}/HANDOFF.md
  schema: .claude/rules/DOMAIN_SCHEMA.md

# 출력 경로 (Skills 산출물 저장 위치)
output:
  analysis: docs/cases/{caseId}/{taskId}/analysis/
  design: docs/cases/{caseId}/{taskId}/
  code:
    backend: backend/src/features/{feature}/
    frontend: frontend/src/features/{feature}/
```

### Skills 개별 실행 예시

```bash
# Extension에서 슬래시 커맨드로 개별 실행
/query          # SQL 쿼리 생성
/designer       # IA/Wireframe/SDD 설계
/coder          # 코드 구현
/reviewer       # 품질 검증

# 또는 조합 실행
/query → /profiler → /designer
```

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

| ID  | 기능명     | 설명               | 검증 방법          | Skill    |
| --- | ---------- | ------------------ | ------------------ | -------- |
| F1  | {기능명1}  | {기능 설명}        | {어떻게 검증할지}  | {skill}  |
| F2  | {기능명2}  | {기능 설명}        | {어떻게 검증할지}  | {skill}  |
| F3  | {기능명3}  | {기능 설명}        | {어떻게 검증할지}  | {skill}  |

> **Skill 매핑**: 각 기능을 담당할 Skill 명시 (query, designer, coder 등)

---

## 성공 지표 (Success Criteria)

### 정량적 지표

| 지표       | 목표값     | 측정 방법           |
| ---------- | ---------- | ------------------- |
| {지표명1}  | {목표값}   | {측정 방법}         |
| {지표명2}  | {목표값}   | {측정 방법}         |

### 정성적 지표

| 지표       | 판단 기준              |
| ---------- | ---------------------- |
| {지표명1}  | {어떤 기준으로 판단}   |
| {지표명2}  | {어떤 기준으로 판단}   |

---

## 데이터 요구사항 (선택)

> DB 조회가 필요한 경우에만 작성

```yaml
tables:
  - name: {테이블명}
    columns: [{컬럼1}, {컬럼2}, ...]
    usage: {용도 설명}
```

---

## 제약사항 (Constraints)

| 카테고리   | 항목       | 설명                |
| ---------- | ---------- | ------------------- |
| **보안**   | {항목명}   | {제약사항 설명}     |
| **성능**   | {항목명}   | {제약사항 설명}     |
| **규격**   | {항목명}   | {제약사항 설명}     |

---

## 산출물 체크리스트 (Deliverables)

- [ ] {산출물1}
- [ ] {산출물2}
- [ ] {산출물3}

---

**END OF PRD**
