# Orchestrator 결과 뷰어 고도화 로드맵

> **버전**: 1.3.0
> **작성일**: 2025-12-19
> **최종 수정**: 2025-12-19
> **목표**: CLI 결과를 웹 대시보드에서 시각적으로 확인

---

## 1. 현황 분석

### 1.1 현재 기능 (v1.3)

| 기능 | 상태 | 설명 |
|------|------|------|
| 로그 목록 조회 | ✅ | `/api/logs` - JSON 로그 파일 목록 |
| 로그 상세 조회 | ✅ | `/api/logs/:taskId` - 개별 로그 상세 |
| 설계 문서 목록 | ✅ | `/api/docs/:taskId` - Markdown 문서 목록 |
| 설계 문서 내용 | ✅ | `/api/docs/:taskId/:filename` - 문서 내용 |
| 생성 파일 목록 | ✅ | `/api/files` - SQL, TS 파일 목록 |
| **React 대시보드** | ✅ | Phase 1 완료 - Dashboard, TaskList, TaskDetail |
| **문서/파일 뷰어** | ✅ | Phase 1 완료 - DocViewer, FileTree, CodeViewer |
| **WebSocket 실시간** | ✅ | Phase 2 완료 - useWebSocket, RunningBanner |
| **HITL 패널** | ✅ | Phase 3 완료 - HITLPanel 컴포넌트 |

### 1.2 해결된 Pain Point

1. ~~**Task ID 가독성**~~: ✅ `formatters.ts`로 해결 (`case5-dormancy` 형식 표시)
2. ~~**산출물 탐색**~~: ✅ FileTree 컴포넌트로 해결
3. ~~**실시간 모니터링**~~: ✅ WebSocket + RunningBanner로 해결
4. ~~**피드백 루프**~~: ✅ HITLPanel로 해결

### 1.3 남은 작업

1. **분석 결과 시각화**: Phase 4 (차트, 테이블, 인사이트)

---

## 2. 고도화 로드맵

### Phase 1: 기본 UI 개선 (v1.1) ✅ 완료

**목표**: 기존 API 기반으로 사용자 친화적 UI 구축

| 기능 | 상태 | 구현 파일 |
|------|------|----------|
| Task ID 표시 개선 | ✅ | `utils/formatters.ts` |
| 대시보드 메인 | ✅ | `Dashboard.tsx`, `TaskList.tsx` |
| 문서 뷰어 | ✅ | `DocViewer.tsx` |
| 파일 트리 | ✅ | `FileTree.tsx`, `CodeViewer.tsx` |
| 상세 보기 | ✅ | `TaskDetail.tsx` |

**구현된 기술 스택**:
```yaml
Frontend: React 18 + Tailwind CSS
Build: Vite
Markdown: react-markdown + remark-gfm
Types: TypeScript
```

### Phase 2: 실시간 모니터링 (v1.2) ✅ 완료

**목표**: 파이프라인 실행 중 상태 실시간 확인

| 기능 | 상태 | 구현 파일 |
|------|------|----------|
| WebSocket 연결 | ✅ | `hooks/useWebSocket.ts` |
| 연결 상태 표시 | ✅ | `WSStatus.tsx` |
| 실행 배너 | ✅ | `RunningBanner.tsx` |
| Auto Reconnect | ✅ | `useWebSocket.ts` (StrictMode 대응) |

**구현된 기술 스택**:
```yaml
Realtime: WebSocket (native)
State: React hooks
UI: Tailwind animate
```

### Phase 3: Human-in-the-Loop 연동 (v1.3) ✅ 완료

**목표**: 검토 → 피드백 → 재실행 사이클 지원

| 기능 | 상태 | 구현 파일 |
|------|------|----------|
| 승인/거부 버튼 | ✅ | `HITLPanel.tsx` |
| 피드백 입력 | ✅ | `HITLPanel.tsx` |
| 체크포인트 상태 | ✅ | `HITLPanel.tsx` |
| 재실행 트리거 | 🔄 | 백엔드 연동 필요 |

**API 확장 (계획)**:
```javascript
POST /api/tasks/:taskId/approve
POST /api/tasks/:taskId/reject
POST /api/tasks/:taskId/rerun
GET  /api/tasks/:taskId/history
```

### Phase 4: 분석 결과 시각화 (v2.0) 📋 예정

**목표**: Analysis 파이프라인 결과를 차트로 표시

| 기능 | 우선순위 | 설명 |
|------|----------|------|
| 데이터 테이블 | P0 | SQL 쿼리 결과 테이블 |
| 차트 생성 | P0 | 막대/파이/라인 차트 |
| 인사이트 카드 | P1 | 발견사항 하이라이트 |
| 쿼리 편집기 | P2 | SQL 직접 수정 & 재실행 |

**계획된 기술 스택**:
```yaml
Table: TanStack Table (react-table v8)
Chart: Recharts 또는 Chart.js
Query: Monaco Editor (readonly/editable 모드)
```

---

## 3. 디렉토리 구조 (현재)

```
orchestrator/viewer/
├── server.js              # Express API 서버
├── ROADMAP.md             # 이 문서
├── package.json           # 의존성
├── vite.config.ts         # Vite 설정
├── tailwind.config.js     # Tailwind 설정
├── index.html             # HTML 진입점
└── src/                   # React 프론트엔드
    ├── App.tsx
    ├── main.tsx
    ├── index.css
    ├── components/
    │   ├── Dashboard.tsx      # ✅ 메인 대시보드
    │   ├── TaskList.tsx       # ✅ 실행 목록
    │   ├── TaskDetail.tsx     # ✅ 상세 보기
    │   ├── DocViewer.tsx      # ✅ Markdown 뷰어
    │   ├── FileTree.tsx       # ✅ 파일 트리
    │   ├── CodeViewer.tsx     # ✅ 코드 뷰어
    │   ├── HITLPanel.tsx      # ✅ Human-in-the-Loop 패널
    │   ├── RunningBanner.tsx  # ✅ 실행 중 배너
    │   ├── WSStatus.tsx       # ✅ WebSocket 상태
    │   └── ChartView.tsx      # 📋 Phase 4 예정
    ├── hooks/
    │   ├── useWebSocket.ts    # ✅ WebSocket 연결
    │   └── useTasks.ts        # ✅ 태스크 상태
    ├── utils/
    │   └── formatters.ts      # ✅ 공통 포맷터
    └── types/
        └── index.ts           # ✅ 타입 정의
```

---

## 4. 구현 완료 현황

### 완료된 항목 ✅

1. **Task ID 개선** - `formatters.ts` 구현 완료
2. **대시보드 UI** - React 프론트엔드 완료
3. **Markdown 렌더링** - DocViewer 완료
4. **파일 트리** - FileTree + CodeViewer 완료
5. **WebSocket 실시간** - useWebSocket + RunningBanner 완료
6. **HITL 패널** - HITLPanel UI 완료

### 다음 스프린트 (Phase 4)

1. 분석 결과 테이블 (TanStack Table)
2. 차트 시각화 (Recharts)
3. 인사이트 카드 컴포넌트

---

## 5. 참고 자료

- 현재 API: `server.js` (GET /api/logs, /api/docs, /api/files)
- HITL 정의: `CLAUDE.md` 섹션 "Human-in-the-Loop 사이클"
- Task ID 규칙: `AGENT_ARCHITECTURE.md` 섹션 0.4

---

**END OF ROADMAP**
