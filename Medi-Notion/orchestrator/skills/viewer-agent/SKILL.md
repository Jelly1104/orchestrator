# Viewer-Agent Skill

> **버전**: 1.4.0
> **최종 수정**: 2025-12-19
> **역할**: Orchestrator 결과 웹 뷰어 + 관제탑
> **상태**: ✅ **운영 중**

---

## 1. 개요

Orchestrator 파이프라인 실행 결과를 웹 대시보드에서 시각적으로 확인하고, **HITL(Human-in-the-Loop) 개입**을 가능하게 하는 **관제탑** 역할의 에이전트입니다.

> **핵심 가치**: 시스템의 **투명성(Transparency)**과 **통제권(Control)**을 제공

### 1.1 핵심 기능

| 기능 | 설명 | Phase | 상태 |
|------|------|-------|------|
| 대시보드 | 실행 목록 + 상태 배지 + 통계 | 1 | ✅ 완료 |
| 문서 뷰어 | Markdown 렌더링 | 1 | ✅ 완료 |
| 파일 트리 | 산출물 트리 구조 표시 | 1 | ✅ 완료 |
| 코드 뷰어 | SQL/TS 파일 보기 | 1 | ✅ 완료 |
| 실시간 모니터링 | WebSocket 기반 실행 상태 | 2 | ✅ 완료 |
| HITL 패널 | 승인/거부/피드백 UI | 3 | ✅ 완료 |
| 분석 시각화 | 차트, 테이블, 인사이트 카드 | 4 | 📋 예정 |

---

## 2. 아키텍처

```
orchestrator/viewer/
├── server.js              # Express API 서버
├── vite.config.ts         # Vite 설정
├── tailwind.config.js     # Tailwind 설정
├── index.html             # HTML 진입점
└── src/                   # React 프론트엔드
    ├── App.tsx
    ├── main.tsx
    ├── components/
    │   ├── Dashboard.tsx      # ✅ 메인 대시보드
    │   ├── TaskList.tsx       # ✅ 실행 목록
    │   ├── TaskDetail.tsx     # ✅ 상세 보기
    │   ├── DocViewer.tsx      # ✅ Markdown 뷰어
    │   ├── FileTree.tsx       # ✅ 파일 트리
    │   ├── CodeViewer.tsx     # ✅ 코드 뷰어
    │   ├── HITLPanel.tsx      # ✅ HITL 패널
    │   ├── RunningBanner.tsx  # ✅ 실행 배너
    │   └── WSStatus.tsx       # ✅ 연결 상태
    ├── hooks/
    │   ├── useTasks.ts        # ✅ 태스크 상태
    │   └── useWebSocket.ts    # ✅ WebSocket 연결
    ├── utils/
    │   └── formatters.ts      # ✅ 공통 포맷터
    └── types/
        └── index.ts           # ✅ 타입 정의
```

---

## 3. 기술 스택

### 3.1 Frontend (구현됨)
```yaml
Framework: React 18 + TypeScript
Build: Vite
Styling: Tailwind CSS
State: React hooks (useState, useEffect)
Markdown: react-markdown + remark-gfm
WebSocket: Native WebSocket API
```

### 3.2 Backend (구현됨)
```yaml
Server: Express
Realtime: WebSocket (ws)
API: RESTful JSON
CORS: cors 미들웨어
```

---

## 4. API 명세

### 4.1 기존 API (v1.0)

| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/logs` | GET | 실행 로그 목록 |
| `/api/logs/:taskId` | GET | 로그 상세 |
| `/api/docs/:taskId` | GET | 설계 문서 목록 |
| `/api/docs/:taskId/:filename` | GET | 문서 내용 |
| `/api/files` | GET | 생성된 파일 목록 |
| `/api/file?path=` | GET | 파일 내용 |

### 4.2 Phase 3 확장 (HITL)

| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/tasks/:taskId/approve` | POST | 체크포인트 승인 |
| `/api/tasks/:taskId/reject` | POST | 체크포인트 거부 |
| `/api/tasks/:taskId/feedback` | POST | 피드백 전송 |
| `/api/tasks/:taskId/rerun` | POST | 재실행 트리거 |

---

## 5. 명령어

```bash
# 개발 서버 실행
node orchestrator/viewer/server.js

# 프론트엔드 개발
cd orchestrator/viewer && npm run dev

# 프로덕션 빌드
cd orchestrator/viewer && npm run build
```

---

## 6. 연동

### 6.1 Orchestrator 연동
- `orchestrator/logs/` 디렉토리 모니터링
- 실행 중 상태는 WebSocket으로 전송

### 6.2 HITL 연동
- `AGENT_ARCHITECTURE.md` 섹션 0.5 참조
- 체크포인트: PRD 검증, 구현 검토, 최종 승인

---

## 7. ReviewAgent 연동

ReviewAgent 결과를 시각적 성적표(Scorecard)로 표시:

### 7.1 Scorecard 컴포넌트

```tsx
// components/ReviewScorecard.tsx
interface ReviewResult {
  passed: boolean;
  score: number;
  details: {
    syntax: { score: number };
    semantic: { score: number };
    prd_match: { score: number };
    cross_ref: { score: number };
  };
  issues: Issue[];
}

const ReviewScorecard: React.FC<{ result: ReviewResult }> = ({ result }) => (
  <div className={`p-4 rounded ${result.passed ? 'bg-green-50' : 'bg-red-50'}`}>
    <div className="text-2xl font-bold">
      {result.score}/100 {result.passed ? '✅ PASS' : '❌ FAIL'}
    </div>
    {/* 카테고리별 프로그레스 바 */}
    {/* 이슈 목록 */}
  </div>
);
```

### 7.2 HITL 연동 흐름

```
ReviewAgent.validate() → score < 80
        ↓
Viewer에 Scorecard 표시 + 이슈 목록
        ↓
사용자 선택:
  [Approve Anyway] → 강제 승인 (로그 기록)
  [Request Retry]  → 재작업 트리거
  [Add Feedback]   → 추가 피드백 입력
```

---

## 8. 스트리밍 렌더링

에이전트가 긴 응답을 생성할 때 실시간으로 표시:

```javascript
// hooks/useStreamingOutput.ts
const useStreamingOutput = (taskId: string) => {
  const [content, setContent] = useState('');

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3002/stream/${taskId}`);
    ws.onmessage = (event) => {
      const { token } = JSON.parse(event.data);
      setContent(prev => prev + token); // 터미널 효과
    };
    return () => ws.close();
  }, [taskId]);

  return content;
};
```

---

## 9. Diff View (버전 비교)

ReviewAgent 반려 후 재작성 시 v1 ↔ v2 비교:

```tsx
// components/DiffViewer.tsx
import { DiffEditor } from '@monaco-editor/react';

const DiffViewer: React.FC<{ original: string; modified: string }> = ({
  original,
  modified
}) => (
  <DiffEditor
    original={original}
    modified={modified}
    language="markdown"
    options={{ readOnly: true }}
  />
);
```

---

## 10. 로드맵

| Phase | 기능 | 상태 |
|-------|------|------|
| Phase 1 | 기본 대시보드, 문서 뷰어 | ✅ 완료 |
| Phase 2 | 실시간 모니터링 (WebSocket) | ✅ 완료 |
| Phase 3 | HITL 패널 | ✅ 완료 |
| Phase 4 | 분석 시각화 (차트, 인사이트) | 📋 예정 |
| Phase 5 | ReviewAgent Scorecard 연동 | 📋 예정 |
| Phase 6 | 스트리밍 렌더링, Diff View | 📋 예정 |

상세는 `orchestrator/viewer/ROADMAP.md` 참조

---

**END OF SKILL**
