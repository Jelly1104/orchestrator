# Gemini 보고서: HITL Flow E2E Test

**작성일**: 2025-12-22
**버전**: v1.0.0
**커밋**: `d4583dd`

---

## 1. 테스트 개요

System B (HITL Orchestrator + Viewer)의 전체 흐름을 검증하는 E2E 테스트 구현

### 테스트 파일

| 파일 | 설명 |
|------|------|
| `tests/e2e/hitl_flow.test.js` | Vitest 기반 테스트 (의존성 필요) |
| `tests/e2e/hitl_flow_runner.js` | Node.js 직접 실행 스크립트 |

### 실행 방법

```bash
cd orchestrator
node tests/e2e/hitl_flow_runner.js
```

---

## 2. 테스트 시나리오

### Happy Path: Full HITL Cycle

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: Start   →  Step 2: Pause  →  Step 3: Approve  →  Step 4: Resume  │
│  ───────────────    ─────────────     ───────────────     ──────────────  │
│  RUNNING            PAUSED_HITL       APPROVED            RUNNING         │
│  Phase: Planning    Checkpoint:       Queue cleared       Phase: Coding   │
│                     DESIGN_APPROVAL   HITL file removed   (Design skipped)│
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 테스트 결과

### 실행 결과

```
╔════════════════════════════════════════════════════════════════╗
║                      TEST SUMMARY                              ║
╠════════════════════════════════════════════════════════════════╣
║  Passed: 14                                                    ║
║  Failed: 0                                                     ║
╠════════════════════════════════════════════════════════════════╣
║  ALL TESTS PASSED ✓                                            ║
╚════════════════════════════════════════════════════════════════╝
```

### 상세 테스트 목록

| # | Test Name | Status |
|---|-----------|--------|
| 1 | Session should be created with RUNNING status | ✅ |
| 2 | Session should pause at DESIGN_APPROVAL checkpoint | ✅ |
| 3 | HITL request file should be created | ✅ |
| 4 | Dashboard should show amber badge | ✅ |
| 5 | HITL queue should have 1 pending request | ✅ |
| 6 | Session should be APPROVED after API call | ✅ |
| 7 | HITL request file should be removed | ✅ |
| 8 | HITL queue should be empty | ✅ |
| 9 | Resume check should return canResume=true | ✅ |
| 10 | Session should resume to Coding phase | ✅ |
| 11 | History should contain all events | ✅ |
| 12 | Rejection flow should work correctly | ✅ |
| 13 | Approve on non-paused session should throw | ✅ |
| 14 | Pause on non-existent session should throw | ✅ |

---

## 4. 검증된 기능

### Step 1: 작업 시작 (Start)

```javascript
// Expectation
SessionStore에 세션이 생성되고, 상태가 RUNNING이 되어야 함

// Result
✅ Session: e2e-hitl-test-001, Status: RUNNING, Phase: Planning
```

### Step 2: HITL 트리거 (Pause)

```javascript
// Expectations
1. 프로세스가 종료(process.exit)되어야 함 (시뮬레이션)
2. SessionStore 상태가 PAUSED_HITL로 저장되어야 함
3. Viewer 대시보드에 주황색 배지와 승인 카드가 나타나야 함

// Results
✅ Status: PAUSED_HITL, Checkpoint: DESIGN_APPROVAL
✅ HITL file: logs/.hitl/e2e-hitl-test-001.json
✅ Badge: [amber] Waiting for Approval
✅ Queue: 1 pending
```

### Step 3: 사용자 승인 (Viewer Action)

```javascript
// Expectations
1. SessionStore 상태가 APPROVED로 변경되어야 함
2. Viewer에서 카드가 사라지거나 완료 상태로 바뀌어야 함

// Results
✅ Status: APPROVED
✅ HITL file removed
✅ Queue: 0 pending
```

### Step 4: 작업 재개 (Resume)

```javascript
// Expectations
1. "🔄 HITL 승인 확인. 작업을 재개합니다." 로그가 출력되어야 함
2. 설계 단계를 건너뛰고 바로 다음 단계(Coding)로 진입해야 함

// Results
✅ Log: 🔄 HITL 승인 확인. 작업을 재개합니다.
✅ Status: RUNNING, Phase: Coding (Design skipped)
✅ Events: SESSION_CREATED → STATUS_CHANGED → PAUSED_FOR_HITL → HITL_APPROVED → STATUS_CHANGED
```

---

## 5. 추가 테스트 시나리오

### Rejection Path

```javascript
// Scenario
사용자가 HITL 요청을 거부하는 경우

// Result
✅ Status: REJECTED
✅ rejectionReason: "Too dangerous"
✅ Resume check: canResume=false, reason="HITL rejected"
```

### Edge Cases

| Case | Expected | Result |
|------|----------|--------|
| Approve on non-paused session | Throw error | ✅ "Invalid session state" |
| Pause on non-existent session | Throw error | ✅ "Session not found" |

---

## 6. 테스트 아키텍처

### Mock Components

```javascript
// MockOrchestrator
- startTask(): 세션 생성 및 RUNNING 상태 설정
- simulateDesignPhase(): LLM 호출 없이 설계 단계 시뮬레이션
- triggerHITL(): HITL 체크포인트 트리거
- checkResumeCondition(): 재개 가능 여부 확인
- resumeTask(): 승인된 세션 재개

// MockViewerAPI
- getQueue(): 대기 중인 HITL 요청 조회
- approve(): 세션 승인 (POST /api/tasks/:id/approve)
- reject(): 세션 거부 (POST /api/tasks/:id/reject)
- checkDashboardStatus(): 대시보드 배지 상태 확인
```

### Directory Structure

```
orchestrator/
├── tests/
│   └── e2e/
│       ├── hitl_flow.test.js       # Vitest 테스트
│       └── hitl_flow_runner.js     # Node.js 직접 실행
├── state/
│   └── sessions/                   # 세션 JSON 파일 (테스트 시 자동 정리)
└── logs/
    └── .hitl/                      # HITL 요청 파일 (테스트 시 자동 정리)
```

---

## 7. 다음 단계

| 우선순위 | 작업 | 설명 |
|----------|------|------|
| 1 | Viewer UI E2E | Playwright/Cypress로 실제 UI 테스트 |
| 2 | WebSocket E2E | hitl_pending/hitl_resolved 이벤트 검증 |
| 3 | Resume CLI E2E | `--resume` 플래그 통합 테스트 |
| 4 | Performance | 대량 세션 처리 성능 테스트 |

---

## 8. 결론

HITL 전체 흐름이 정상 동작함을 검증했습니다:

- **14개 테스트 모두 통과**
- Happy Path (Start → Pause → Approve → Resume) 완전 검증
- Rejection Path 검증
- Edge Case 처리 검증

**보고 완료**: HITL Flow E2E Test
