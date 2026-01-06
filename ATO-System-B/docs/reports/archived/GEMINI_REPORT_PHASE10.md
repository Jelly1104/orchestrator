# Gemini 보고서: Phase 10 - Viewer UI HITL 통합

**작성일**: 2025-12-22
**버전**: v3.5.1
**커밋**: `c5a239e`

---

## 1. 요청 사항 (Gemini 조언)

Gemini로부터 받은 Viewer UI HITL 통합 요구사항:

| # | 요구사항 | 설명 |
|---|----------|------|
| 1 | Dashboard 상태 배지 | `PAUSED_HITL` 상태 시 주황색 "Waiting for Approval" 표시 |
| 2 | HITLRequestCard 컴포넌트 | 체크포인트 정보, 경과 시간, Context, Approve/Reject 버튼 |
| 3 | Resume Guide UX (Critical) | 승인 후 "터미널에서 오케스트레이터를 다시 실행하여 작업을 재개하세요" 안내 |
| 4 | Real-time 업데이트 | WebSocket `hitl_pending` / `hitl_resolved` 이벤트 처리 |

---

## 2. 구현 완료 내역

### 2.1 Dashboard StatusBadge 확장

**파일**: `orchestrator/viewer/src/components/Dashboard.tsx`

```typescript
interface StatusBadgeProps {
  status: 'SUCCESS' | 'FAIL' | 'PAUSED_HITL' | 'RUNNING';
  checkpoint?: string;
}
```

| 상태 | 색상 | 라벨 |
|------|------|------|
| `SUCCESS` | 초록 | SUCCESS |
| `FAIL` | 빨강 | FAIL |
| `PAUSED_HITL` | 주황(amber) | Waiting for Approval |
| `RUNNING` | 파랑 | RUNNING |

체크포인트 정보 표시:
```
[Waiting for Approval]
@ DESIGN_APPROVAL
```

### 2.2 HITLPanel 전면 개편

**파일**: `orchestrator/viewer/src/components/HITLPanel.tsx`

#### 체크포인트별 매핑 (CHECKPOINT_INFO)

| Checkpoint | Label | Icon | Color | Description |
|------------|-------|------|-------|-------------|
| `PRD_REVIEW` | PRD 검토 | 📋 | amber | PRD에 필수 항목이 누락되었습니다 |
| `QUERY_REVIEW` | SQL 검증 | ⚠️ | red | 위험한 SQL 쿼리가 감지되었습니다 |
| `DESIGN_APPROVAL` | 설계 승인 | 📐 | blue | 설계 문서가 생성되었습니다 |
| `MANUAL_FIX` | 수동 수정 | 🔧 | purple | AI가 3회 연속 실패했습니다 |
| `DEPLOY_APPROVAL` | 배포 승인 | 🚀 | green | 모든 작업이 완료되었습니다 |

#### Context-specific 정보 표시

```typescript
interface HITLRequest {
  context?: {
    message?: string;
    files?: Record<string, string | null>;        // DESIGN_APPROVAL
    dangerousQueries?: Array<{ type: string; query: string }>;  // QUERY_REVIEW
    missing?: string[];                           // PRD_REVIEW
    retryCount?: number;                          // MANUAL_FIX
    reviewScore?: number;                         // DEPLOY_APPROVAL
  };
}
```

### 2.3 Resume Guide 구현 (Critical)

#### Toast 컴포넌트
```typescript
function Toast({ message, type, onClose }) {
  // 승인 성공 시 Resume guide 표시
  {type === 'success' && (
    <p className="text-sm mt-2 opacity-90">
      터미널에서 오케스트레이터를 다시 실행하여 작업을 재개하세요.
    </p>
  )}
}
```

#### Detail Panel 하단 안내
```html
<div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
  <p className="text-blue-400 text-sm">
    <strong>참고:</strong> 승인 후 터미널에서 오케스트레이터를 다시 실행해야 작업이 재개됩니다.
  </p>
</div>
```

### 2.4 Real-time 업데이트 (기존 구현 확인)

**파일**: `orchestrator/viewer/src/App.tsx`

```typescript
const handleWSMessage = useCallback((msg: WSMessage) => {
  if (msg.type === 'hitl_pending') {
    setHitlCount(prev => prev + 1);
  }
  if (msg.type === 'hitl_resolved') {
    setHitlCount(prev => Math.max(0, prev - 1));
  }
}, [refresh]);
```

---

## 3. 타입 확장

**파일**: `orchestrator/viewer/src/types/index.ts`

```typescript
export interface TaskSummary {
  taskId: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAIL' | 'PAUSED_HITL' | 'RUNNING';  // 확장
  totalTokens: number;
  duration: string;
  checkpoint?: string;  // 추가
}
```

---

## 4. UI 스크린샷 설명

### HITL Panel 구조

```
┌─────────────────────────────────────────────────────────────┐
│ 🔔 HITL 승인 대기열                           [3 대기]  ✕ │
├───────────────────────┬─────────────────────────────────────┤
│ 📐 [설계 승인]        │  ┌─────────────────────────────────┐│
│   task-abc123         │  │ 📐 설계 승인                    ││
│   ⏱️ 5분 전           │  │ 설계 문서가 생성되었습니다.     ││
├───────────────────────┤  └─────────────────────────────────┘│
│ ⚠️ [SQL 검증]         │  Task ID: task-abc123              │
│   task-def456         │  Phase: Design                      │
│   ⏱️ 10분 전          │  대기 시간: 5분 전                  │
├───────────────────────┤                                     │
│ 🔧 [수동 수정]        │  ┌─ 생성된 설계 문서 ─────────────┐│
│   task-ghi789         │  │ 📄 ERD.md  📄 SEQUENCE.md      ││
│   ⏱️ 1시간 전         │  └─────────────────────────────────┘│
│                       │                                     │
│                       │  [코멘트 입력]                      │
│                       │  [거부 사유 입력]                   │
│                       │                                     │
│                       │  [✓ 승인] [✗ 거부] [↻ 재실행]     │
│                       │                                     │
│                       │  ┌─────────────────────────────────┐│
│                       │  │ℹ️ 승인 후 터미널에서 오케스트  ││
│                       │  │레이터를 다시 실행해야 작업이    ││
│                       │  │재개됩니다.                       ││
│                       │  └─────────────────────────────────┘│
├───────────────────────┴─────────────────────────────────────┤
│ ↻ 새로고침            Human-In-The-Loop 승인 시스템 v1.1   │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. 체크리스트

| # | 요구사항 | 상태 | 비고 |
|---|----------|------|------|
| 1 | Dashboard 상태 배지 (PAUSED_HITL → 주황색) | ✅ | StatusBadge 확장 |
| 2 | HITLRequestCard (체크포인트 정보, 시간, Context) | ✅ | HITLPanel 내 구현 |
| 3 | Resume Guide UX (터미널 재실행 안내) | ✅ | Toast + 상시 안내 |
| 4 | Real-time 업데이트 (WebSocket) | ✅ | 기존 구현 확인 |
| 5 | Dark Mode 테마 유지 | ✅ | Tailwind 클래스 사용 |
| 6 | 기존 로그 뷰어 기능 유지 | ✅ | 변경 없음 |

---

## 6. 파일 변경 요약

| 파일 | 변경 내용 |
|------|-----------|
| `Dashboard.tsx` | StatusBadge 확장 (PAUSED_HITL, RUNNING, checkpoint) |
| `HITLPanel.tsx` | CHECKPOINT_INFO, Context 표시, Toast, Resume guide |
| `types/index.ts` | TaskSummary 타입 확장 |

**총 변경**: 3 files, +419 lines, -205 lines

---

## 7. 다음 단계 제안

1. **E2E 테스트**: Playwright/Cypress로 HITL 승인 플로우 테스트
2. **Notification 확장**: 브라우저 알림, Slack 연동
3. **Dashboard 통계**: HITL 평균 대기 시간, 승인/거부 비율 차트

---

**보고 완료**: Phase 10 Viewer UI HITL 통합
