# MCP Server - Leader/Sub-agent 실시간 통신

## 개요

Leader(Claude Code)와 Sub-agent(Cline) 간의 실시간 통신을 위한 MCP(Model Context Protocol) Server입니다.

## 기능

- **실시간 상태 공유**: WebSocket을 통한 즉시 알림
- **Handoff 추적**: 작업 시작/진행/완료 상태 관리
- **위반 감지**: .clinerules 위반 실시간 알림
- **히스토리 관리**: 완료된 Handoff 기록 보관

## 설치 및 실행

```bash
cd mcp-server
npm install
npm start
```

## API Endpoints

### REST API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/state` | 전체 상태 조회 |
| GET | `/api/handoff` | 현재 Handoff 조회 |
| POST | `/api/handoff/start` | Handoff 시작 |
| PATCH | `/api/handoff/progress` | 진행상황 업데이트 |
| POST | `/api/handoff/complete` | Handoff 완료 |
| POST | `/api/violation` | 위반 보고 |
| GET | `/api/history` | 히스토리 조회 |
| GET | `/api/violations` | 위반 목록 조회 |
| GET | `/health` | Health check |

### WebSocket

연결: `ws://localhost:3002/{agent_id}`
- Leader: `ws://localhost:3002/leader`
- Sub-agent: `ws://localhost:3002/subagent`

#### 메시지 타입

**클라이언트 → 서버:**
- `handoff_start`: Handoff 시작
- `progress_update`: 진행상황 업데이트
- `handoff_complete`: Handoff 완료
- `violation`: 위반 보고
- `ping`: 연결 확인

**서버 → 클라이언트:**
- `state`: 초기 상태 전송
- `handoff_started`: Handoff 시작 알림
- `progress_updated`: 진행상황 알림
- `handoff_completed`: Handoff 완료 알림
- `violation_reported`: 위반 알림
- `pong`: ping 응답

## 사용 예시

### Leader (Claude Code)

```javascript
const { MCPClient } = require('./client');

const client = new MCPClient();
await client.connect('leader');

// 이벤트 리스닝
client.on('progress_updated', (data) => {
  console.log(`진행률: ${data.completedFiles}/${data.totalFiles}`);
});

client.on('violation_reported', (data) => {
  console.log(`⚠️ 위반: ${data.rule}`);
});

client.on('handoff_completed', (data) => {
  console.log(`Handoff ${data.status}!`);
  // 코드 리뷰 시작
});
```

### Sub-agent (Cline)

```javascript
const { MCPClient } = require('./client');

const client = new MCPClient();
await client.connect('subagent');

// Handoff 시작
client.startHandoff({
  id: 'case3-feature',
  handoffDoc: 'docs/case3/HANDOFF.md',
  totalFiles: 5
});

// 파일 생성 시마다
client.updateProgress({
  completedFiles: 1,
  currentTask: 'Creating types.ts'
});

// 완료
client.completeHandoff({
  success: true,
  files: ['types.ts', 'routes.ts', ...],
  testResult: { passed: 4, failed: 0 }
});
```

### REST CLI

```bash
# 상태 확인
node client.js status

# 현재 Handoff
node client.js handoff

# 히스토리
node client.js history

# 위반 목록
node client.js violations
```

## .clinerules 연동

Sub-agent는 MCP Server에 연결하여 상태를 보고해야 합니다:

```
## 6.2 MCP Server 연동 (필수)

작업 시작 시:
1. MCP Server 연결 (ws://localhost:3002/subagent)
2. handoff_start 메시지 전송

작업 중:
1. 파일 생성 시마다 progress_update 전송
2. 위반 감지 시 violation 전송

작업 완료 시:
1. handoff_complete 메시지 전송
2. 연결 종료
```

## 아키텍처

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│  Claude Code    │◄──────────────────►│                 │
│  (Leader)       │                    │   MCP Server    │
└─────────────────┘                    │   :3002         │
                                       │                 │
┌─────────────────┐     WebSocket      │                 │
│  Cline          │◄──────────────────►│                 │
│  (Sub-agent)    │                    └─────────────────┘
└─────────────────┘
```

## 포트

- MCP Server: `3002` (기본값)
- 환경변수: `MCP_PORT`
