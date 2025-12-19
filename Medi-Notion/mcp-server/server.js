/**
 * MCP Server - Leader/Sub-agent 실시간 통신
 *
 * 기능:
 * - REST API: 상태 조회/업데이트
 * - WebSocket: 실시간 이벤트 푸시
 * - Handoff 관리: 작업 시작/진행/완료 추적
 * - 위반 감지: .clinerules 위반 실시간 알림
 */

const express = require('express');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.MCP_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// 상태 저장소
let state = {
  version: '1.0.0',
  lastUpdated: null,
  currentHandoff: null,
  agents: {
    leader: { connected: false, lastSeen: null },
    subagent: { connected: false, lastSeen: null },
  },
  history: [],
  violations: [],
};

// WebSocket 클라이언트 관리
const clients = new Map();

// WebSocket 연결 처리
wss.on('connection', (ws, req) => {
  const agentId = req.url.slice(1) || 'unknown'; // /leader or /subagent
  clients.set(ws, { agentId, connectedAt: new Date() });

  console.log(`[WS] ${agentId} connected`);

  // 에이전트 상태 업데이트
  if (state.agents[agentId]) {
    state.agents[agentId].connected = true;
    state.agents[agentId].lastSeen = new Date().toISOString();
  }

  // 현재 상태 전송
  ws.send(JSON.stringify({ type: 'state', data: state }));

  // 메시지 수신
  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message);
      handleMessage(ws, agentId, msg);
    } catch (e) {
      console.error('[WS] Invalid message:', e.message);
    }
  });

  // 연결 종료
  ws.on('close', () => {
    console.log(`[WS] ${agentId} disconnected`);
    if (state.agents[agentId]) {
      state.agents[agentId].connected = false;
    }
    clients.delete(ws);
  });
});

// WebSocket 메시지 처리
function handleMessage(ws, agentId, msg) {
  const { type, data } = msg;

  switch (type) {
    case 'handoff_start':
      startHandoff(agentId, data);
      break;
    case 'progress_update':
      updateProgress(agentId, data);
      break;
    case 'handoff_complete':
      completeHandoff(agentId, data);
      break;
    case 'violation':
      reportViolation(agentId, data);
      break;
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
    default:
      console.log(`[WS] Unknown message type: ${type}`);
  }
}

// 전체 클라이언트에 브로드캐스트
function broadcast(message) {
  const payload = JSON.stringify(message);
  for (const [ws] of clients) {
    if (ws.readyState === ws.OPEN) {
      ws.send(payload);
    }
  }
}

// Handoff 시작
function startHandoff(agentId, data) {
  state.currentHandoff = {
    id: data.id || `handoff-${Date.now()}`,
    status: 'in_progress',
    startedAt: new Date().toISOString(),
    completedAt: null,
    agent: agentId,
    handoffDoc: data.handoffDoc,
    progress: {
      totalFiles: data.totalFiles || 0,
      completedFiles: 0,
      currentTask: null,
    },
    violations: [],
    errors: [],
  };
  state.lastUpdated = new Date().toISOString();

  console.log(`[Handoff] Started: ${state.currentHandoff.id} by ${agentId}`);
  broadcast({ type: 'handoff_started', data: state.currentHandoff });
}

// 진행상황 업데이트
function updateProgress(agentId, data) {
  if (!state.currentHandoff) return;

  state.currentHandoff.progress = {
    ...state.currentHandoff.progress,
    ...data,
  };
  state.lastUpdated = new Date().toISOString();

  console.log(`[Progress] ${data.completedFiles}/${state.currentHandoff.progress.totalFiles} - ${data.currentTask}`);
  broadcast({ type: 'progress_updated', data: state.currentHandoff.progress });
}

// Handoff 완료
function completeHandoff(agentId, data) {
  if (!state.currentHandoff) return;

  state.currentHandoff.status = data.success ? 'completed' : 'failed';
  state.currentHandoff.completedAt = new Date().toISOString();
  state.currentHandoff.result = data;
  state.lastUpdated = new Date().toISOString();

  // 히스토리에 추가
  state.history.push({ ...state.currentHandoff });

  console.log(`[Handoff] Completed: ${state.currentHandoff.id} - ${state.currentHandoff.status}`);
  broadcast({ type: 'handoff_completed', data: state.currentHandoff });
}

// 위반 보고
function reportViolation(agentId, data) {
  const violation = {
    timestamp: new Date().toISOString(),
    agent: agentId,
    rule: data.rule,
    description: data.description,
    severity: data.severity || 'warning',
  };

  state.violations.push(violation);
  if (state.currentHandoff) {
    state.currentHandoff.violations.push(violation);
  }
  state.lastUpdated = new Date().toISOString();

  console.log(`[VIOLATION] ${agentId}: ${data.rule} - ${data.description}`);
  broadcast({ type: 'violation_reported', data: violation });
}

// REST API Endpoints

// 상태 조회
app.get('/api/state', (req, res) => {
  res.json(state);
});

// 현재 Handoff 조회
app.get('/api/handoff', (req, res) => {
  res.json(state.currentHandoff || { status: 'none' });
});

// Handoff 시작 (REST)
app.post('/api/handoff/start', (req, res) => {
  startHandoff(req.body.agent || 'rest', req.body);
  res.json({ success: true, handoff: state.currentHandoff });
});

// 진행상황 업데이트 (REST)
app.patch('/api/handoff/progress', (req, res) => {
  updateProgress(req.body.agent || 'rest', req.body);
  res.json({ success: true, progress: state.currentHandoff?.progress });
});

// Handoff 완료 (REST)
app.post('/api/handoff/complete', (req, res) => {
  completeHandoff(req.body.agent || 'rest', req.body);
  res.json({ success: true, handoff: state.currentHandoff });
});

// 위반 보고 (REST)
app.post('/api/violation', (req, res) => {
  reportViolation(req.body.agent || 'rest', req.body);
  res.json({ success: true });
});

// 히스토리 조회
app.get('/api/history', (req, res) => {
  res.json(state.history);
});

// 위반 목록 조회
app.get('/api/violations', (req, res) => {
  res.json(state.violations);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    agents: state.agents,
    currentHandoff: state.currentHandoff?.status || 'none',
  });
});

// 서버 시작
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║  MCP Server - Leader/Sub-agent Communication          ║
╠═══════════════════════════════════════════════════════╣
║  REST API:   http://localhost:${PORT}/api              ║
║  WebSocket:  ws://localhost:${PORT}/leader             ║
║              ws://localhost:${PORT}/subagent           ║
╚═══════════════════════════════════════════════════════╝
  `);
});
