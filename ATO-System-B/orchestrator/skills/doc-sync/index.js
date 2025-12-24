/**
 * DocSyncSkill - 문서 동기화 Skill
 *
 * 역할: 로컬 문서 ↔ Notion 동기화
 *
 * @version 2.1.0
 * @updated 2025-12-24 - 네이밍 리팩토링 (DocAgent → DocSyncSkill)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SkillLoader } from '../skill-loader.js';
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

/**
 * DocSyncSkill 클래스
 */
class DocSyncSkill {
  constructor(options = {}) {
    this.name = 'doc-sync';
    this.version = '2.1.0'; // SKILL.md와 동기화
    this.options = options;
    this.mapping = loadMapping();

    // SkillLoader 추가
    this.skillLoader = new SkillLoader(path.join(__dirname, '..'));
    this.skill = null;
  }

  /**
   * 초기화 - SKILL.md 로드
   */
  async initialize() {
    this.skill = await this.skillLoader.loadSkill('doc-sync');
    console.log('[DocSyncSkill] Initialized with SKILL.md');
    return this;
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
        'status-check',      // 동기화 상태 확인
        'sync-to-notion',    // 로컬 → Notion 동기화 준비
        'sync-from-notion',  // Notion → 로컬 동기화 준비
        'discover-pages',    // 누락된 Notion 페이지 검색
        'version-compare'    // 버전 비교
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

      // 로컬 문서 확인
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
   * 에이전트 실행 (CLI 호환)
   * @param {string} command - 명령어
   * @param {object} args - 인자
   */
  async execute(command, args = {}) {
    switch (command) {
      case 'status':
        return await this.getStatus();

      case 'to-notion':
        return await this.prepareToNotion(args.target || 'all');

      case 'from-notion':
        return await this.prepareFromNotion(args.target || 'all');

      case 'discover':
        return await this.discoverPages();

      case 'version':
        return this.getDocVersion(args.doc);

      case 'needs-sync':
        return this.getDocumentsNeedingSync();

      case 'info':
      default:
        return this.getInfo();
    }
  }
}

// 싱글톤 인스턴스
let instance = null;

/**
 * DocSyncSkill 인스턴스 가져오기
 */
export function getDocSyncSkill(options = {}) {
  if (!instance) {
    instance = new DocSyncSkill(options);
  }
  return instance;
}

// 팩토리 패턴 기본 내보내기
export default {
  create: (config = {}) => new DocSyncSkill(config),
  meta: {
    name: 'doc-sync',
    version: '2.1.0',
    description: '로컬 ↔ Notion 양방향 동기화 전문가',
    category: 'utility',
    dependencies: ['SkillLoader', 'NotionClient'],
    status: 'active'
  }
};

export { DocSyncSkill };

// CLI 실행 시
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const skill = getDocSyncSkill();
  const command = process.argv[2] || 'info';
  const args = {
    target: process.argv[3],
    doc: process.argv[3]
  };

  skill.execute(command, args)
    .then(result => {
      if (result) {
        console.log(JSON.stringify(result, null, 2));
      }
    })
    .catch(console.error);
}
