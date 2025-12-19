/**
 * Orchestrator 결과 뷰어 - Express + WebSocket 서버
 *
 * 실행: node orchestrator/viewer/server.js
 * 접속: http://localhost:3000
 * WebSocket: ws://localhost:3000
 *
 * @version 1.4.0 - Phase 3 완료: HITL 재실행 Orchestrator 연동
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import chokidar from 'chokidar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

const app = express();
const PORT = 3000;

// HTTP 서버 생성 (WebSocket 연결용)
const server = createServer(app);

// WebSocket 서버
const wss = new WebSocketServer({ server });

// 연결된 클라이언트 관리
const clients = new Set();

// WebSocket 연결 핸들러
wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[WS] 클라이언트 연결 (총 ${clients.size}명)`);

  // 연결 시 현재 상태 전송
  ws.send(JSON.stringify({
    type: 'connected',
    timestamp: new Date().toISOString(),
    message: 'WebSocket 연결됨'
  }));

  // 현재 실행 중인 태스크 정보 전송
  sendRunningStatus(ws);

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WS] 클라이언트 연결 해제 (총 ${clients.size}명)`);
  });

  ws.on('error', (err) => {
    console.error('[WS] 에러:', err.message);
    clients.delete(ws);
  });
});

// 모든 클라이언트에게 브로드캐스트
function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// 특정 클라이언트에게 실행 중 상태 전송
function sendRunningStatus(ws) {
  const runningFile = path.join(projectRoot, 'orchestrator/logs/.running.json');
  if (fs.existsSync(runningFile)) {
    try {
      const running = JSON.parse(fs.readFileSync(runningFile, 'utf-8'));
      ws.send(JSON.stringify({
        type: 'running_status',
        timestamp: new Date().toISOString(),
        data: running
      }));
    } catch (e) {
      // 파싱 실패 시 무시
    }
  }
}

// 로그 디렉토리 감시 설정
const logsDir = path.join(projectRoot, 'orchestrator/logs');

// 디렉토리가 없으면 생성
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 파일 시스템 감시
const watcher = chokidar.watch(logsDir, {
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 300,
    pollInterval: 100
  }
});

watcher.on('add', (filePath) => {
  const filename = path.basename(filePath);
  if (filename.endsWith('.json') && !filename.startsWith('.')) {
    console.log(`[Watch] 새 로그 파일: ${filename}`);
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      broadcast({
        type: 'task_created',
        taskId: filename.replace('.json', ''),
        timestamp: new Date().toISOString(),
        data: {
          status: content.success !== false ? 'SUCCESS' : 'FAIL',
          startTime: content.startTime
        }
      });
    } catch (e) {
      console.error('[Watch] 파일 파싱 에러:', e.message);
    }
  }
});

watcher.on('change', (filePath) => {
  const filename = path.basename(filePath);

  // 실행 중 상태 파일
  if (filename === '.running.json') {
    try {
      const running = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      broadcast({
        type: 'running_status',
        timestamp: new Date().toISOString(),
        data: running
      });
    } catch (e) {
      // 파싱 실패 시 무시
    }
    return;
  }

  // 일반 로그 파일
  if (filename.endsWith('.json') && !filename.startsWith('.')) {
    console.log(`[Watch] 로그 파일 변경: ${filename}`);
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      broadcast({
        type: 'task_updated',
        taskId: filename.replace('.json', ''),
        timestamp: new Date().toISOString(),
        data: {
          status: content.success !== false ? 'SUCCESS' : 'FAIL',
          currentPhase: content.currentPhase,
          phases: content.phases ? Object.keys(content.phases) : [],
          totalTokens: content.totalTokens?.total || 0,
          progress: content.progress || 0
        }
      });
    } catch (e) {
      console.error('[Watch] 파일 파싱 에러:', e.message);
    }
  }
});

watcher.on('unlink', (filePath) => {
  const filename = path.basename(filePath);
  if (filename === '.running.json') {
    broadcast({
      type: 'running_status',
      timestamp: new Date().toISOString(),
      data: null
    });
  }
});

// ============================================================
// REST API
// ============================================================

// JSON 바디 파서
app.use(express.json());

// ============================================================
// Phase 3: HITL (Human-In-The-Loop) API
// ============================================================

// HITL 상태 저장 (메모리 기반, 프로덕션에서는 DB 사용)
const hitlQueue = new Map();

// HITL 대기 파일 경로
const hitlDir = path.join(projectRoot, 'orchestrator/logs/.hitl');
if (!fs.existsSync(hitlDir)) {
  fs.mkdirSync(hitlDir, { recursive: true });
}

// HITL 대기열 조회
app.get('/api/hitl/queue', (req, res) => {
  const queue = [];
  if (fs.existsSync(hitlDir)) {
    fs.readdirSync(hitlDir)
      .filter(f => f.endsWith('.json') && !f.includes('.decision'))
      .forEach(f => {
        try {
          const content = JSON.parse(fs.readFileSync(path.join(hitlDir, f), 'utf-8'));
          queue.push(content);
        } catch (e) {
          // skip
        }
      });
  }
  res.json(queue.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
});

// HITL 승인
app.post('/api/tasks/:taskId/approve', (req, res) => {
  const { taskId } = req.params;
  const { comment } = req.body || {};

  const hitlFile = path.join(hitlDir, `${taskId}.json`);
  if (!fs.existsSync(hitlFile)) {
    return res.status(404).json({ error: 'HITL request not found' });
  }

  try {
    const hitl = JSON.parse(fs.readFileSync(hitlFile, 'utf-8'));
    hitl.status = 'approved';
    hitl.decision = {
      action: 'approve',
      comment: comment || '',
      timestamp: new Date().toISOString()
    };

    // 결정 파일로 저장
    const decisionFile = path.join(hitlDir, `${taskId}.decision.json`);
    fs.writeFileSync(decisionFile, JSON.stringify(hitl.decision, null, 2));

    // 원본 파일 삭제 (처리 완료)
    fs.unlinkSync(hitlFile);

    // 브로드캐스트
    broadcast({
      type: 'hitl_resolved',
      taskId,
      action: 'approved',
      timestamp: new Date().toISOString()
    });

    console.log(`[HITL] 승인: ${taskId}`);
    res.json({ success: true, taskId, action: 'approved' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// HITL 거부
app.post('/api/tasks/:taskId/reject', (req, res) => {
  const { taskId } = req.params;
  const { reason } = req.body || {};

  const hitlFile = path.join(hitlDir, `${taskId}.json`);
  if (!fs.existsSync(hitlFile)) {
    return res.status(404).json({ error: 'HITL request not found' });
  }

  try {
    const hitl = JSON.parse(fs.readFileSync(hitlFile, 'utf-8'));
    hitl.status = 'rejected';
    hitl.decision = {
      action: 'reject',
      reason: reason || 'No reason provided',
      timestamp: new Date().toISOString()
    };

    // 결정 파일로 저장
    const decisionFile = path.join(hitlDir, `${taskId}.decision.json`);
    fs.writeFileSync(decisionFile, JSON.stringify(hitl.decision, null, 2));

    // 원본 파일 삭제
    fs.unlinkSync(hitlFile);

    // 브로드캐스트
    broadcast({
      type: 'hitl_resolved',
      taskId,
      action: 'rejected',
      reason,
      timestamp: new Date().toISOString()
    });

    console.log(`[HITL] 거부: ${taskId} - ${reason}`);
    res.json({ success: true, taskId, action: 'rejected' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// HITL 피드백 제출
app.post('/api/tasks/:taskId/feedback', (req, res) => {
  const { taskId } = req.params;
  const { feedback, rating } = req.body || {};

  if (!feedback) {
    return res.status(400).json({ error: 'Feedback is required' });
  }

  const feedbackDir = path.join(projectRoot, 'orchestrator/logs/.feedback');
  if (!fs.existsSync(feedbackDir)) {
    fs.mkdirSync(feedbackDir, { recursive: true });
  }

  const feedbackFile = path.join(feedbackDir, `${taskId}.json`);
  const feedbackData = {
    taskId,
    feedback,
    rating: rating || null,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(feedbackFile, JSON.stringify(feedbackData, null, 2));

  console.log(`[HITL] 피드백: ${taskId} - ${feedback.substring(0, 50)}...`);
  res.json({ success: true, taskId });
});

// HITL 재실행 요청 + 실제 Orchestrator 실행
app.post('/api/tasks/:taskId/rerun', async (req, res) => {
  const { taskId } = req.params;
  const { modifications, prdContent } = req.body || {};

  // 원본 로그 파일에서 PRD 정보 가져오기
  const originalLogPath = path.join(logsDir, `${taskId}.json`);
  let originalPrd = prdContent;

  if (!originalPrd && fs.existsSync(originalLogPath)) {
    try {
      const originalLog = JSON.parse(fs.readFileSync(originalLogPath, 'utf-8'));
      originalPrd = originalLog.prdContent || originalLog.taskDescription;
    } catch (e) {
      console.error('[Rerun] 원본 로그 파싱 실패:', e.message);
    }
  }

  if (!originalPrd) {
    return res.status(400).json({ error: 'PRD content required for rerun' });
  }

  // 새 taskId 생성
  const newTaskId = `${taskId}-rerun-${Date.now()}`;

  // 재실행 요청 파일 저장
  const rerunDir = path.join(projectRoot, 'orchestrator/logs/.rerun');
  if (!fs.existsSync(rerunDir)) {
    fs.mkdirSync(rerunDir, { recursive: true });
  }

  const rerunFile = path.join(rerunDir, `${newTaskId}.json`);
  const rerunData = {
    originalTaskId: taskId,
    newTaskId,
    modifications: modifications || {},
    prdContent: originalPrd,
    requestedAt: new Date().toISOString(),
    status: 'queued'
  };

  fs.writeFileSync(rerunFile, JSON.stringify(rerunData, null, 2));

  // 브로드캐스트
  broadcast({
    type: 'rerun_queued',
    originalTaskId: taskId,
    newTaskId,
    timestamp: new Date().toISOString()
  });

  console.log(`[HITL] 재실행 큐 등록: ${taskId} → ${newTaskId}`);

  // 비동기로 Orchestrator 실행 (응답 먼저 반환)
  executeRerun(rerunData).catch(err => {
    console.error(`[HITL] 재실행 실패: ${newTaskId}`, err.message);
  });

  res.json({
    success: true,
    originalTaskId: taskId,
    newTaskId,
    message: 'Rerun queued'
  });
});

// 재실행 워커 함수
async function executeRerun(rerunData) {
  const { newTaskId, prdContent, modifications } = rerunData;
  const rerunFile = path.join(projectRoot, 'orchestrator/logs/.rerun', `${newTaskId}.json`);

  try {
    // 상태: running
    rerunData.status = 'running';
    rerunData.startedAt = new Date().toISOString();
    fs.writeFileSync(rerunFile, JSON.stringify(rerunData, null, 2));

    broadcast({
      type: 'rerun_started',
      taskId: newTaskId,
      timestamp: new Date().toISOString()
    });

    // Orchestrator 동적 임포트 및 실행
    const { Orchestrator } = await import('../orchestrator.js');
    const orchestrator = new Orchestrator({
      projectRoot,
      maxRetries: 3,
      saveFiles: true
    });

    // 수정사항 적용된 PRD
    let finalPrd = prdContent;
    if (modifications.prdOverride) {
      finalPrd = modifications.prdOverride;
    }

    // 실행
    const result = await orchestrator.run(
      `[Rerun] ${newTaskId}`,
      {
        taskId: newTaskId,
        prdContent: finalPrd,
        mode: modifications.mode || null,
        pipeline: modifications.pipeline || null
      }
    );

    // 상태: completed
    rerunData.status = 'completed';
    rerunData.completedAt = new Date().toISOString();
    rerunData.result = { success: result.success, filesCreated: result.filesCreated || 0 };
    fs.writeFileSync(rerunFile, JSON.stringify(rerunData, null, 2));

    broadcast({
      type: 'rerun_completed',
      taskId: newTaskId,
      success: result.success,
      timestamp: new Date().toISOString()
    });

    console.log(`[HITL] 재실행 완료: ${newTaskId}`);
  } catch (error) {
    // 상태: failed
    rerunData.status = 'failed';
    rerunData.error = error.message;
    rerunData.failedAt = new Date().toISOString();
    fs.writeFileSync(rerunFile, JSON.stringify(rerunData, null, 2));

    broadcast({
      type: 'rerun_failed',
      taskId: newTaskId,
      error: error.message,
      timestamp: new Date().toISOString()
    });

    throw error;
  }
}

// HITL 대기 파일 감시
const hitlWatcher = chokidar.watch(hitlDir, {
  persistent: true,
  ignoreInitial: true
});

hitlWatcher.on('add', (filePath) => {
  const filename = path.basename(filePath);
  if (filename.endsWith('.json') && !filename.includes('.decision')) {
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      broadcast({
        type: 'hitl_pending',
        taskId: content.taskId,
        timestamp: new Date().toISOString(),
        data: content
      });
      console.log(`[HITL] 새 승인 요청: ${content.taskId}`);
    } catch (e) {
      // skip
    }
  }
});

// ============================================================

// API: 로그 목록
app.get('/api/logs', (req, res) => {
  if (!fs.existsSync(logsDir)) {
    return res.json([]);
  }

  const logs = fs.readdirSync(logsDir)
    .filter(f => f.endsWith('.json') && !f.startsWith('.'))
    .map(f => {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(logsDir, f), 'utf-8'));
        return {
          taskId: f.replace('.json', ''),
          timestamp: content.startTime || content.timestamp,
          status: content.success !== false ? 'SUCCESS' : 'FAIL',
          totalTokens: content.totalTokens?.total || 0,
          duration: content.totalDuration || 0
        };
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.json(logs);
});

// API: 로그 상세
app.get('/api/logs/:taskId', (req, res) => {
  const logPath = path.join(logsDir, req.params.taskId + '.json');
  if (!fs.existsSync(logPath)) {
    return res.status(404).json({ error: 'Log not found' });
  }
  res.json(JSON.parse(fs.readFileSync(logPath, 'utf-8')));
});

// API: 실행 중인 태스크
app.get('/api/running', (req, res) => {
  const runningFile = path.join(logsDir, '.running.json');
  if (!fs.existsSync(runningFile)) {
    return res.json(null);
  }
  try {
    res.json(JSON.parse(fs.readFileSync(runningFile, 'utf-8')));
  } catch (e) {
    res.json(null);
  }
});

// API: 문서 목록
app.get('/api/docs/:taskId', (req, res) => {
  const docsDir = path.join(projectRoot, 'docs', req.params.taskId);
  if (!fs.existsSync(docsDir)) {
    return res.json([]);
  }

  const docs = fs.readdirSync(docsDir)
    .filter(f => f.endsWith('.md'))
    .map(f => ({
      name: f,
      path: path.join(docsDir, f)
    }));

  res.json(docs);
});

// API: 문서 내용
app.get('/api/docs/:taskId/:filename', (req, res) => {
  const filePath = path.join(projectRoot, 'docs', req.params.taskId, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Doc not found' });
  }
  res.type('text/markdown').send(fs.readFileSync(filePath, 'utf-8'));
});

// API: 생성된 파일 목록
app.get('/api/files', (req, res) => {
  const srcDir = path.join(projectRoot, 'src/analysis');
  const files = [];

  const walkDir = (dir, prefix = '') => {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
      const fullPath = path.join(dir, f);
      const relPath = prefix ? prefix + '/' + f : f;
      if (fs.statSync(fullPath).isDirectory()) {
        walkDir(fullPath, relPath);
      } else if (f.endsWith('.ts') || f.endsWith('.sql') || f.endsWith('.md')) {
        files.push({
          name: f,
          path: relPath,
          fullPath: fullPath,
          ext: path.extname(f)
        });
      }
    });
  };

  walkDir(srcDir);
  res.json(files);
});

// API: 파일 내용
app.get('/api/file', (req, res) => {
  const relPath = req.query.path;
  const fullPath = path.join(projectRoot, 'src/analysis', relPath);
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  const ext = path.extname(fullPath);
  const mimeTypes = {
    '.ts': 'text/typescript',
    '.sql': 'text/plain',
    '.md': 'text/markdown'
  };
  res.type(mimeTypes[ext] || 'text/plain').send(fs.readFileSync(fullPath, 'utf-8'));
});

// ============================================================
// Phase 4: 분석 결과 시각화 API
// ============================================================

// API: 분석 결과 조회
app.get('/api/analysis/:taskId', (req, res) => {
  const { taskId } = req.params;

  // 로그 파일에서 분석 결과 추출
  const logPath = path.join(logsDir, `${taskId}.json`);
  if (!fs.existsSync(logPath)) {
    return res.status(404).json({ error: 'Task not found' });
  }

  try {
    const log = JSON.parse(fs.readFileSync(logPath, 'utf-8'));

    // 분석 결과가 있는 경우
    if (log.analysisResult) {
      return res.json(formatAnalysisResult(log.analysisResult, taskId));
    }

    // phases에서 분석 결과 추출
    if (log.phases?.analysis) {
      return res.json(formatAnalysisResult(log.phases.analysis, taskId));
    }

    // 분석 결과 없음
    return res.status(404).json({ error: 'No analysis result found' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// 분석 결과 포맷팅 함수
function formatAnalysisResult(raw, taskId) {
  return {
    summary: {
      title: raw.title || `분석 결과 - ${taskId}`,
      totalRows: raw.totalRows || raw.queries?.reduce((sum, q) => sum + (q.rowCount || 0), 0) || 0,
      queryCount: raw.queries?.length || 0,
      duration: raw.duration || raw.executionTime || '-'
    },
    insights: (raw.insights || []).map(i => ({
      type: i.type || 'info',
      title: i.title || '인사이트',
      description: i.description || i.content || '',
      value: i.value
    })),
    charts: (raw.charts || []).map(c => ({
      title: c.title || '차트',
      type: c.type || 'bar',
      data: (c.data || []).map(d => ({
        label: d.label || d.name || String(d.x),
        value: d.value || d.y || 0
      }))
    })),
    queries: (raw.queries || []).map((q, i) => ({
      id: q.id || `Q${i + 1}`,
      sql: q.sql || q.query || '',
      rowCount: q.rowCount || q.data?.length || 0,
      data: (q.data || q.results || []).slice(0, 100)
    }))
  };
}

// ============================================================
// 정적 파일 및 메인 페이지
// ============================================================

// Vite 빌드 결과물 서빙 (프로덕션)
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// 메인 페이지 (Vite 개발모드용 폴백)
const mainPageHTML = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Orchestrator 결과 뷰어</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #1a1a2e; color: #eee; }
    .container { display: flex; height: 100vh; }
    .sidebar { width: 300px; background: #16213e; border-right: 1px solid #333; overflow-y: auto; }
    .main { flex: 1; display: flex; flex-direction: column; }
    .header { padding: 20px; background: #0f3460; border-bottom: 1px solid #333; }
    .header h1 { font-size: 1.5rem; color: #e94560; }
    .tabs { display: flex; gap: 10px; margin-top: 10px; }
    .tab { padding: 8px 16px; background: #1a1a2e; border: none; color: #aaa; cursor: pointer; border-radius: 4px; }
    .tab.active { background: #e94560; color: #fff; }
    .content { flex: 1; overflow-y: auto; padding: 20px; }
    .list-item { padding: 12px 16px; border-bottom: 1px solid #333; cursor: pointer; transition: background 0.2s; }
    .list-item:hover { background: #1a1a2e; }
    .list-item.active { background: #0f3460; border-left: 3px solid #e94560; }
    .list-item .title { font-weight: 600; margin-bottom: 4px; }
    .list-item .meta { font-size: 0.85rem; color: #888; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; margin-left: 8px; }
    .badge.success { background: #10b981; color: #fff; }
    .badge.fail { background: #ef4444; color: #fff; }
    .badge.running { background: #f59e0b; color: #fff; animation: pulse 1s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    pre { background: #0d1b2a; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 0.9rem; line-height: 1.5; }
    code { font-family: 'JetBrains Mono', 'Fira Code', monospace; }
    .file-header { margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #333; }
    .file-header h2 { color: #e94560; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
    .stat-card { background: #16213e; padding: 16px; border-radius: 8px; text-align: center; }
    .stat-card .value { font-size: 1.5rem; font-weight: 700; color: #e94560; }
    .stat-card .label { font-size: 0.85rem; color: #888; margin-top: 4px; }
    .running-banner { background: #f59e0b; color: #000; padding: 12px 20px; font-weight: 600; display: flex; align-items: center; gap: 10px; }
    .running-banner .spinner { width: 20px; height: 20px; border: 2px solid #000; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .progress-bar { height: 4px; background: #333; border-radius: 2px; overflow: hidden; margin-top: 8px; }
    .progress-bar .fill { height: 100%; background: #e94560; transition: width 0.3s; }
    .ws-status { position: fixed; bottom: 10px; right: 10px; padding: 6px 12px; border-radius: 4px; font-size: 0.75rem; }
    .ws-status.connected { background: #10b981; color: #fff; }
    .ws-status.disconnected { background: #ef4444; color: #fff; }
  </style>
</head>
<body>
  <div id="running-banner" class="running-banner" style="display:none;">
    <div class="spinner"></div>
    <span id="running-text">실행 중...</span>
  </div>
  <div class="container">
    <div class="sidebar" id="sidebar"></div>
    <div class="main">
      <div class="header">
        <h1>🎯 Orchestrator 결과 뷰어</h1>
        <div class="tabs">
          <button class="tab active" data-tab="logs">실행 로그</button>
          <button class="tab" data-tab="files">생성 파일</button>
          <button class="tab" data-tab="docs">설계 문서</button>
        </div>
      </div>
      <div class="content" id="content">
        <p>좌측에서 항목을 선택하세요.</p>
      </div>
    </div>
  </div>
  <div id="ws-status" class="ws-status disconnected">연결 끊김</div>
  <script>
    let currentTab = 'logs';
    let selectedItem = null;
    let ws = null;
    let runningTask = null;

    // WebSocket 연결
    function connectWebSocket() {
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(protocol + '//' + location.host);

      ws.onopen = function() {
        document.getElementById('ws-status').className = 'ws-status connected';
        document.getElementById('ws-status').textContent = '실시간 연결됨';
      };

      ws.onclose = function() {
        document.getElementById('ws-status').className = 'ws-status disconnected';
        document.getElementById('ws-status').textContent = '연결 끊김';
        setTimeout(connectWebSocket, 3000);
      };

      ws.onmessage = function(event) {
        const msg = JSON.parse(event.data);
        handleWSMessage(msg);
      };
    }

    function handleWSMessage(msg) {
      console.log('[WS]', msg.type, msg);

      if (msg.type === 'running_status') {
        runningTask = msg.data;
        updateRunningBanner();
      } else if (msg.type === 'task_created' || msg.type === 'task_updated') {
        if (currentTab === 'logs') {
          renderSidebar();
        }
      }
    }

    function updateRunningBanner() {
      const banner = document.getElementById('running-banner');
      const text = document.getElementById('running-text');

      if (runningTask) {
        banner.style.display = 'flex';
        text.textContent = '실행 중: ' + (runningTask.taskId || '') + ' - ' + (runningTask.currentPhase || '');
      } else {
        banner.style.display = 'none';
      }
    }

    async function fetchJSON(url) {
      const res = await fetch(url);
      return res.json();
    }

    async function fetchText(url) {
      const res = await fetch(url);
      return res.text();
    }

    async function renderSidebar() {
      const sidebar = document.getElementById('sidebar');

      if (currentTab === 'logs') {
        const logs = await fetchJSON('/api/logs');
        sidebar.innerHTML = logs.map(function(log) {
          return '<div class="list-item" data-id="' + log.taskId + '">' +
            '<div class="title">' + log.taskId.substring(0, 20) + '...' +
            '<span class="badge ' + log.status.toLowerCase() + '">' + log.status + '</span></div>' +
            '<div class="meta">' + log.totalTokens.toLocaleString() + ' tokens · ' + log.duration + '</div></div>';
        }).join('');
      } else if (currentTab === 'files') {
        const files = await fetchJSON('/api/files');
        sidebar.innerHTML = files.map(function(file) {
          return '<div class="list-item" data-path="' + file.path + '">' +
            '<div class="title">' + file.name + '</div>' +
            '<div class="meta">' + file.path + '</div></div>';
        }).join('');
      } else if (currentTab === 'docs') {
        const logs = await fetchJSON('/api/logs');
        if (logs.length > 0) {
          const taskId = logs[0].taskId;
          const docs = await fetchJSON('/api/docs/' + taskId);
          sidebar.innerHTML = '<div class="list-item" style="background:#0f3460;cursor:default;"><div class="meta">' + taskId + '</div></div>' +
            docs.map(function(doc) {
              return '<div class="list-item" data-doc="' + taskId + '/' + doc.name + '">' +
                '<div class="title">' + doc.name + '</div></div>';
            }).join('');
        }
      }

      sidebar.querySelectorAll('.list-item[data-id], .list-item[data-path], .list-item[data-doc]').forEach(function(item) {
        item.addEventListener('click', function() {
          sidebar.querySelectorAll('.list-item').forEach(function(i) { i.classList.remove('active'); });
          item.classList.add('active');
          if (item.dataset.id) showLog(item.dataset.id);
          if (item.dataset.path) showFile(item.dataset.path);
          if (item.dataset.doc) showDoc(item.dataset.doc);
        });
      });
    }

    async function showLog(taskId) {
      const log = await fetchJSON('/api/logs/' + taskId);
      const content = document.getElementById('content');
      content.innerHTML = '<div class="stats">' +
        '<div class="stat-card"><div class="value">' + (log.success !== false ? '✅' : '❌') + '</div><div class="label">상태</div></div>' +
        '<div class="stat-card"><div class="value">' + (log.totalTokens?.total || 0).toLocaleString() + '</div><div class="label">토큰</div></div>' +
        '<div class="stat-card"><div class="value">' + (log.retryCount || 0) + '</div><div class="label">재시도</div></div>' +
        '<div class="stat-card"><div class="value">' + (log.totalDuration || '-') + '</div><div class="label">소요시간</div></div>' +
        '</div>' +
        '<div class="file-header"><h2>상세 로그</h2></div>' +
        '<pre><code>' + JSON.stringify(log, null, 2) + '</code></pre>';
    }

    async function showFile(filePath) {
      const code = await fetchText('/api/file?path=' + encodeURIComponent(filePath));
      const content = document.getElementById('content');
      const ext = filePath.split('.').pop();
      content.innerHTML = '<div class="file-header"><h2>' + filePath + '</h2></div>' +
        '<pre><code class="language-' + ext + '">' + escapeHtml(code) + '</code></pre>';
    }

    async function showDoc(docPath) {
      const parts = docPath.split('/');
      const taskId = parts[0];
      const filename = parts[1];
      const md = await fetchText('/api/docs/' + taskId + '/' + filename);
      const content = document.getElementById('content');
      content.innerHTML = '<div class="file-header"><h2>' + filename + '</h2></div>' +
        '<pre><code>' + escapeHtml(md) + '</code></pre>';
    }

    function escapeHtml(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    document.querySelectorAll('.tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        currentTab = tab.dataset.tab;
        renderSidebar();
        document.getElementById('content').innerHTML = '<p>좌측에서 항목을 선택하세요.</p>';
      });
    });

    // 초기화
    connectWebSocket();
    renderSidebar();
  </script>
</body>
</html>`;

app.get('/', (req, res) => {
  res.send(mainPageHTML);
});

// ============================================================
// 서버 시작
// ============================================================

server.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  🎯 Orchestrator 결과 뷰어 v1.3.0                       ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log('║  HTTP:      http://localhost:' + PORT + '                     ║');
  console.log('║  WebSocket: ws://localhost:' + PORT + '                       ║');
  console.log('║  HITL API:  /api/tasks/:taskId/{approve,reject,rerun}  ║');
  console.log('║  종료: Ctrl+C                                           ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('[Watch] 로그 디렉토리 감시 중:', logsDir);
  console.log('[Watch] HITL 디렉토리 감시 중:', hitlDir);
});
