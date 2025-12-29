# HANDOFF_PROTOCOL.md

> **문서 버전**: 1.2.0
> **최종 업데이트**: 2025-12-29
> **물리적 경로**: `.claude/workflows/HANDOFF_PROTOCOL.md`
> **목적**: Leader → Coder 업무 지시서 양식 정의
> **로딩 시점**: Leader가 Coder에게 작업 지시 시 Just-in-Time Injection

---

## 1. HANDOFF.md 양식

Leader가 Coder에게 구현을 지시할 때 반드시 이 양식을 따릅니다.

### 1.1 필수 섹션

```markdown
## Mode

Coding

## Input

- docs/cases/{caseId}/IA.md
- docs/cases/{caseId}/SDD.md
- .claude/rules/DOMAIN_SCHEMA.md

## Output

- backend/src/features/{feature}/index.ts
- backend/tests/{feature}.test.ts

## Constraints

- TypeScript 필수
- TDD 방식
- DOMAIN_SCHEMA.md 컬럼명 준수

## CompletionCriteria

- 빌드 성공
- 테스트 PASS
```

### 1.2 섹션 설명

| 섹션                   | 필수 | 설명                                    |
| ---------------------- | ---- | --------------------------------------- |
| **Mode**               | ✅   | coding, review, test, refactor, debug   |
| **Input**              | ✅   | 참조해야 할 문서/파일 목록              |
| **Output**             | ✅   | 생성해야 할 파일 목록                   |
| **Constraints**        | ✅   | 준수해야 할 제약 조건                   |
| **CompletionCriteria** | ✅   | 완료 기준 (검증 가능한 조건)            |

---

## 2. 완료 보고 양식

Coder가 Implementation Leader에게 검증을 요청할 때 사용합니다.

### 2.1 성공 보고 (Success Report)

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

### 2.2 실패 보고 (Failure Report)

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

## 3. Circuit Breaker 정책 (v1.1.0)

> **목적**: Implementation Leader와 Coder 간의 무한 핑퐁 루프 방지

### 3.1 재시도 상한 (Max Retries)

| 조건                     | 동작                                      |
| ------------------------ | ----------------------------------------- |
| 재시도 1~3회             | Coder가 피드백 반영 후 재구현             |
| 재시도 4회 (마지막 기회) | Orchestrator가 "최종 시도" 경고 플래그 ON |
| 재시도 5회 초과          | **HITL 강제 전환** (사용자 개입 요청)     |

### 3.2 Fallback 전략

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

### 3.3 Orchestrator 구현 가이드

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

## 4. HandoffValidator 검증 항목

오케스트레이터가 HANDOFF.md를 검증할 때 확인하는 항목입니다.

| 검증          | 내용                                          |
| ------------- | --------------------------------------------- |
| **필수 섹션** | Mode, Input, Output, Constraints              |
| **Mode 값**   | coding, review, test, refactor, debug 중 하나 |
| **보안 패턴** | "ignore previous", "bypass security" 등 차단  |

---

## 5. 보안 필터링

HANDOFF.md에 다음 패턴이 포함되면 **자동 거부**됩니다:

- `ignore previous instructions`
- `bypass security`
- `disregard all rules`
- `you are now`
- `system prompt`

---

## 6. LLM 출력 스키마 검증 (Zod)

> **목적**: LLM이 생성한 HANDOFF.md나 JSON 결과물의 형식 검증

### 6.1 왜 필요한가?

LLM(Role)이 생성한 산출물이 형식을 지키지 않을 경우, Orchestrator(JS)가 파싱에 실패하여 전체 파이프라인이 중단될 수 있습니다. Zod 라이브러리를 사용하여 엄격한 스키마 검증을 수행합니다.

### 6.2 HANDOFF.md 스키마

```typescript
import { z } from "zod";

export const HandoffSchema = z.object({
  mode: z.enum(["coding", "review", "test", "refactor", "debug"]),
  input: z.array(z.string()).min(1),
  output: z.array(z.string()).min(1),
  constraints: z.array(z.string()),
  completionCriteria: z.array(z.string()),
});

export type Handoff = z.infer<typeof HandoffSchema>;
```

### 6.3 완료 보고 스키마

```typescript
export const CompletionReportSchema = z.object({
  status: z.enum(["SUCCESS", "FAILED"]),
  featureName: z.string(),
  generatedFiles: z.array(z.string()),
  testResult: z.object({
    passed: z.number(),
    total: z.number(),
  }).optional(),
  typeCheck: z.enum(["PASS", "FAIL"]).optional(),
  buildStatus: z.enum(["SUCCESS", "FAIL"]).optional(),
  issues: z.array(z.string()),
  // FAILED 전용 필드
  failureCause: z.enum([
    "Logic Error",
    "Compilation Error",
    "Schema Violation",
    "Environment/Dependency"
  ]).optional(),
  detailLog: z.string().optional(),
  requestToLeader: z.string().optional(),
});
```

### 6.4 Auto-fix 메커니즘

LLM 출력 파싱 실패 시 자동으로 재요청하는 로직입니다.

```javascript
// orchestrator.js 내 Auto-fix 로직
const MAX_PARSE_RETRIES = 2;

async function parseWithAutoFix(rawOutput, schema, role) {
  for (let i = 0; i < MAX_PARSE_RETRIES; i++) {
    const result = schema.safeParse(rawOutput);

    if (result.success) {
      return result.data;
    }

    // 파싱 실패 시 LLM에게 형식 수정 요청
    const fixPrompt = `
출력 형식이 올바르지 않습니다. 다음 오류를 수정하여 다시 출력하세요:

[오류 내용]
${result.error.format()}

[필수 형식]
${JSON.stringify(schema.shape, null, 2)}
    `;

    rawOutput = await role.call(fixPrompt);
  }

  throw new Error(`${role.name} 출력 파싱 ${MAX_PARSE_RETRIES}회 실패`);
}
```

### 6.5 Orchestrator 통합 예시

```javascript
// 실제 사용 예시
const handoffRaw = await leader.generateHandoff(prd);
const handoff = await parseWithAutoFix(handoffRaw, HandoffSchema, leader);

// 스키마 검증 통과 후 Coder에게 전달
await coder.execute(handoff);
```

---

**END OF HANDOFF_PROTOCOL.md**
