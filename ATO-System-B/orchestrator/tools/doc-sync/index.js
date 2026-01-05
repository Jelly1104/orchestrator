/**
 * DocSyncSkill - 문서 동기화 Skill
 *
 * 역할: 로컬 문서 ↔ Notion 동기화
 *
 * @version 3.0.0
 * @updated 2025-12-24 - 네이밍 리팩토링 (DocAgent → DocSyncSkill)
 * @updated 2025-12-26 - [P2-2] syncCase() 메서드 추가 (Milestone 3)
 * @updated 2025-12-26 - [P2-2-Fix] Mock Mode Payload 가시성 강화 (Milestone 3.5)
 * @updated 2025-12-26 - [P2-2-Real] Notion API 실환경 연동 (Milestone 3.5-Real)
 * @updated 2025-12-26 - BaseTool 상속으로 아키텍처 표준화 (Milestone 4)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BaseTool } from '../base/BaseTool.js';
import {
  extractVersion,
  compareVersions,
  loadMapping,
  saveMapping,
  readLocalDoc,
  checkStatus,
  syncToNotion,
  syncFromNotion,
  discoverNotionPages
} from './sync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// [P2-2] 케이스 동기화 대상 파일 목록
const CASE_SYNC_TARGETS = [
  { file: 'analysis/analysis_report.md', title: 'Analysis Report', type: 'analysis' },
  { file: 'design/IA.md', title: 'Information Architecture', type: 'design' },
  { file: 'design/Wireframe.md', title: 'Wireframe', type: 'design' },
  { file: 'design/SDD.md', title: 'System Design Document', type: 'design' },
  { file: 'design/HANDOFF.md', title: 'Developer Handoff', type: 'design' }
];

export class DocSyncTool extends BaseTool {
  constructor(options = {}) {
    // BaseTool 초기화
    super({
      name: 'DocSyncTool',
      version: '3.0.0',
      projectRoot: options.projectRoot,
      requiredParams: [],
      debug: options.debug
    });

    this.options = options;
    this.mapping = loadMapping();

    // [P2-2-Real] Notion API 설정 (Milestone 3.5-Real)
    this.notionApiKey = options.notionApiKey || process.env.NOTION_API_KEY || process.env.NOTION_TOKEN || null;
    this.notionParentPageId = options.notionParentPageId || process.env.NOTION_PARENT_PAGE_ID || null;
    this.notionDatabaseId = options.notionDatabaseId || process.env.NOTION_DATABASE_ID || null;
    this.mockMode = !this.notionApiKey;

    // API 키 감지 로그
    if (this.notionApiKey) {
      this.log('🔑 Notion API Key detected. Switching to LIVE mode.');
    }
  }

  /**
   * 초기화 - TOOL.md 로드
   */
  async initialize() {
    await super.initialize(path.join(__dirname, '..'));
    // toolLoader는 BaseTool.initialize()에서 이미 설정됨
    return this;
  }

  /**
   * 실행 메서드 (BaseTool 인터페이스 구현)
   *
   * @param {Object} params - 실행 파라미터
   * @param {string} params.command - 명령어 (status, to-notion, from-notion, sync, etc.)
   * @param {string} params.target - 대상 (문서 이름, caseId 등)
   * @param {Object} context - 실행 컨텍스트
   * @returns {Promise<Object>} 실행 결과
   */
  async execute(params, context = {}) {
    const command = params?.command || 'info';
    const target = params?.target || params?.caseId;

    switch (command) {
      case 'status':
        return await this.getStatus();

      case 'to-notion':
        return await this.prepareToNotion(target || 'all');

      case 'from-notion':
        return await this.prepareFromNotion(target || 'all');

      case 'discover':
        return await this.discoverPages();

      case 'version':
        return this.getDocVersion(target);

      case 'needs-sync':
        return this.getDocumentsNeedingSync();

      case 'sync':
      case 'syncCase':
        if (!target) {
          throw new Error('DocSyncSkill: caseId는 필수입니다.');
        }
        return await this.syncCase(target, params);

      case 'info':
      default:
        return this.getInfo();
    }
  }

  /**
   * 에이전트 정보
   */
  getInfo() {
    return {
      name: this.name,
      version: this.version,
      description: '로컬 문서와 Notion 페이지 간 동기화 관리',
      capabilities: [
        'status-check',
        'sync-to-notion',
        'sync-from-notion',
        'discover-pages',
        'version-compare'
      ]
    };
  }

  /**
   * 동기화 상태 조회
   */
  async getStatus() {
    return await checkStatus();
  }

  /**
   * Notion으로 동기화 준비
   * @param {string} target - 문서 이름 또는 'all'
   */
  async prepareToNotion(target = 'all') {
    return await syncToNotion(target);
  }

  /**
   * Notion에서 동기화 준비
   * @param {string} target - 문서 이름 또는 'all'
   */
  async prepareFromNotion(target = 'all') {
    return await syncFromNotion(target);
  }

  /**
   * 누락된 Notion 페이지 검색
   */
  async discoverPages() {
    return await discoverNotionPages();
  }

  /**
   * 특정 문서의 버전 정보
   * @param {string} docName - 문서 이름
   */
  getDocVersion(docName) {
    if (!this.mapping) return null;

    const doc = readLocalDoc(docName, this.mapping);
    if (doc.error) return { error: doc.error };

    return {
      name: docName,
      version: doc.version,
      path: doc.path,
      notionPageId: doc.notionPageId
    };
  }

  /**
   * 두 버전 비교
   * @param {string} v1 - 버전 1
   * @param {string} v2 - 버전 2
   * @returns {string} - 'newer' | 'older' | 'same'
   */
  compareVersions(v1, v2) {
    const result = compareVersions(v1, v2);
    if (result > 0) return 'newer';
    if (result < 0) return 'older';
    return 'same';
  }

  /**
   * 동기화가 필요한 문서 목록
   */
  getDocumentsNeedingSync() {
    if (!this.mapping) return [];

    const needsSync = [];

    for (const [docName, docMapping] of Object.entries(this.mapping.mappings)) {
      if (!docMapping.syncEnabled) continue;
      if (!docMapping.notionPageId) {
        needsSync.push({
          name: docName,
          reason: 'no-notion-page',
          action: 'create'
        });
        continue;
      }

      const doc = readLocalDoc(docName, this.mapping);
      if (doc.error) {
        needsSync.push({
          name: docName,
          reason: 'local-error',
          error: doc.error
        });
      }
    }

    return needsSync;
  }

  /**
   * 매핑에 새 문서 추가
   * @param {object} docInfo - 문서 정보
   */
  addDocumentMapping(docInfo) {
    if (!this.mapping) {
      this.mapping = loadMapping();
    }

    const { name, localPath, notionPageId, category, syncEnabled = true } = docInfo;

    this.mapping.mappings[name] = {
      notionPageId,
      localPath,
      category,
      syncEnabled
    };

    saveMapping(this.mapping);

    return { success: true, added: name };
  }

  /**
   * 매핑에서 Notion 페이지 ID 업데이트
   * @param {string} docName - 문서 이름
   * @param {string} notionPageId - Notion 페이지 ID
   */
  updateNotionPageId(docName, notionPageId) {
    if (!this.mapping) {
      this.mapping = loadMapping();
    }

    if (!this.mapping.mappings[docName]) {
      return { success: false, error: `Document not found: ${docName}` };
    }

    this.mapping.mappings[docName].notionPageId = notionPageId;
    delete this.mapping.mappings[docName].note;

    saveMapping(this.mapping);

    return { success: true, updated: docName, notionPageId };
  }

  /**
   * [P2-2] 케이스 문서 동기화 (Milestone 3)
   *
   * Phase B 완료 후 산출물을 Notion으로 동기화
   *
   * @param {string} caseId - 케이스 ID (예: case6-retest11)
   * @param {Object} options - 옵션
   * @returns {Object} 동기화 결과
   */
  async syncCase(caseId, options = {}) {
    const projectRoot = options.projectRoot || this.options.projectRoot || process.cwd();
    const taskId = options.taskId || options.runId || null;
    // 문서 경로 불일치 대응: {caseId}/{taskId}/... 우선, 없으면 {caseId}/...
    const primaryCasePath = taskId
      ? path.join(projectRoot, 'docs', 'cases', caseId, taskId)
      : path.join(projectRoot, 'docs', 'cases', caseId);
    const fallbackCasePath = path.join(projectRoot, 'docs', 'cases', caseId);
    const casePath = fs.existsSync(primaryCasePath) ? primaryCasePath : fallbackCasePath;

    this.log('========== Uploading documents to Notion... ==========');
    this.log(`Case: ${caseId}`);
    if (taskId) {
      this.log(`Task: ${taskId}`);
    }
    this.log(`Path: ${casePath}`);
    this.log(`Mode: ${this.mockMode ? 'Mock' : 'Live'}`);

    const results = {
      caseId,
      timestamp: new Date().toISOString(),
      mode: this.mockMode ? 'mock' : 'live',
      uploads: [],
      errors: [],
      summary: null
    };

    // 대상 파일 확인 및 동기화
    for (const target of CASE_SYNC_TARGETS) {
      const filePath = path.join(casePath, target.file);

      if (!fs.existsSync(filePath)) {
        this.log(`  ⏭️ Skip: ${target.file} (파일 없음)`);
        continue;
      }

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const stats = fs.statSync(filePath);

        const uploadResult = await this._uploadCaseDocument({
          title: `[${caseId}] ${target.title}`,
          content,
          type: target.type,
          filePath: target.file,
          size: stats.size,
          caseId
        });

        results.uploads.push(uploadResult);
        this.success(`${target.file} → ${uploadResult.status}`);

      } catch (error) {
        results.errors.push({
          file: target.file,
          error: error.message
        });
        this.error(`${target.file}: ${error.message}`);
      }
    }

    // 요약
    results.summary = {
      total: CASE_SYNC_TARGETS.length,
      uploaded: results.uploads.length,
      skipped: CASE_SYNC_TARGETS.length - results.uploads.length - results.errors.length,
      failed: results.errors.length
    };

    this.log('========== 동기화 완료 ==========');
    this.log(`업로드: ${results.summary.uploaded}/${results.summary.total}`);
    this.log(`스킵: ${results.summary.skipped}`);
    this.log(`실패: ${results.summary.failed}`);

    return results;
  }

  /**
   * [P2-2] 케이스 문서 업로드 (내부)
   */
  async _uploadCaseDocument(doc) {
    const notionPayload = this._convertMarkdownToNotionPayload(doc.title, doc.content);

    if (this.mockMode) {
      this.log(`  [Mock] Uploading: ${doc.title} (${this._formatBytes(doc.size)})`);
      this.log(`  [Mock] -------- Payload Preview --------`);
      this.log(`  [Mock] Title: "${notionPayload.parent.page_id ? 'Sub-page' : 'New Page'}"`);
      this.log(`  [Mock] Properties: { title: "${doc.title}" }`);
      this.log(`  [Mock] Blocks: ${notionPayload.children.length} blocks`);

      const previewBlocks = notionPayload.children.slice(0, 5);
      previewBlocks.forEach((block, idx) => {
        const blockType = Object.keys(block)[0];
        let preview = '';

        if (block[blockType]?.rich_text?.[0]?.text?.content) {
          preview = block[blockType].rich_text[0].text.content.substring(0, 50);
          if (block[blockType].rich_text[0].text.content.length > 50) preview += '...';
        }

        this.log(`  [Mock]   [${idx}] ${blockType}: "${preview}"`);
      });

      if (notionPayload.children.length > 5) {
        this.log(`  [Mock]   ... and ${notionPayload.children.length - 5} more blocks`);
      }
      this.log(`  [Mock] -------- End Payload --------`);

      return {
        file: doc.filePath,
        title: doc.title,
        status: 'mock_uploaded',
        size: doc.size,
        timestamp: new Date().toISOString(),
        notionUrl: null,
        mock: true,
        payload: notionPayload
      };
    }

    // [P2-2-Real] 실제 Notion API 호출
    this.log(`  [Real] 📤 Uploading: ${doc.title} (${this._formatBytes(doc.size)})`);

    try {
      const createdPage = await this._createNotionPage(doc.title, notionPayload.children, doc.caseId);

      this.success(`  [Real] Page created successfully`);
      this.log(`  [Real] 🔗 URL: ${createdPage.url}`);

      return {
        file: doc.filePath,
        title: doc.title,
        status: 'uploaded',
        size: doc.size,
        timestamp: new Date().toISOString(),
        notionUrl: createdPage.url,
        notionPageId: createdPage.id,
        mock: false,
        payload: notionPayload
      };
    } catch (error) {
      this.error(`  [Real] Upload failed: ${error.message}`);

      return {
        file: doc.filePath,
        title: doc.title,
        status: 'failed',
        size: doc.size,
        timestamp: new Date().toISOString(),
        notionUrl: null,
        mock: false,
        error: error.message,
        payload: notionPayload
      };
    }
  }

  /**
   * [P2-2-Real] Notion API를 사용하여 페이지 생성
   */
  async _createNotionPage(title, blocks, caseId) {
    const NOTION_API_URL = 'https://api.notion.com/v1/pages';

    const requestBody = {
      parent: this.notionParentPageId
        ? { page_id: this.notionParentPageId }
        : { database_id: this.notionDatabaseId || 'workspace' },
      properties: {
        title: {
          title: [{ type: 'text', text: { content: title } }]
        }
      },
      children: this._limitBlocks(blocks)
    };

    const notionVersion = process.env.NOTION_VERSION || '2022-06-28';
    const response = await fetch(NOTION_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': notionVersion
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Notion API Error (${response.status}): ${errorData.message || response.statusText}`);
    }

    const data = await response.json();

    return {
      id: data.id,
      url: data.url,
      created_time: data.created_time
    };
  }

  /**
   * Notion API 블록 제한 (최대 100개)
   */
  _limitBlocks(blocks) {
    if (blocks.length <= 100) return blocks;

    this.warn(`Block count (${blocks.length}) exceeds limit. Truncating to 100.`);
    return blocks.slice(0, 100);
  }

  /**
   * Markdown → Notion Blocks 변환
   */
  _convertMarkdownToNotionPayload(title, markdown) {
    const blocks = [];
    const lines = markdown.split('\n');

    let inCodeBlock = false;
    let codeContent = [];
    let codeLanguage = '';

    for (const line of lines) {
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLanguage = line.slice(3).trim() || 'plain text';
          codeContent = [];
        } else {
          blocks.push({
            code: {
              language: codeLanguage,
              rich_text: [{
                type: 'text',
                text: { content: codeContent.join('\n') }
              }]
            }
          });
          inCodeBlock = false;
        }
        continue;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        continue;
      }

      if (!line.trim()) continue;

      if (line.startsWith('# ')) {
        blocks.push({
          heading_1: {
            rich_text: [{ type: 'text', text: { content: line.slice(2).trim() } }]
          }
        });
        continue;
      }

      if (line.startsWith('## ')) {
        blocks.push({
          heading_2: {
            rich_text: [{ type: 'text', text: { content: line.slice(3).trim() } }]
          }
        });
        continue;
      }

      if (line.startsWith('### ')) {
        blocks.push({
          heading_3: {
            rich_text: [{ type: 'text', text: { content: line.slice(4).trim() } }]
          }
        });
        continue;
      }

      if (line.match(/^[-*]\s/)) {
        blocks.push({
          bulleted_list_item: {
            rich_text: [{ type: 'text', text: { content: line.slice(2).trim() } }]
          }
        });
        continue;
      }

      if (line.match(/^\d+\.\s/)) {
        const content = line.replace(/^\d+\.\s/, '').trim();
        blocks.push({
          numbered_list_item: {
            rich_text: [{ type: 'text', text: { content } }]
          }
        });
        continue;
      }

      if (line.match(/^[-*]\s\[[ x]\]/)) {
        const checked = line.includes('[x]');
        const content = line.replace(/^[-*]\s\[[ x]\]\s*/, '').trim();
        blocks.push({
          to_do: {
            checked,
            rich_text: [{ type: 'text', text: { content } }]
          }
        });
        continue;
      }

      if (line.startsWith('> ')) {
        blocks.push({
          quote: {
            rich_text: [{ type: 'text', text: { content: line.slice(2).trim() } }]
          }
        });
        continue;
      }

      if (line.match(/^-{3,}$/) || line.match(/^\*{3,}$/)) {
        blocks.push({ divider: {} });
        continue;
      }

      blocks.push({
        paragraph: {
          rich_text: [{ type: 'text', text: { content: line.trim() } }]
        }
      });
    }

    return {
      parent: { database_id: this.notionDatabaseId || 'mock-database-id' },
      properties: {
        title: {
          title: [{ type: 'text', text: { content: title } }]
        }
      },
      children: blocks
    };
  }

  /**
   * 바이트 포맷팅
   */
  _formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}

// 싱글톤 인스턴스
let instance = null;

/**
 * DocSyncTool 인스턴스 가져오기
 */
export function getDocSyncTool(options = {}) {
  if (!instance) {
    instance = new DocSyncTool(options);
  }
  return instance;
}

// 하위 호환 alias
export const getDocSyncSkill = getDocSyncTool;

export default {
  create: (config = {}) => new DocSyncTool(config),
  meta: {
    name: 'DocSyncTool',
    version: '3.0.0',
    description: '로컬 ↔ Notion 양방향 동기화 전문가 (BaseTool 기반)',
    category: 'utility',
    dependencies: ['BaseTool', 'SkillLoader', 'NotionClient'],
    status: 'active'
  }
};

// 하위 호환 alias
export const DocSyncSkill = DocSyncTool;

// CLI 실행 시
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tool = getDocSyncTool();
  const command = process.argv[2] || 'info';
  const args = {
    command,
    target: process.argv[3],
    doc: process.argv[3]
  };

  tool.execute(args)
    .then(result => {
      if (result) {
        console.log(JSON.stringify(result, null, 2));
      }
    })
    .catch(console.error);
}
