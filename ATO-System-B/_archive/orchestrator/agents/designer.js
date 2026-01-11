/**
 * DesignerAgent - 설계 문서 자동 생성 에이전트
 *
 * Phase 6-2: IA/Wireframe/SDD 자동 생성
 *
 * 역할:
 * - IA (Information Architecture) 문서 생성
 * - Wireframe 문서 생성 (ASCII)
 * - SDD (System Design Document) 생성
 * - HTML 프리뷰 생성 (Phase 6-3)
 *
 * HITL 연동:
 * - 설계 완료 시 DESIGN_APPROVAL 체크포인트 트리거
 *
 * @version 1.0.0
 * @since 2025-12-22
 */

import fs from 'fs';
import path from 'path';
import { ProviderFactory } from '../providers/index.js';

// ========== 설계 템플릿 ==========
const TEMPLATES = {
  IA: {
    sections: ['페이지 계층', '네비게이션', '데이터 매핑', '라우팅'],
    minScore: 70,
  },
  WIREFRAME: {
    sections: ['레이아웃', '컴포넌트 목록', '인터랙션', '데이터 바인딩'],
    minScore: 70,
  },
  SDD: {
    sections: ['API 명세', '데이터 모델', '에러 처리', '보안'],
    minScore: 70,
  },
};

// ========== 보안 상수 ==========
const SECURITY_LIMITS = {
  MAX_PRD_LENGTH: 50000,
  MAX_OUTPUT_LENGTH: 100000,
};

export class DesignerAgent {
  constructor(config = {}) {
    this.projectRoot = config.projectRoot || process.cwd();
    this.maxTokens = config.maxTokens || 16384;
    this.outputDir = config.outputDir || path.join(this.projectRoot, 'docs', 'cases');

    // Multi-LLM Provider 설정
    this.providerName = config.provider || 'anthropic';
    this.providerConfig = config.providerConfig || {};
    this.fallbackOrder = config.fallbackOrder || ['anthropic', 'openai', 'gemini'];
    this.useFallback = config.useFallback !== false;

    this._initProvider();
  }

  /**
   * taskId에서 순수 케이스명 추출 (날짜/타임스탬프 제거)
   */
  extractCaseId(taskId) {
    return taskId.replace(/-(\d{8}|\d{13,})$/, '');
  }

  /**
   * Provider 초기화
   */
  _initProvider() {
    try {
      this.provider = ProviderFactory.create(this.providerName, {
        ...this.providerConfig,
        maxTokens: this.maxTokens
      });

      if (!this.provider.isAvailable()) {
        if (this.useFallback) {
          this.provider = ProviderFactory.getFirstAvailable(this.fallbackOrder, {
            [this.providerName]: this.providerConfig
          });
        }
      }

      if (this.provider) {
        console.log(`[DesignerAgent] Using provider: ${this.provider.getName()}`);
      }
    } catch (error) {
      console.error(`[DesignerAgent] Provider initialization failed: ${error.message}`);
      this.provider = null;
    }
  }

  async _sendMessage(systemPrompt, userMessage) {
    if (!this.provider) {
      throw new Error('[DesignerAgent] No available provider');
    }

    if (this.useFallback) {
      return await ProviderFactory.sendWithFallback(
        systemPrompt,
        userMessage,
        this.fallbackOrder,
        { [this.providerName]: this.providerConfig }
      );
    }

    const result = await this.provider.sendMessage(systemPrompt, userMessage);
    return { ...result, provider: this.provider.getName() };
  }

  // ========== 전체 설계 문서 생성 ==========

  /**
   * PRD에서 전체 설계 문서 생성
   * @param {Object} prd - 파싱된 PRD 객체
   * @param {string} taskId - 태스크 ID
   * @returns {Object} - { ia, wireframe, sdd, handoff, paths }
   */
  async generateDesignDocs(prd, taskId) {
    console.log('\n[DesignerAgent] ========== 설계 문서 생성 ==========');
    console.log(`[DesignerAgent] Task ID: ${taskId}`);

    const results = {
      ia: null,
      wireframe: null,
      sdd: null,
      handoff: null,
      paths: {},
      errors: [],
      requiresApproval: true,
      timestamp: new Date().toISOString(),
    };

    // 출력 디렉토리 생성 (순수 케이스명 사용)
    const caseId = this.extractCaseId(taskId);
    const taskDir = path.join(this.outputDir, caseId);
    if (!fs.existsSync(taskDir)) {
      fs.mkdirSync(taskDir, { recursive: true });
    }

    try {
      // 1. IA 생성
      console.log('\n[Step 1] IA 생성...');
      results.ia = await this.generateIA(prd);
      if (results.ia) {
        const iaPath = path.join(taskDir, 'IA.md');
        fs.writeFileSync(iaPath, results.ia, 'utf-8');
        results.paths.ia = iaPath;
        console.log(`  ✓ IA.md 생성 완료`);
      }

      // 2. Wireframe 생성
      console.log('\n[Step 2] Wireframe 생성...');
      results.wireframe = await this.generateWireframe(prd, results.ia);
      if (results.wireframe) {
        const wfPath = path.join(taskDir, 'Wireframe.md');
        fs.writeFileSync(wfPath, results.wireframe, 'utf-8');
        results.paths.wireframe = wfPath;
        console.log(`  ✓ Wireframe.md 생성 완료`);
      }

      // 3. SDD 생성
      console.log('\n[Step 3] SDD 생성...');
      results.sdd = await this.generateSDD(prd, results.ia, results.wireframe);
      if (results.sdd) {
        const sddPath = path.join(taskDir, 'SDD.md');
        fs.writeFileSync(sddPath, results.sdd, 'utf-8');
        results.paths.sdd = sddPath;
        console.log(`  ✓ SDD.md 생성 완료`);
      }

      // 4. Handoff 생성
      console.log('\n[Step 4] Handoff 생성...');
      results.handoff = await this.generateHandoff(prd, results.ia, results.wireframe, results.sdd);
      if (results.handoff) {
        const handoffPath = path.join(taskDir, 'HANDOFF.md');
        fs.writeFileSync(handoffPath, results.handoff, 'utf-8');
        results.paths.handoff = handoffPath;
        console.log(`  ✓ HANDOFF.md 생성 완료`);
      }

    } catch (error) {
      console.error(`[DesignerAgent] 오류: ${error.message}`);
      results.errors.push(error.message);
    }

    console.log('\n[DesignerAgent] ========== 설계 문서 생성 완료 ==========\n');
    return results;
  }

  // ========== IA 생성 ==========

  /**
   * IA (Information Architecture) 문서 생성
   */
  async generateIA(prd) {
    const systemPrompt = `당신은 UX/IA 설계 전문가입니다.

## 역할
PRD를 바탕으로 Information Architecture (정보 구조) 문서를 생성합니다.

## IA 필수 섹션
1. **페이지 계층 구조** - 트리 형태로 페이지 관계 정의
2. **네비게이션 설계** - GNB/LNB/탭 구조
3. **데이터 매핑** - 각 페이지에서 사용하는 데이터 소스
4. **라우팅 설계** - URL 패턴 및 라우트 정의

## 출력 형식
Markdown 형식으로 작성합니다. 트리 구조는 들여쓰기나 ASCII로 표현합니다.

예시:
\`\`\`
├── /dashboard
│   ├── /dashboard/overview
│   └── /dashboard/settings
└── /users
    ├── /users/list
    └── /users/:id
\`\`\``;

    const userMessage = `## PRD 정보

### 목적
${prd.objective || prd.목적 || 'N/A'}

### 타겟 유저
${prd.targetUser || prd.타겟 || 'N/A'}

### 핵심 기능
${JSON.stringify(prd.coreFeatures || prd.기능 || [], null, 2)}

### 산출물 체크리스트
${JSON.stringify(prd.deliverables || prd.산출물 || [], null, 2)}

위 PRD를 바탕으로 IA 문서를 생성해주세요.`;

    try {
      const response = await this._sendMessage(systemPrompt, userMessage);
      return this._formatDocument('IA', response.content);
    } catch (error) {
      console.error('[DesignerAgent] IA 생성 실패:', error.message);
      return null;
    }
  }

  // ========== Wireframe 생성 ==========

  /**
   * Wireframe 문서 생성 (ASCII)
   */
  async generateWireframe(prd, ia) {
    const systemPrompt = `당신은 UI/UX 설계 전문가입니다.

## 역할
PRD와 IA를 바탕으로 Wireframe 문서를 생성합니다.
ASCII art로 화면 레이아웃을 표현합니다.

## Wireframe 필수 섹션
1. **화면 목록** - 주요 화면 리스트
2. **레이아웃** - ASCII art로 각 화면 구조 표현
3. **컴포넌트 설명** - 각 컴포넌트의 역할과 상태
4. **인터랙션** - 사용자 액션과 반응
5. **데이터 바인딩** - 컴포넌트-데이터 연결

## ASCII art 예시
\`\`\`
┌────────────────────────────────────────┐
│  [Logo]           [검색]     [로그인]  │
├────────────────────────────────────────┤
│  ┌──────────┐  ┌───────────────────┐  │
│  │  사이드   │  │                   │  │
│  │  메뉴    │  │    메인 콘텐츠     │  │
│  │          │  │                   │  │
│  └──────────┘  └───────────────────┘  │
└────────────────────────────────────────┘
\`\`\``;

    const userMessage = `## PRD 정보
${JSON.stringify({ objective: prd.objective || prd.목적, features: prd.coreFeatures || prd.기능 }, null, 2)}

## IA 문서
${ia || 'N/A'}

위 정보를 바탕으로 Wireframe 문서를 생성해주세요.`;

    try {
      const response = await this._sendMessage(systemPrompt, userMessage);
      return this._formatDocument('Wireframe', response.content);
    } catch (error) {
      console.error('[DesignerAgent] Wireframe 생성 실패:', error.message);
      return null;
    }
  }

  // ========== SDD 생성 ==========

  /**
   * SDD (System Design Document) 생성
   */
  async generateSDD(prd, ia, wireframe) {
    const systemPrompt = `당신은 시스템 아키텍트입니다.

## 역할
PRD, IA, Wireframe을 바탕으로 SDD (System Design Document)를 생성합니다.

## SDD 필수 섹션
1. **시스템 개요** - 아키텍처 다이어그램
2. **API 명세** - 엔드포인트, Request/Response 형식
3. **데이터 모델** - 엔티티 정의, 스키마
4. **에러 처리** - 에러 코드, 예외 처리 방식
5. **보안** - 인증/인가, 민감 정보 처리
6. **성능** - 캐싱, 인덱싱, 페이지네이션

## API 명세 예시
\`\`\`
### GET /api/users

Request:
- Query: page, limit, filter

Response:
\`\`\`json
{
  "success": true,
  "data": [...],
  "pagination": { "page": 1, "total": 100 }
}
\`\`\`
\`\`\``;

    const userMessage = `## PRD 정보
${JSON.stringify({
  objective: prd.objective || prd.목적,
  dataRequirements: prd.dataRequirements || prd.데이터요구사항
}, null, 2)}

## IA 문서 요약
${ia ? ia.substring(0, 2000) : 'N/A'}

## Wireframe 요약
${wireframe ? wireframe.substring(0, 2000) : 'N/A'}

위 정보를 바탕으로 SDD 문서를 생성해주세요.`;

    try {
      const response = await this._sendMessage(systemPrompt, userMessage);
      return this._formatDocument('SDD', response.content);
    } catch (error) {
      console.error('[DesignerAgent] SDD 생성 실패:', error.message);
      return null;
    }
  }

  // ========== Handoff 생성 ==========

  /**
   * Handoff (Sub-Agent 작업 지시서) 생성
   */
  async generateHandoff(prd, ia, wireframe, sdd) {
    const deliverables = prd.deliverables || prd.산출물 || [];

    let handoff = `# HANDOFF.md - Sub-agent 작업 지시서

> **생성일**: ${new Date().toISOString()}
> **PRD 유형**: ${prd.type || prd.pipeline || 'design'}

---

## 1. PRD 산출물 체크리스트 매핑

| # | PRD 항목 | 구현 방식 | 담당 |
|---|----------|----------|------|
${deliverables.map((d, i) => `| ${i + 1} | ${d.name || d.이름 || 'N/A'} | ${d.type || d.타입 || 'CODE'} | SubAgent |`).join('\n')}

---

## 2. Mode

\`\`\`
${prd.pipeline === 'analysis' ? 'Analysis' : 'Coding'}
\`\`\`

---

## 3. Required Outputs

${deliverables.map((d, i) => `- [ ] ${d.name || d.이름}: ${d.criteria || d.기준 || ''}`).join('\n')}

---

## 4. Input Documents

- IA.md: 정보 구조 정의
- Wireframe.md: 화면 설계
- SDD.md: 시스템 설계

---

## 5. Completion Criteria

${(prd.successCriteria || prd.성공지표 || ['모든 산출물 생성 완료']).map(c => `- ${c}`).join('\n')}

---

## 6. Constraints

- SELECT only (DB 접근 시)
- DOMAIN_SCHEMA.md 컬럼명 준수
- 80점 이상 Score 획득 필요

---

**END OF HANDOFF**
`;

    return handoff;
  }

  // ========== HTML 프리뷰 생성 (Phase 6-3) ==========

  /**
   * 설계 문서 → HTML 프리뷰 생성
   * @param {Object} design - { ia, wireframe, sdd }
   * @param {string} taskId - 태스크 ID
   * @returns {string} - HTML 파일 경로
   */
  async generateHTMLPreview(design, taskId) {
    console.log('[DesignerAgent] HTML 프리뷰 생성...');

    const caseId = this.extractCaseId(taskId);
    const taskDir = path.join(this.outputDir, caseId);
    const previewPath = path.join(taskDir, 'preview.html');

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>설계 프리뷰 - ${caseId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .header h1 { font-size: 24px; }
    .tabs { display: flex; gap: 10px; margin-bottom: 20px; }
    .tab { padding: 10px 20px; background: white; border: none; border-radius: 4px; cursor: pointer; }
    .tab.active { background: #2563eb; color: white; }
    .content { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .section { display: none; }
    .section.active { display: block; }
    pre { background: #f3f4f6; padding: 15px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; }
    .wireframe-box { border: 2px dashed #9ca3af; padding: 20px; margin: 10px 0; background: #f9fafb; font-family: monospace; }
    .approval-box { margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px; }
    .btn { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
    .btn-approve { background: #10b981; color: white; }
    .btn-reject { background: #ef4444; color: white; margin-left: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📐 설계 프리뷰</h1>
      <p>Task ID: ${taskId}</p>
      <p>생성일: ${new Date().toLocaleString('ko-KR')}</p>
    </div>

    <div class="tabs">
      <button class="tab active" onclick="showTab('ia')">IA</button>
      <button class="tab" onclick="showTab('wireframe')">Wireframe</button>
      <button class="tab" onclick="showTab('sdd')">SDD</button>
    </div>

    <div class="content">
      <div id="ia" class="section active">
        <h2>📊 Information Architecture</h2>
        <pre>${this._escapeHtml(design.ia || 'IA 문서가 없습니다.')}</pre>
      </div>

      <div id="wireframe" class="section">
        <h2>🖼️ Wireframe</h2>
        <div class="wireframe-box">
          <pre>${this._escapeHtml(design.wireframe || 'Wireframe이 없습니다.')}</pre>
        </div>
      </div>

      <div id="sdd" class="section">
        <h2>🔧 System Design Document</h2>
        <pre>${this._escapeHtml(design.sdd || 'SDD 문서가 없습니다.')}</pre>
      </div>
    </div>

    <div class="approval-box">
      <h3>⚠️ HITL: 설계 승인 필요</h3>
      <p>위 설계 문서를 검토하고 승인 또는 수정 요청을 해주세요.</p>
      <div style="margin-top: 10px;">
        <button class="btn btn-approve" onclick="approve()">✅ 승인</button>
        <button class="btn btn-reject" onclick="reject()">❌ 수정 요청</button>
      </div>
    </div>
  </div>

  <script>
    function showTab(tabId) {
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');
      event.target.classList.add('active');
    }

    function approve() {
      fetch('/api/tasks/${taskId}/approve', { method: 'POST' })
        .then(() => alert('설계가 승인되었습니다.'))
        .catch(e => alert('승인 실패: ' + e.message));
    }

    function reject() {
      const reason = prompt('수정 요청 사유를 입력하세요:');
      if (reason) {
        fetch('/api/tasks/${taskId}/reject', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason })
        })
        .then(() => alert('수정 요청이 전달되었습니다.'))
        .catch(e => alert('수정 요청 실패: ' + e.message));
      }
    }
  </script>
</body>
</html>`;

    fs.writeFileSync(previewPath, html, 'utf-8');
    console.log(`  ✓ preview.html 생성 완료: ${previewPath}`);

    return previewPath;
  }

  // ========== 유틸리티 ==========

  /**
   * 문서 포맷팅
   */
  _formatDocument(type, content) {
    const header = `# ${type}.md

> **생성일**: ${new Date().toISOString()}
> **생성 도구**: DesignAgent v1.0.0

---

`;
    return header + content;
  }

  /**
   * HTML 이스케이프
   */
  _escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

export default DesignerAgent;
