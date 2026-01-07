# HANDOFF_PROTOCOL.md

> **버전**: 2.4.0 | **수정일**: 2026-01-07
> **정의**: 업무 지시/보고 형식
> **대상**: Leader, ImLeader | **로딩**: 전체

---

## HANDOFF 개요

### HANDOFF란?

HANDOFF.md는 Leader가 하위 Role(Analyzer, Designer, Coder)에게 업무를 지시하는 **표준화된 업무 지시서**입니다.

| 항목       | 설명                                                |
| ---------- | --------------------------------------------------- |
| **생성자** | Leader                                              |
| **소비자** | Analyzer, Designer, Coder (파이프라인에 따라 다름)  |
| **저장소** | `docs/cases/{caseId}/{taskId}/HANDOFF.md`           |
| **저장자** | Orchestrator (Leader 출력에서 추출하여 파일로 저장) |

### 파이프라인별 HANDOFF 흐름

| Pipeline          | HANDOFF 소비자              | 설명                      |
| ----------------- | --------------------------- | ------------------------- |
| `analysis`        | Analyzer                    | SQL 분석 지시             |
| `design`          | Designer                    | IA/WF/SDD 설계 지시       |
| `code`            | Coder                       | 구현 지시 (기존 SDD 필수) |
| `analyzed_design` | Analyzer → Designer         | 분석 후 설계 지시         |
| `ui_mockup`       | Designer → Coder            | 설계 후 화면 구현 지시    |
| `full`            | Analyzer → Designer → Coder | 전체 파이프라인 지시      |

---

## HANDOFF.md 양식

### 필수 섹션

```markdown
## Pipeline

{analysis | design | code | analyzed_design | ui_mockup | full}

## TargetRole

{Analyzer | Designer | Coder}

## TaskSummary

{PRD에서 추출한 핵심 목표 1-2줄 요약}

## Input

- docs/cases/{caseId}/{taskId}/PRD.md (또는 이전 Phase 산출물)
- .claude/rules/DOMAIN_SCHEMA.md

## Output

- {예상 산출물 파일 경로}

## Constraints

- {준수해야 할 제약 조건}

## CompletionCriteria

- {검증 가능한 완료 조건}
```

### 섹션 설명

| 섹션                   | 필수 | 설명                         |
| ---------------------- | ---- | ---------------------------- |
| **Pipeline**           | ✅   | PRD_GUIDE.md 정의 참조       |
| **TargetRole**         | ✅   | 이 HANDOFF를 수행할 Role     |
| **TaskSummary**        | ✅   | PRD 핵심 목표 요약           |
| **Input**              | ✅   | 참조해야 할 문서/파일 목록   |
| **Output**             | ✅   | 생성해야 할 파일 목록        |
| **Constraints**        | ✅   | 준수해야 할 제약 조건        |
| **CompletionCriteria** | ✅   | 완료 기준 (검증 가능한 조건) |

---

## Role별 HANDOFF 예시

### Analyzer용 HANDOFF (Phase A)

```markdown
## Pipeline

analysis

## TargetRole

Analyzer

## TaskSummary

활성 회원 세그먼트 분석 (HEAVY/MEDIUM/LIGHT 분류)

## Input

- docs/cases/{caseId}/{taskId}/PRD.md
- .claude/rules/DOMAIN_SCHEMA.md

## Output

- docs/cases/{caseId}/{taskId}/analysis/\*.sql
- docs/cases/{caseId}/{taskId}/analysis/analysis_result.json
- docs/cases/{caseId}/{taskId}/analysis/report.md

## Constraints

- SELECT 쿼리만 사용
- 대용량 테이블 LIMIT 필수
- DOMAIN_SCHEMA.md 컬럼명 준수

## CompletionCriteria

- SQL 문법 유효
- 실행 결과 존재
- 리포트 인사이트 포함
```

### Designer용 HANDOFF (Phase B)

```markdown
## Pipeline

design

## TargetRole

Designer

## TaskSummary

활성 회원 대시보드 UI 설계

## Input

- docs/cases/{caseId}/{taskId}/PRD.md
- docs/cases/{caseId}/{taskId}/analysis/report.md (분석 결과, 있는 경우)
- .claude/rules/DOMAIN_SCHEMA.md

## Output

- docs/cases/{caseId}/{taskId}/IA.md
- docs/cases/{caseId}/{taskId}/Wireframe.md
- docs/cases/{caseId}/{taskId}/SDD.md

## Constraints

- 기존 레거시 스키마 활용
- 신규 테이블 생성 지양

## CompletionCriteria

- IA 계층 구조 완성
- Wireframe ASCII 다이어그램 포함
- SDD API 엔드포인트 정의
```

### Coder용 HANDOFF (Phase C)

```markdown
## Pipeline

code

## TargetRole

Coder

## TaskSummary

활성 회원 대시보드 API 및 UI 구현

## Input

- docs/cases/{caseId}/{taskId}/HANDOFF.md
- docs/cases/{caseId}/{taskId}/IA.md
- docs/cases/{caseId}/{taskId}/SDD.md
- .claude/rules/DOMAIN_SCHEMA.md

## Output

- backend/src/features/{feature}/index.ts
- backend/tests/{feature}.test.ts
- frontend/src/features/{feature}/\*.tsx

## Constraints

- TypeScript 필수
- TDD 방식
- DOMAIN_SCHEMA.md 컬럼명 준수
- PRD 직접 참조 금지 (SDD만 참조)

## CompletionCriteria

- 빌드 성공 (`npm run build` 또는 `tsc --noEmit`)
- 테스트 PASS
- 타입체크 PASS
- **엔트리포인트 연결** (main.tsx에서 import/렌더링)
- **구동 테스트** (`npm run dev` 실행 후 렌더링 확인)
```

> ⚠️ **v2.3.0 추가**: 코드 산출물은 반드시 엔트리포인트 연결 및 구동 테스트까지 완료해야 합니다.

---

## 완료 보고 양식

Coder가 Implementation Leader에게 검증을 요청할 때 사용합니다.

### 성공 보고 (Success Report)

```markdown
## 완료 보고: {feature-name}

### 상태

- SUCCESS

### 생성된 파일

- backend/src/features/{feature}/index.ts
- backend/tests/{feature}.test.ts

### 실행 결과

- 테스트: PASS (5/5)
- 타입체크: PASS
- 빌드: SUCCESS
- **엔트리포인트 연결**: ✅ (main.tsx에서 import 확인)
- **구동 테스트**: ✅ (`npm run dev` 실행 후 렌더링 확인)

### 이슈

- 없음
```

### 실패 보고 (Failure Report)

Coder가 테스트를 통과하지 못했거나 구현에 실패했을 때 사용합니다.

```markdown
## 실패 보고: {feature-name}

### 상태

- FAILED

### 원인

- [ ] 테스트 실패 (Logic Error)
- [ ] 타입 에러 (Compilation Error)
- [ ] 스키마 불일치 (Schema Violation)
- [ ] 기타 (Environment/Dependency)

### 상세 로그

- (에러 메시지나 로그 스니펫 붙여넣기)

### 요청 사항

- (Leader에게 설계 수정 요청 or 추가 정보 요청)
```

> **Implementation Leader 액션**: 이 보고를 받고 "재시도(Retry)"를 할지 "설계 수정(Reject)"을 할지 판단합니다.

---

## HandoffValidator 검증 항목

오케스트레이터가 HANDOFF.md를 검증할 때 확인하는 항목입니다.

| 검증            | 내용                                                             |
| --------------- | ---------------------------------------------------------------- |
| **필수 섹션**   | Pipeline, TargetRole, Input, Output, Constraints                 |
| **Pipeline 값** | analysis, design, code, analyzed_design, ui_mockup, full 중 하나 |
| **보안 패턴**   | "ignore previous", "bypass security" 등 차단                     |

---

## 보안 필터링

HANDOFF.md에 다음 패턴이 포함되면 **자동 거부**됩니다:

- `ignore previous instructions`
- `bypass security`
- `disregard all rules`
- `you are now`
- `system prompt`

**END OF HANDOFF_PROTOCOL.md**
