/**
 * Doc-Agent Sync Module v2.1.0
 *
 * 로컬 문서 ↔ Notion 동기화 (실제 API 연동)
 *
 * Constitution 체계 v4.0.0:
 * - 00. Constitution: CLAUDE.md, SYSTEM_MANIFEST.md, DOMAIN_SCHEMA.md
 * - 01. Guides: Rules + Workflows
 * - 03. Context: AI_Playbook.md, AI_CONTEXT.md
 * - 04. Skills: 7개 Agent SKILL.md
 * - 99. Archive: 비활성 문서
 *
 * 사용법:
 *   node sync.js --status              문서 동기화 상태 확인
 *   node sync.js --to-notion <문서>    로컬 → Notion 동기화
 *   node sync.js --to-notion all       전체 문서 동기화
 *   node sync.js --from-notion <문서>  Notion → 로컬 동기화
 *   node sync.js --discover            누락된 Notion 페이지 검색
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Client } from '@notionhq/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');

// .env 로드 (orchestrator/.env)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Notion 클라이언트 초기화
const notion = new Client({ auth: process.env.NOTION_TOKEN });

// 설정 파일 경로
const MAPPING_PATH = path.join(projectRoot, 'orchestrator/config/notion-mapping.json');

// Constitution 체계 카테고리 아이콘
const CATEGORY_ICONS = {
  '00. Constitution': '🔒',
  '01. Guides': '📋',
  '03. Context': '💡',
  '04. Skills': '🛠️',
  '99. Archive': '🗄️'
};

// Skill Group 아이콘
const SKILL_GROUP_ICONS = {
  'Builders': '🏗️',
  'Analysts': '🧠',
  'Guardians': '🛡️',
  'Utilities': '🔧'
};

/**
 * 문서 버전 추출
 * @param {string} content - 문서 내용
 * @returns {string|null} - 버전 문자열
 */
function extractVersion(content) {
  // > **문서 버전**: 3.4.1 형식
  const versionMatch = content.match(/\*\*문서 버전\*\*:\s*(\d+\.\d+\.\d+)/);
  if (versionMatch) {
    return versionMatch[1];
  }

  // > **버전**: 2.0.0 형식
  const altMatch = content.match(/\*\*버전\*\*:\s*(\d+\.\d+\.\d+)/);
  if (altMatch) {
    return altMatch[1];
  }

  // @version 2.0.0 형식 (SKILL.md)
  const atVersionMatch = content.match(/@version\s+(\d+\.\d+\.\d+)/);
  if (atVersionMatch) {
    return atVersionMatch[1];
  }

  return null;
}

/**
 * 버전 비교
 * @param {string} v1 - 버전 1
 * @param {string} v2 - 버전 2
 * @returns {number} - 1: v1 > v2, 0: v1 = v2, -1: v1 < v2
 */
function compareVersions(v1, v2) {
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
 * 매핑 설정 로드
 */
function loadMapping() {
  if (!fs.existsSync(MAPPING_PATH)) {
    console.error('❌ 매핑 파일 없음:', MAPPING_PATH);
    return null;
  }
  return JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf-8'));
}

/**
 * 매핑 설정 저장
 */
function saveMapping(mapping) {
  mapping.lastUpdated = new Date().toISOString().split('T')[0];
  fs.writeFileSync(MAPPING_PATH, JSON.stringify(mapping, null, 2));
}

/**
 * 로컬 문서 읽기
 * @param {string} docName - 문서 이름
 * @param {object} mapping - 매핑 설정
 */
function readLocalDoc(docName, mapping) {
  const docMapping = mapping.mappings[docName];
  if (!docMapping) {
    return { error: `매핑 없음: ${docName}` };
  }

  const localPath = path.join(projectRoot, docMapping.localPath);
  if (!fs.existsSync(localPath)) {
    return { error: `파일 없음: ${localPath}` };
  }

  const content = fs.readFileSync(localPath, 'utf-8');
  const version = extractVersion(content);

  return {
    name: docName,
    path: localPath,
    content,
    version,
    notionPageId: docMapping.notionPageId,
    category: docMapping.category,
    skillGroup: docMapping.skillGroup,
    mutability: docMapping.mutability
  };
}

// Notion 지원 언어 목록
const NOTION_LANGUAGES = new Set([
  'abap', 'abc', 'agda', 'arduino', 'ascii art', 'assembly', 'bash', 'basic', 'bnf',
  'c', 'c#', 'c++', 'clojure', 'coffeescript', 'coq', 'css', 'dart', 'dhall', 'diff',
  'docker', 'ebnf', 'elixir', 'elm', 'erlang', 'f#', 'flow', 'fortran', 'gherkin',
  'glsl', 'go', 'graphql', 'groovy', 'haskell', 'hcl', 'html', 'idris', 'java',
  'javascript', 'json', 'julia', 'kotlin', 'latex', 'less', 'lisp', 'livescript',
  'llvm ir', 'lua', 'makefile', 'markdown', 'markup', 'matlab', 'mathematica', 'mermaid',
  'nix', 'notion formula', 'objective-c', 'ocaml', 'pascal', 'perl', 'php', 'plain text',
  'powershell', 'prolog', 'protobuf', 'purescript', 'python', 'r', 'racket', 'reason',
  'ruby', 'rust', 'sass', 'scala', 'scheme', 'scss', 'shell', 'smalltalk', 'solidity',
  'sql', 'swift', 'toml', 'typescript', 'vb.net', 'verilog', 'vhdl', 'visual basic',
  'webassembly', 'xml', 'yaml', 'java/c/c++/c#'
]);

// 언어 매핑 (비표준 → Notion 표준)
const LANGUAGE_MAP = {
  'js': 'javascript',
  'ts': 'typescript',
  'py': 'python',
  'rb': 'ruby',
  'sh': 'shell',
  'yml': 'yaml',
  'md': 'markdown',
  'text': 'plain text',
  'txt': 'plain text',
  '': 'plain text'
};

/**
 * 언어를 Notion 지원 형식으로 변환
 */
function normalizeLanguage(lang) {
  const lower = lang.toLowerCase().trim();
  if (NOTION_LANGUAGES.has(lower)) return lower;
  if (LANGUAGE_MAP[lower]) return LANGUAGE_MAP[lower];
  return 'plain text';
}

/**
 * Markdown을 Notion 블록으로 변환
 * @param {string} markdown - 마크다운 내용
 * @returns {Array} - Notion 블록 배열
 */
function markdownToNotionBlocks(markdown) {
  const blocks = [];
  const lines = markdown.split('\n');
  let codeBlock = null;
  let codeLanguage = '';

  for (const line of lines) {
    // 코드 블록 시작/종료
    if (line.startsWith('```')) {
      if (codeBlock === null) {
        codeLanguage = normalizeLanguage(line.slice(3).trim());
        codeBlock = [];
      } else {
        // 코드 내용 2000자 제한 처리
        let codeContent = codeBlock.join('\n');
        if (codeContent.length > 2000) {
          codeContent = codeContent.slice(0, 1997) + '...';
        }
        blocks.push({
          object: 'block',
          type: 'code',
          code: {
            rich_text: [{ type: 'text', text: { content: codeContent } }],
            language: codeLanguage
          }
        });
        codeBlock = null;
      }
      continue;
    }

    if (codeBlock !== null) {
      codeBlock.push(line);
      continue;
    }

    // 빈 줄
    if (line.trim() === '') {
      continue;
    }

    // 헤딩
    if (line.startsWith('# ')) {
      blocks.push({
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: [{ type: 'text', text: { content: line.slice(2) } }]
        }
      });
    } else if (line.startsWith('## ')) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: line.slice(3) } }]
        }
      });
    } else if (line.startsWith('### ')) {
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: [{ type: 'text', text: { content: line.slice(4) } }]
        }
      });
    }
    // 리스트 아이템
    else if (line.match(/^[-*]\s/)) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: line.slice(2) } }]
        }
      });
    }
    // 번호 리스트
    else if (line.match(/^\d+\.\s/)) {
      const content = line.replace(/^\d+\.\s/, '');
      blocks.push({
        object: 'block',
        type: 'numbered_list_item',
        numbered_list_item: {
          rich_text: [{ type: 'text', text: { content } }]
        }
      });
    }
    // 인용
    else if (line.startsWith('> ')) {
      blocks.push({
        object: 'block',
        type: 'quote',
        quote: {
          rich_text: [{ type: 'text', text: { content: line.slice(2) } }]
        }
      });
    }
    // 구분선
    else if (line.match(/^[-_*]{3,}$/)) {
      blocks.push({
        object: 'block',
        type: 'divider',
        divider: {}
      });
    }
    // 일반 단락
    else {
      // 2000자 제한 처리
      const content = line.length > 2000 ? line.slice(0, 1997) + '...' : line;
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content } }]
        }
      });
    }
  }

  return blocks;
}

/**
 * Notion 페이지 기존 블록 삭제
 * @param {string} pageId - Notion 페이지 ID
 */
async function clearNotionPage(pageId) {
  try {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100
    });

    for (const block of response.results) {
      await notion.blocks.delete({ block_id: block.id });
    }
  } catch (error) {
    console.warn(`   ⚠️ 블록 삭제 중 오류 (무시): ${error.message}`);
  }
}

/**
 * Notion 페이지 업데이트 (실제 API 호출)
 * @param {object} doc - 문서 정보
 * @param {object} docMapping - 매핑 정보
 */
async function updateNotionPage(doc, docMapping) {
  const pageId = docMapping.notionPageId;
  const category = docMapping.category;
  const skillGroup = docMapping.skillGroup;

  // 제목 구성: 카테고리 아이콘 + 문서명
  const categoryIcon = CATEGORY_ICONS[category] || '📄';
  const skillIcon = skillGroup ? SKILL_GROUP_ICONS[skillGroup] : '';
  const titlePrefix = skillGroup ? `${categoryIcon}${skillIcon} ` : `${categoryIcon} `;

  // 버전 정보 추가
  const versionSuffix = doc.version ? ` (v${doc.version})` : '';
  const pageTitle = `${titlePrefix}${doc.name}${versionSuffix}`;

  try {
    // 1. 페이지 제목 업데이트
    await notion.pages.update({
      page_id: pageId,
      properties: {
        title: {
          title: [{ type: 'text', text: { content: pageTitle } }]
        }
      }
    });

    // 2. 기존 블록 삭제
    await clearNotionPage(pageId);

    // 3. 메타데이터 블록 추가
    const metaBlocks = [
      {
        object: 'block',
        type: 'callout',
        callout: {
          rich_text: [{
            type: 'text',
            text: {
              content: `📌 Category: ${category}\n🔖 Version: ${doc.version || 'N/A'}\n📅 Synced: ${new Date().toISOString().split('T')[0]}\n🔐 Mutability: ${docMapping.mutability || 'unknown'}`
            }
          }],
          icon: { emoji: categoryIcon }
        }
      },
      {
        object: 'block',
        type: 'divider',
        divider: {}
      }
    ];

    // 4. 문서 내용을 Notion 블록으로 변환
    const contentBlocks = markdownToNotionBlocks(doc.content);

    // 5. 블록 추가 (100개 제한으로 분할)
    const allBlocks = [...metaBlocks, ...contentBlocks];
    const chunkSize = 100;

    for (let i = 0; i < allBlocks.length; i += chunkSize) {
      const chunk = allBlocks.slice(i, i + chunkSize);
      await notion.blocks.children.append({
        block_id: pageId,
        children: chunk
      });
    }

    return { success: true, pageId, blocksCount: allBlocks.length };
  } catch (error) {
    return { success: false, pageId, error: error.message };
  }
}

/**
 * 동기화 상태 확인
 */
async function checkStatus() {
  const mapping = loadMapping();
  if (!mapping) return;

  console.log('\n📊 문서 동기화 상태');
  console.log('━'.repeat(60));

  const results = [];

  for (const [docName, docMapping] of Object.entries(mapping.mappings)) {
    const localDoc = readLocalDoc(docName, mapping);
    const categoryIcon = CATEGORY_ICONS[docMapping.category] || '📄';

    results.push({
      name: docName,
      category: docMapping.category,
      categoryIcon,
      localVersion: localDoc.version || 'N/A',
      notionPageId: docMapping.notionPageId ? '✅' : '❌',
      syncEnabled: docMapping.syncEnabled ? '✅' : '❌',
      note: docMapping.note || ''
    });
  }

  // 카테고리별 그룹핑
  const grouped = {};
  for (const r of results) {
    if (!grouped[r.category]) {
      grouped[r.category] = [];
    }
    grouped[r.category].push(r);
  }

  // 카테고리별 출력
  for (const [category, docs] of Object.entries(grouped).sort()) {
    const icon = CATEGORY_ICONS[category] || '📄';
    console.log(`\n${icon} ${category}`);
    console.log('─'.repeat(50));

    for (const r of docs) {
      const status = r.notionPageId === '✅' && r.syncEnabled === '✅' ? '✅' : '⚠️';
      console.log(`  ${status} ${r.name} (v${r.localVersion}) ${r.note ? `[${r.note}]` : ''}`);
    }
  }

  console.log('\n');
}

/**
 * Notion으로 동기화 (to_notion) - 실제 API 호출
 */
async function syncToNotion(target, options = {}) {
  const mapping = loadMapping();
  if (!mapping) return { success: false, error: 'mapping not found' };

  if (!process.env.NOTION_TOKEN) {
    console.error('❌ NOTION_TOKEN 환경변수가 설정되지 않았습니다.');
    console.log('   orchestrator/.env 파일에 NOTION_TOKEN을 추가하세요.');
    return { success: false, error: 'NOTION_TOKEN not set' };
  }

  const results = {
    success: true,
    synced: [],
    skipped: [],
    errors: []
  };

  // 대상 문서 결정
  const targetDocs = target === 'all'
    ? Object.keys(mapping.mappings)
    : [target];

  console.log('\n🔄 Notion 동기화 시작 (Constitution 체계 v4.0.0)');
  console.log('━'.repeat(60));

  for (const docName of targetDocs) {
    const docMapping = mapping.mappings[docName];

    if (!docMapping) {
      results.errors.push({ name: docName, error: 'mapping not found' });
      continue;
    }

    if (!docMapping.syncEnabled) {
      results.skipped.push({ name: docName, reason: 'sync disabled' });
      continue;
    }

    const localDoc = readLocalDoc(docName, mapping);

    if (localDoc.error) {
      console.warn(`⚠️  [SKIP] 로컬 파일 누락: ${docName}`);
      results.skipped.push({ name: docName, reason: 'local_file_missing', error: localDoc.error });
      continue;
    }

    if (!docMapping.notionPageId) {
      console.log(`⚠️  ${docName}: Notion 페이지 ID 없음`);
      results.skipped.push({ name: docName, reason: 'no notion page id' });
      continue;
    }

    // 실제 Notion 업데이트
    const categoryIcon = CATEGORY_ICONS[docMapping.category] || '📄';
    console.log(`\n${categoryIcon} ${docName}`);
    console.log(`   버전: ${localDoc.version || 'N/A'}`);
    console.log(`   카테고리: ${docMapping.category}`);

    const result = await updateNotionPage(localDoc, docMapping);

    if (result.success) {
      console.log(`   ✅ 동기화 완료 (${result.blocksCount} 블록)`);
      results.synced.push({
        name: docName,
        version: localDoc.version,
        notionPageId: docMapping.notionPageId,
        blocksCount: result.blocksCount
      });
    } else {
      console.log(`   ❌ 실패: ${result.error}`);
      results.errors.push({
        name: docName,
        error: result.error
      });
    }

    // Rate limiting 방지 (300ms 대기)
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // 요약
  console.log('\n' + '━'.repeat(60));
  console.log('📊 동기화 완료');
  console.log(`   ✅ 성공: ${results.synced.length}개`);
  console.log(`   ⏭️  스킵: ${results.skipped.length}개`);
  console.log(`   ❌ 에러: ${results.errors.length}개`);

  if (results.errors.length > 0) {
    console.log('\n❌ 에러 상세:');
    for (const err of results.errors) {
      console.log(`   - ${err.name}: ${err.error}`);
    }
  }

  return results;
}

/**
 * Notion에서 동기화 (from_notion)
 */
async function syncFromNotion(target, options = {}) {
  const mapping = loadMapping();
  if (!mapping) return { success: false, error: 'mapping not found' };

  if (!process.env.NOTION_TOKEN) {
    console.error('❌ NOTION_TOKEN 환경변수가 설정되지 않았습니다.');
    return { success: false, error: 'NOTION_TOKEN not set' };
  }

  console.log('\n📥 Notion에서 가져오기');
  console.log('━'.repeat(60));

  // 대상 문서 목록
  const targetDocs = target === 'all'
    ? Object.keys(mapping.mappings).filter(d => mapping.mappings[d].notionPageId && mapping.mappings[d].syncEnabled)
    : [target];

  const results = {
    success: true,
    fetched: [],
    errors: []
  };

  for (const docName of targetDocs) {
    const docMapping = mapping.mappings[docName];
    if (!docMapping?.notionPageId) continue;

    const categoryIcon = CATEGORY_ICONS[docMapping.category] || '📄';
    console.log(`\n${categoryIcon} ${docName}`);

    try {
      // Notion 페이지 블록 가져오기
      const response = await notion.blocks.children.list({
        block_id: docMapping.notionPageId,
        page_size: 100
      });

      // 블록을 텍스트로 변환 (간단한 변환)
      let content = '';
      for (const block of response.results) {
        if (block.type === 'paragraph' && block.paragraph?.rich_text) {
          content += block.paragraph.rich_text.map(t => t.plain_text).join('') + '\n';
        } else if (block.type === 'heading_1' && block.heading_1?.rich_text) {
          content += '# ' + block.heading_1.rich_text.map(t => t.plain_text).join('') + '\n';
        } else if (block.type === 'heading_2' && block.heading_2?.rich_text) {
          content += '## ' + block.heading_2.rich_text.map(t => t.plain_text).join('') + '\n';
        } else if (block.type === 'heading_3' && block.heading_3?.rich_text) {
          content += '### ' + block.heading_3.rich_text.map(t => t.plain_text).join('') + '\n';
        } else if (block.type === 'bulleted_list_item' && block.bulleted_list_item?.rich_text) {
          content += '- ' + block.bulleted_list_item.rich_text.map(t => t.plain_text).join('') + '\n';
        } else if (block.type === 'code' && block.code?.rich_text) {
          const lang = block.code.language || '';
          content += '```' + lang + '\n' + block.code.rich_text.map(t => t.plain_text).join('') + '\n```\n';
        }
      }

      // 로컬 파일에 저장
      const localPath = path.join(projectRoot, docMapping.localPath);
      fs.writeFileSync(localPath, content, 'utf-8');

      console.log(`   ✅ 저장됨: ${localPath}`);
      results.fetched.push({ name: docName, path: localPath });

    } catch (error) {
      console.log(`   ❌ 실패: ${error.message}`);
      results.errors.push({ name: docName, error: error.message });
    }

    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n' + '━'.repeat(60));
  console.log('📊 가져오기 완료');
  console.log(`   ✅ 성공: ${results.fetched.length}개`);
  console.log(`   ❌ 에러: ${results.errors.length}개`);

  return results;
}

/**
 * 누락된 Notion 페이지 ID 검색 및 업데이트
 */
async function discoverNotionPages() {
  const mapping = loadMapping();
  if (!mapping) return;

  console.log('\n🔍 Notion 페이지 검색');
  console.log('━'.repeat(60));

  const missing = [];

  for (const [docName, docMapping] of Object.entries(mapping.mappings)) {
    if (!docMapping.notionPageId) {
      missing.push(docName);
    }
  }

  if (missing.length === 0) {
    console.log('✅ 모든 문서가 Notion에 매핑되어 있습니다.');
    return { missing: [] };
  }

  console.log('\n📋 매핑 필요한 문서:');
  for (const docName of missing) {
    console.log(`   - ${docName}`);
  }

  return { missing };
}

/**
 * CLI 진입점
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Doc-Agent Sync Tool v2.1.0 (Constitution 체계 v4.0.0)

사용법:
  node sync.js --status              문서 동기화 상태 확인
  node sync.js --to-notion <문서>    로컬 → Notion 동기화
  node sync.js --to-notion all       전체 문서 동기화
  node sync.js --from-notion <문서>  Notion → 로컬 동기화
  node sync.js --discover            누락된 Notion 페이지 검색

카테고리:
  🔒 00. Constitution - 절대 불변 (CLAUDE.md, SYSTEM_MANIFEST.md, DOMAIN_SCHEMA.md)
  📋 01. Guides       - 통제된 변경 (Rules + Workflows)
  💡 03. Context      - 참조용 (AI_Playbook.md, AI_CONTEXT.md)
  🛠️ 04. Skills       - 버전 관리 (7개 Agent SKILL.md)
  🗄️ 99. Archive      - 비활성

예시:
  node sync.js --status
  node sync.js --to-notion CLAUDE.md
  node sync.js --to-notion all
`);
    return;
  }

  if (args.includes('--status')) {
    await checkStatus();
    return;
  }

  if (args.includes('--discover')) {
    await discoverNotionPages();
    return;
  }

  const toNotionIdx = args.indexOf('--to-notion');
  if (toNotionIdx !== -1) {
    const target = args[toNotionIdx + 1] || 'all';
    await syncToNotion(target);
    return;
  }

  const fromNotionIdx = args.indexOf('--from-notion');
  if (fromNotionIdx !== -1) {
    const target = args[fromNotionIdx + 1] || 'all';
    await syncFromNotion(target);
    return;
  }

  console.log('❌ 알 수 없는 명령어. --help 참조');
}

// 모듈 내보내기
export {
  extractVersion,
  compareVersions,
  loadMapping,
  saveMapping,
  readLocalDoc,
  checkStatus,
  syncToNotion,
  syncFromNotion,
  discoverNotionPages,
  markdownToNotionBlocks,
  updateNotionPage
};

// CLI 직접 실행시에만 main() 호출
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}
