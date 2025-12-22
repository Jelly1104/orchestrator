/**
 * MCP Client - Leader/Sub-agent용 클라이언트 라이브러리
 *
 * 사용법:
 *   const client = require('./client');
 *   await client.connect('leader');
 *   await client.startHandoff({ id: 'case3', totalFiles: 5 });
 */

const WebSocket = require('ws');

const MCP_URL = process.env.MCP_URL || 'ws://localhost:3002';

class MCPClient {
  constructor() {
    this.ws = null;
    this.agentId = null;
    this.connected = false;
    this.listeners = new Map();
  }

  async connect(agentId) {
    this.agentId = agentId;

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`${MCP_URL}/${agentId}`);

      this.ws.on('open', () => {
        this.connected = true;
        console.log(`[MCP] Connected as ${agentId}`);
        resolve();
      });

      this.ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data);
          this.handleMessage(msg);
        } catch (e) {
          console.error('[MCP] Invalid message:', e.message);
        }
      });

      this.ws.on('close', () => {
        this.connected = false;
        console.log('[MCP] Disconnected');
      });

      this.ws.on('error', (err) => {
        console.error('[MCP] Error:', err.message);
        reject(err);
      });

      setTimeout(() => {
        if (!this.connected) reject(new Error('Connection timeout'));
      }, 5000);
    });
  }

  handleMessage(msg) {
    const { type, data } = msg;

    // 등록된 리스너 호출
    const listeners = this.listeners.get(type) || [];
    listeners.forEach((fn) => fn(data));

    // 기본 로깅
    switch (type) {
      case 'handoff_started':
        console.log(`[MCP] Handoff started: ${data.id}`);
        break;
      case 'progress_updated':
        console.log(`[MCP] Progress: ${data.completedFiles}/${data.totalFiles}`);
        break;
      case 'handoff_completed':
        console.log(`[MCP] Handoff completed: ${data.status}`);
        break;
      case 'violation_reported':
        console.log(`[MCP] ⚠️ VIOLATION: ${data.rule} - ${data.description}`);
        break;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  send(type, data) {
    if (!this.connected) {
      throw new Error('Not connected to MCP server');
    }
    this.ws.send(JSON.stringify({ type, data }));
  }

  // Handoff 시작
  startHandoff(data) {
    this.send('handoff_start', data);
  }

  // 진행상황 업데이트
  updateProgress(data) {
    this.send('progress_update', data);
  }

  // Handoff 완료
  completeHandoff(data) {
    this.send('handoff_complete', data);
  }

  // 위반 보고
  reportViolation(data) {
    this.send('violation', data);
  }

  // Ping
  ping() {
    this.send('ping', {});
  }

  // 연결 종료
  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// REST API 클라이언트 (WebSocket 없이 사용)
class MCPRestClient {
  constructor(baseUrl = 'http://localhost:3002') {
    this.baseUrl = baseUrl;
  }

  async request(method, path, body = null) {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${this.baseUrl}${path}`, options);
    return res.json();
  }

  getState() {
    return this.request('GET', '/api/state');
  }

  getHandoff() {
    return this.request('GET', '/api/handoff');
  }

  startHandoff(data) {
    return this.request('POST', '/api/handoff/start', data);
  }

  updateProgress(data) {
    return this.request('PATCH', '/api/handoff/progress', data);
  }

  completeHandoff(data) {
    return this.request('POST', '/api/handoff/complete', data);
  }

  reportViolation(data) {
    return this.request('POST', '/api/violation', data);
  }

  getHistory() {
    return this.request('GET', '/api/history');
  }

  getViolations() {
    return this.request('GET', '/api/violations');
  }
}

module.exports = { MCPClient, MCPRestClient };

// CLI 모드
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  const rest = new MCPRestClient();

  async function main() {
    switch (command) {
      case 'status':
        console.log(await rest.getState());
        break;
      case 'handoff':
        console.log(await rest.getHandoff());
        break;
      case 'history':
        console.log(await rest.getHistory());
        break;
      case 'violations':
        console.log(await rest.getViolations());
        break;
      default:
        console.log('Usage: node client.js <command>');
        console.log('Commands: status, handoff, history, violations');
    }
  }

  main().catch(console.error);
}
