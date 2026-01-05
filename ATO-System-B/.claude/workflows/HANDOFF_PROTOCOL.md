# HANDOFF_PROTOCOL.md

> **문서 버전**: 2.1.0

> **최종 업데이트**: 2026-01-05

> **물리적 경로**: `.claude/workflows/HANDOFF_PROTOCOL.md`

> **목적**: Leader → 모든 Role 업무 지시서 양식 정의

> **로딩 시점**: Leader가 각 Role에게 작업 지시 시 Just-in-Time Injection

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

- 빌드 성공
- 테스트 PASS
- 타입체크 PASS
```

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

## Circuit Breaker 정책 (v1.1.0)

> **목적**: Implementation Leader와 Coder 간의 무한 핑퐁 루프 방지

### 재시도 상한 (Max Retries)

| 조건                     | 동작                                      |
| ------------------------ | ----------------------------------------- |
| 재시도 1~3회             | Coder가 피드백 반영 후 재구현             |
| 재시도 4회 (마지막 기회) | Orchestrator가 "최종 시도" 경고 플래그 ON |
| 재시도 5회 초과          | **HITL 강제 전환** (사용자 개입 요청)     |

### Fallback 전략

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Circuit Breaker Flow                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Coder → Impl Leader → FAIL (1회차)                                        │
│          ↓                                                                  │
│  Coder (수정) → Impl Leader → FAIL (2회차)                                  │
│          ↓                                                                  │
│  Coder (수정) → Impl Leader → FAIL (3회차)                                  │
│          ↓                                                                  │
│  ⚠️ 마지막 기회 플래그                                                       │
│  Coder (수정) → Impl Leader → FAIL (4회차)                                  │
│          ↓                                                                  │
│  🔴 HITL 강제 전환: "사람이 직접 검토해야 합니다"                             │
│          ↓                                                                  │
│  Options:                                                                   │
│    A. 사람이 직접 코드 수정                                                  │
│    B. Impl Leader 검증 기준 완화 (PO 승인 필요)                              │
│    C. 작업 취소 (Cancel)                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Orchestrator 구현 가이드

```javascript
// orchestrator.js 내 Circuit Breaker 로직
const MAX_RETRIES = 5;

if (currentRetry >= MAX_RETRIES) {
  await hitlManager.requestHumanIntervention({
    type: "MANUAL_FIX",
    reason: `Coder-ImplLeader 핑퐁 ${MAX_RETRIES}회 초과`,
    context: { taskId, lastFeedback, failedFiles },
  });
  return { status: "PAUSED_FOR_HITL" };
}
```

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

---

## 변경 이력

| 버전  | 날짜       | 변경 내용                                                                            |
| ----- | ---------- | ------------------------------------------------------------------------------------ |
| 2.1.0 | 2026-01-05 | Mode → Pipeline 용어 통일 (PRD_GUIDE.md와 일관성 확보)                               |
| 2.0.1 | 2026-01-05 | 미구현 Zod 스키마 검증 섹션 삭제 (구현 시 코드와 함께 문서화 예정)                   |
| 2.0.0 | 2026-01-05 | 모든 Role(Analyzer, Designer, Coder) 범용 지시서로 확장, 경로 {caseId}/{taskId} 통일 |
| 1.2.0 | 2025-12-29 | Circuit Breaker 정책 추가                                                            |
| 1.0.0 | 2025-12-27 | 초기 버전 (Coder 전용)                                                               |

---

**END OF HANDOFF_PROTOCOL.md**
