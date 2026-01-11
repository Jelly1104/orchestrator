/**
 * DesignerSkill - 설계 문서 시각화 고도화 전문가
 *
 * LeaderAgent 산출물(Mermaid, ASCII)을 인터랙티브 HTML로 변환
 *
 * @version 2.2.0
 * @since 2025-12-19
 * @updated 2025-12-24 - 네이밍 리팩토링 (DesignAgent → DesignerSkill)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { SkillLoader } from '../tool-loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DesignerTool {
  constructor(config = {}) {
    this.projectRoot = config.projectRoot || process.cwd();
    // 케이스별 visuals 폴더를 사용하도록 변경
    this.baseCasesDir = path.join(this.projectRoot, 'docs', 'cases');
    this.skillLoader = new SkillLoader(path.join(__dirname, '..'));
    this.skill = null;

    // 기본 옵션
    this.defaultOptions = {
      theme: 'dark',
      interactive: true,
      animation: true
    };
  }

  /**
   * taskId에서 순수 케이스명 추출 (날짜/타임스탬프 제거)
   */
  extractCaseId(taskId) {
    return taskId.replace(/-(\d{8}|\d{13,})$/, '');
  }

  /**
   * 케이스별 visuals 출력 디렉토리 반환
   */
  getOutputDir(taskId) {
    const caseId = this.extractCaseId(taskId);
    return path.join(this.baseCasesDir, caseId, 'visuals');
  }

  /**
   * 초기화
   */
  async initialize() {
    this.skill = await this.skillLoader.loadSkill('designer');
    return this;
  }

  /**
   * 설계 문서 시각화
   *
   * @param {Object} input - 입력 데이터
   * @param {Object} input.documents - { ia, wireframe, sdd }
   * @param {Object} input.options - { theme, interactive, animation }
   * @returns {Promise<Object>} 생성된 HTML 파일 정보
   */
  async visualize(input) {
    const { documents, options = {}, taskId } = input;
    const opts = { ...this.defaultOptions, ...options };

    // 케이스별 visuals 디렉토리 생성
    const outputDir = taskId ? this.getOutputDir(taskId) : path.join(this.baseCasesDir, '_shared', 'visuals');
    await fs.mkdir(outputDir, { recursive: true });

    const results = {
      files: [],
      errors: []
    };

    try {
      // 1. IA 시각화
      if (documents.ia) {
        const iaResult = await this._visualizeIA(documents.ia, opts, outputDir);
        results.files.push(iaResult);
      }

      // 2. Wireframe 시각화
      if (documents.wireframe) {
        const wfResult = await this._visualizeWireframe(documents.wireframe, opts, outputDir);
        results.files.push(wfResult);
      }

      // 3. SDD 시각화
      if (documents.sdd) {
        const sddResult = await this._visualizeSDD(documents.sdd, opts, outputDir);
        results.files.push(sddResult);
      }

    } catch (error) {
      results.errors.push(error.message);
    }

    return results;
  }

  /**
   * IA 문서 시각화
   */
  async _visualizeIA(iaContent, options, outputDir) {
    const mermaidBlocks = this._extractMermaid(iaContent);
    const html = this._generateIAHtml(iaContent, mermaidBlocks, options);

    const filePath = path.join(outputDir, 'IA_VISUAL.html');
    await fs.writeFile(filePath, html, 'utf-8');

    return { type: 'ia', path: filePath, mermaidCount: mermaidBlocks.length };
  }

  /**
   * Wireframe 시각화
   */
  async _visualizeWireframe(wireframeContent, options, outputDir) {
    const asciiBlocks = this._extractAscii(wireframeContent);
    const html = this._generateWireframeHtml(wireframeContent, asciiBlocks, options);

    const filePath = path.join(outputDir, 'WIREFRAME_PREVIEW.html');
    await fs.writeFile(filePath, html, 'utf-8');

    return { type: 'wireframe', path: filePath, screenCount: asciiBlocks.length };
  }

  /**
   * SDD 시각화
   */
  async _visualizeSDD(sddContent, options, outputDir) {
    const mermaidBlocks = this._extractMermaid(sddContent);
    const apiBlocks = this._extractApiSpecs(sddContent);
    const html = this._generateSDDHtml(sddContent, mermaidBlocks, apiBlocks, options);

    const filePath = path.join(outputDir, 'SDD_DIAGRAM.html');
    await fs.writeFile(filePath, html, 'utf-8');

    return { type: 'sdd', path: filePath, diagramCount: mermaidBlocks.length, apiCount: apiBlocks.length };
  }

  /**
   * Mermaid 블록 추출
   */
  _extractMermaid(content) {
    const regex = /```mermaid\n([\s\S]*?)```/g;
    const blocks = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      blocks.push(match[1].trim());
    }

    return blocks;
  }

  /**
   * ASCII 와이어프레임 추출
   */
  _extractAscii(content) {
    const regex = /```(?:ascii|text|wireframe)?\n([\s\S]*?)```/g;
    const blocks = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      const block = match[1].trim();
      // ASCII 박스 문자 포함된 것만
      if (/[┌┐└┘│─┬┴├┤┼\+\-\|]/.test(block)) {
        blocks.push(block);
      }
    }

    return blocks;
  }

  /**
   * API 스펙 추출
   */
  _extractApiSpecs(content) {
    const regex = /###?\s*(GET|POST|PUT|DELETE|PATCH)\s+([^\n]+)/gi;
    const specs = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      specs.push({
        method: match[1].toUpperCase(),
        endpoint: match[2].trim()
      });
    }

    return specs;
  }

  /**
   * IA HTML 생성
   */
  _generateIAHtml(content, mermaidBlocks, options) {
    const theme = options.theme === 'dark' ? 'dark' : 'default';

    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IA - 정보 구조</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    :root {
      --bg: ${options.theme === 'dark' ? '#1a1a2e' : '#ffffff'};
      --text: ${options.theme === 'dark' ? '#e0e0e0' : '#333333'};
      --primary: #e94560;
      --secondary: #0f3460;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 2px solid var(--primary);
      margin-bottom: 30px;
    }
    .header h1 { color: var(--primary); }
    .diagram-container {
      background: ${options.theme === 'dark' ? '#16213e' : '#f5f5f5'};
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      overflow: auto;
    }
    .diagram-title {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 15px;
      color: var(--primary);
    }
    .mermaid {
      display: flex;
      justify-content: center;
    }
    .controls {
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      gap: 10px;
    }
    .controls button {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      background: var(--primary);
      color: white;
      cursor: pointer;
      font-size: 14px;
    }
    .controls button:hover { opacity: 0.8; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 정보 구조 (IA)</h1>
    <p>Information Architecture Visualization</p>
  </div>

  ${mermaidBlocks.map((block, i) => `
  <div class="diagram-container">
    <div class="diagram-title">다이어그램 ${i + 1}</div>
    <div class="mermaid">
${block}
    </div>
  </div>
  `).join('')}

  ${mermaidBlocks.length === 0 ? '<p style="text-align:center;color:#888;">Mermaid 다이어그램이 없습니다.</p>' : ''}

  <div class="controls">
    <button onclick="window.print()">🖨️ 인쇄</button>
    <button onclick="location.reload()">🔄 새로고침</button>
  </div>

  <script>
    mermaid.initialize({
      startOnLoad: true,
      theme: '${theme}',
      securityLevel: 'loose'
    });
  </script>
</body>
</html>`;
  }

  /**
   * Wireframe HTML 생성
   */
  _generateWireframeHtml(content, asciiBlocks, options) {
    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wireframe Preview</title>
  <style>
    :root {
      --bg: ${options.theme === 'dark' ? '#1a1a2e' : '#ffffff'};
      --text: ${options.theme === 'dark' ? '#e0e0e0' : '#333333'};
      --primary: #e94560;
      --frame-bg: ${options.theme === 'dark' ? '#0d1b2a' : '#f0f0f0'};
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 2px solid var(--primary);
    }
    .header h1 { color: var(--primary); }
    .main {
      flex: 1;
      display: flex;
      padding: 20px;
      gap: 20px;
    }
    .device-frame {
      width: 375px;
      min-height: 667px;
      background: var(--frame-bg);
      border-radius: 30px;
      padding: 40px 15px 30px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      position: relative;
      overflow: hidden;
    }
    .device-frame::before {
      content: '';
      position: absolute;
      top: 15px;
      left: 50%;
      transform: translateX(-50%);
      width: 80px;
      height: 6px;
      background: #333;
      border-radius: 3px;
    }
    .screen-content {
      background: white;
      color: #333;
      height: 100%;
      border-radius: 10px;
      padding: 15px;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      white-space: pre;
      overflow: auto;
      line-height: 1.3;
    }
    .screen-list {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 300px;
    }
    .screen-item {
      padding: 15px;
      background: ${options.theme === 'dark' ? '#16213e' : '#f5f5f5'};
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .screen-item:hover { background: var(--primary); color: white; }
    .screen-item.active { background: var(--primary); color: white; }
    .no-screens {
      text-align: center;
      padding: 40px;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📱 Wireframe Preview</h1>
    <p>Interactive Screen Mockups</p>
  </div>

  <div class="main">
    <div class="device-frame">
      <div class="screen-content" id="screen-display">
${asciiBlocks.length > 0 ? asciiBlocks[0] : '화면을 선택하세요'}
      </div>
    </div>

    <div class="screen-list">
      <h3 style="margin-bottom: 10px;">화면 목록</h3>
      ${asciiBlocks.length > 0
        ? asciiBlocks.map((_, i) => `
          <div class="screen-item ${i === 0 ? 'active' : ''}" data-index="${i}">
            📄 화면 ${i + 1}
          </div>
        `).join('')
        : '<div class="no-screens">ASCII 와이어프레임이 없습니다</div>'
      }
    </div>
  </div>

  <script>
    const screens = ${JSON.stringify(asciiBlocks)};
    const display = document.getElementById('screen-display');
    const items = document.querySelectorAll('.screen-item');

    items.forEach(item => {
      item.addEventListener('click', () => {
        items.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const index = parseInt(item.dataset.index);
        display.textContent = screens[index] || '';
      });
    });
  </script>
</body>
</html>`;
  }

  /**
   * SDD HTML 생성
   */
  _generateSDDHtml(content, mermaidBlocks, apiSpecs, options) {
    const theme = options.theme === 'dark' ? 'dark' : 'default';

    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SDD - 시스템 설계</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    :root {
      --bg: ${options.theme === 'dark' ? '#1a1a2e' : '#ffffff'};
      --text: ${options.theme === 'dark' ? '#e0e0e0' : '#333333'};
      --primary: #e94560;
      --card-bg: ${options.theme === 'dark' ? '#16213e' : '#f5f5f5'};
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 2px solid var(--primary);
      margin-bottom: 30px;
    }
    .header h1 { color: var(--primary); }
    .tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }
    .tab {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      background: var(--card-bg);
      color: var(--text);
      cursor: pointer;
      font-size: 14px;
    }
    .tab.active { background: var(--primary); color: white; }
    .section {
      display: none;
    }
    .section.active { display: block; }
    .card {
      background: var(--card-bg);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .card-title {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 15px;
      color: var(--primary);
    }
    .mermaid {
      display: flex;
      justify-content: center;
      overflow: auto;
    }
    .api-list {
      display: grid;
      gap: 10px;
    }
    .api-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px;
      background: ${options.theme === 'dark' ? '#0d1b2a' : '#e8e8e8'};
      border-radius: 8px;
    }
    .api-method {
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      color: white;
    }
    .api-method.GET { background: #10b981; }
    .api-method.POST { background: #3b82f6; }
    .api-method.PUT { background: #f59e0b; }
    .api-method.DELETE { background: #ef4444; }
    .api-method.PATCH { background: #8b5cf6; }
    .api-endpoint { font-family: 'Courier New', monospace; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏗️ 시스템 설계 문서 (SDD)</h1>
    <p>System Design Document Visualization</p>
  </div>

  <div class="tabs">
    <button class="tab active" data-section="diagrams">다이어그램</button>
    <button class="tab" data-section="api">API 명세</button>
  </div>

  <div id="diagrams" class="section active">
    ${mermaidBlocks.map((block, i) => `
    <div class="card">
      <div class="card-title">다이어그램 ${i + 1}</div>
      <div class="mermaid">
${block}
      </div>
    </div>
    `).join('')}
    ${mermaidBlocks.length === 0 ? '<div class="card"><p>다이어그램이 없습니다.</p></div>' : ''}
  </div>

  <div id="api" class="section">
    <div class="card">
      <div class="card-title">API 엔드포인트 목록</div>
      <div class="api-list">
        ${apiSpecs.length > 0
          ? apiSpecs.map(api => `
            <div class="api-item">
              <span class="api-method ${api.method}">${api.method}</span>
              <span class="api-endpoint">${api.endpoint}</span>
            </div>
          `).join('')
          : '<p>API 명세가 없습니다.</p>'
        }
      </div>
    </div>
  </div>

  <script>
    mermaid.initialize({
      startOnLoad: true,
      theme: '${theme}',
      securityLevel: 'loose'
    });

    const tabs = document.querySelectorAll('.tab');
    const sections = document.querySelectorAll('.section');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.section).classList.add('active');
      });
    });
  </script>
</body>
</html>`;
  }
}

export default {
  create: (config = {}) => new DesignerSkill(config),
  meta: {
    name: 'designer',
    version: '2.2.0',
    description: '설계 문서 시각화 고도화 전문가 (Mermaid/ASCII → HTML)',
    category: 'builder',
    dependencies: ['SkillLoader'],
    status: 'active'
  }
};

export { DesignerSkill };
