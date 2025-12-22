/**
 * Notion MCP Helper
 *
 * Claude Code의 Notion MCP 도구와 연동하기 위한 헬퍼 함수들
 *
 * @version 1.0.0
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Markdown을 Notion 블록 형식으로 변환
 * @param {string} markdown - 마크다운 내용
 * @returns {string} Notion 호환 마크다운
 */
export function markdownToNotion(markdown) {
  if (!markdown) return '';

  let content = markdown;

  // 1. 코드 블록 변환 (언어 지정)
  content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang || 'text';
    return '```' + language + '\n' + code.trim() + '\n```';
  });

  // 2. 체크박스 변환
  content = content.replace(/- \[x\]/gi, '- [x]');
  content = content.replace(/- \[ \]/g, '- [ ]');

  // 3. 테이블 형식 유지
  // Notion은 표준 마크다운 테이블 지원

  // 4. 수평선
  content = content.replace(/^---+$/gm, '---');

  // 5. 인용문
  content = content.replace(/^>\s*(.*)$/gm, '> $1');

  return content;
}

/**
 * Notion 페이지 내용을 Markdown으로 변환
 * @param {string} notionContent - Notion API에서 받은 내용
 * @returns {string} 마크다운
 */
export function notionToMarkdown(notionContent) {
  if (!notionContent) return '';

  let content = notionContent;

  // Notion 특수 문법 처리
  // 1. mention 태그 처리
  content = content.replace(/<mention-[^>]+>([^<]*)<\/mention-[^>]+>/g, '$1');

  // 2. 데이터베이스 참조 처리
  content = content.replace(/<database[^>]*>([^<]*)<\/database>/g, '[$1]');

  // 3. 페이지 참조 처리
  content = content.replace(/<page[^>]*>([^<]*)<\/page>/g, '[$1]');

  // 4. 색상 span 제거
  content = content.replace(/<span[^>]*color[^>]*>([^<]*)<\/span>/g, '$1');

  // 5. underline 처리
  content = content.replace(/<span[^>]*underline[^>]*>([^<]*)<\/span>/g, '_$1_');

  return content;
}

/**
 * 로컬 문서 버전 추출
 * @param {string} content - 문서 내용
 * @returns {string|null} 버전 문자열
 */
export function extractVersion(content) {
  if (!content) return null;

  const patterns = [
    /\*\*문서 버전\*\*:\s*(\d+\.\d+\.\d+)/,
    /\*\*버전\*\*:\s*(\d+\.\d+\.\d+)/,
    /[Vv]ersion[:\s]+(\d+\.\d+\.\d+)/,
    /@version\s+(\d+\.\d+\.\d+)/
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * 버전 비교
 * @param {string} v1 - 버전 1
 * @param {string} v2 - 버전 2
 * @returns {number} 1: v1 > v2, 0: 같음, -1: v1 < v2
 */
export function compareVersions(v1, v2) {
  if (!v1 && !v2) return 0;
  if (!v1) return -1;
  if (!v2) return 1;

  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }

  return 0;
}

/**
 * Notion 페이지 ID 정규화
 * @param {string} id - 페이지 ID 또는 URL
 * @returns {string} 정규화된 UUID
 */
export function normalizeNotionId(id) {
  if (!id) return null;

  // URL에서 ID 추출
  if (id.includes('notion.so')) {
    const match = id.match(/([a-f0-9]{32})/i);
    if (match) {
      id = match[1];
    }
  }

  // 하이픈 제거
  const cleanId = id.replace(/-/g, '').toLowerCase();

  // 32자 체크
  if (!/^[a-f0-9]{32}$/i.test(cleanId)) {
    return null;
  }

  // UUID 형식으로 변환 (8-4-4-4-12)
  return [
    cleanId.slice(0, 8),
    cleanId.slice(8, 12),
    cleanId.slice(12, 16),
    cleanId.slice(16, 20),
    cleanId.slice(20)
  ].join('-');
}

/**
 * 동기화 상태 파일 읽기
 * @param {string} projectRoot - 프로젝트 루트
 * @returns {Object} 동기화 상태
 */
export async function getSyncStatus(projectRoot) {
  const mappingPath = path.join(projectRoot, 'orchestrator/config/notion-mapping.json');

  try {
    const content = await fs.readFile(mappingPath, 'utf-8');
    const mapping = JSON.parse(content);

    const status = {
      lastUpdated: mapping.lastUpdated,
      totalMappings: Object.keys(mapping.mappings || {}).length,
      synced: 0,
      pending: 0,
      documents: []
    };

    for (const [name, info] of Object.entries(mapping.mappings || {})) {
      const doc = {
        name,
        localPath: info.localPath,
        notionPageId: info.notionPageId,
        syncEnabled: info.syncEnabled,
        category: info.category
      };

      if (info.notionPageId && info.syncEnabled) {
        status.synced++;
      } else if (info.syncEnabled) {
        status.pending++;
      }

      status.documents.push(doc);
    }

    return status;
  } catch (error) {
    return {
      error: error.message,
      lastUpdated: null,
      totalMappings: 0,
      synced: 0,
      pending: 0,
      documents: []
    };
  }
}

/**
 * 동기화 필요 문서 목록 가져오기
 * @param {string} projectRoot - 프로젝트 루트
 * @returns {Array} 동기화가 필요한 문서 목록
 */
export async function getDocumentsNeedingSync(projectRoot) {
  const status = await getSyncStatus(projectRoot);
  if (status.error) return [];

  const needsSync = [];

  for (const doc of status.documents) {
    if (!doc.syncEnabled) continue;

    // Notion 페이지 ID가 없으면 동기화 필요
    if (!doc.notionPageId) {
      needsSync.push({
        ...doc,
        reason: 'no_notion_page',
        action: 'create'
      });
      continue;
    }

    // 로컬 파일 확인
    const localPath = path.join(projectRoot, doc.localPath);
    try {
      await fs.access(localPath);
      // 파일 존재 - 버전 체크 필요
      const content = await fs.readFile(localPath, 'utf-8');
      const version = extractVersion(content);

      needsSync.push({
        ...doc,
        localVersion: version,
        reason: 'version_check',
        action: 'compare'
      });
    } catch {
      // 파일 없음
      needsSync.push({
        ...doc,
        reason: 'local_file_missing',
        action: 'fetch_from_notion'
      });
    }
  }

  return needsSync;
}

/**
 * MCP 도구 호출을 위한 명령어 생성
 * @param {string} tool - 도구 이름
 * @param {Object} params - 파라미터
 * @returns {string} 명령어 설명
 */
export function generateMcpCommand(tool, params) {
  const commands = {
    'search': {
      tool: 'mcp__notion__notion-search',
      description: '문서 검색',
      example: `mcp__notion__notion-search query="${params.query || 'document name'}"`
    },
    'fetch': {
      tool: 'mcp__notion__notion-fetch',
      description: '페이지 내용 가져오기',
      example: `mcp__notion__notion-fetch id="${params.id || 'page-id'}"`
    },
    'update': {
      tool: 'mcp__notion__notion-update-page',
      description: '페이지 업데이트',
      example: `mcp__notion__notion-update-page page_id="${params.pageId || 'page-id'}" command="replace_content"`
    },
    'create': {
      tool: 'mcp__notion__notion-create-pages',
      description: '새 페이지 생성',
      example: `mcp__notion__notion-create-pages parent.page_id="${params.parentId || 'parent-id'}"`
    }
  };

  return commands[tool] || null;
}

// Export all functions
export default {
  markdownToNotion,
  notionToMarkdown,
  extractVersion,
  compareVersions,
  normalizeNotionId,
  getSyncStatus,
  getDocumentsNeedingSync,
  generateMcpCommand
};
