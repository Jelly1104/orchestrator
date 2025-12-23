/**
 * Doc-Agent Sync Module
 *
 * 로컬 문서 ↔ Notion 동기화
 *
 * 사용법:
 *   node sync.js --to-notion CLAUDE.md
 *   node sync.js --from-notion all
 *   node sync.js --status
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');

// 설정 파일 경로
const MAPPING_PATH = path.join(projectRoot, 'orchestrator/config/notion-mapping.json');

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
    notionPageId: docMapping.notionPageId
  };
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

    results.push({
      name: docName,
      localVersion: localDoc.version || 'N/A',
      notionPageId: docMapping.notionPageId ? '✅' : '❌',
      syncEnabled: docMapping.syncEnabled ? '✅' : '❌',
      note: docMapping.note || ''
    });
  }

  // 테이블 출력
  console.log('\n| 문서 | 로컬 버전 | Notion 연결 | 동기화 | 비고 |');
  console.log('|------|----------|------------|--------|------|');

  for (const r of results) {
    console.log(`| ${r.name} | ${r.localVersion} | ${r.notionPageId} | ${r.syncEnabled} | ${r.note} |`);
  }

  console.log('\n');
}

/**
 * Notion으로 동기화 (to_notion)
 *
 * 참고: 실제 Notion API 호출은 MCP 도구를 통해 수행
 * 이 함수는 동기화할 문서 정보를 준비
 */
async function syncToNotion(target, options = {}) {
  const mapping = loadMapping();
  if (!mapping) return { success: false, error: 'mapping not found' };

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

  console.log('\n🔄 Notion 동기화 시작');
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
      // [Safe Sync 원칙 2] 로컬 파일 누락 시 Notion 페이지 보존, 스킵 처리
      console.warn(`⚠️  [SKIP] 로컬 파일 누락: ${docName} (Notion 페이지는 보존됨)`);
      results.skipped.push({ name: docName, reason: 'local_file_missing', error: localDoc.error });
      continue;
    }

    if (!docMapping.notionPageId) {
      console.log(`⚠️  ${docName}: Notion 페이지 ID 없음 - 검색 필요`);
      results.skipped.push({ name: docName, reason: 'no notion page id' });
      continue;
    }

    // 동기화 정보 출력
    console.log(`\n📄 ${docName}`);
    console.log(`   로컬 버전: ${localDoc.version || 'N/A'}`);
    console.log(`   Notion ID: ${docMapping.notionPageId}`);
    console.log(`   경로: ${localDoc.path}`);

    results.synced.push({
      name: docName,
      version: localDoc.version,
      notionPageId: docMapping.notionPageId,
      action: 'ready_to_sync'
    });
  }

  // 요약
  console.log('\n' + '━'.repeat(60));
  console.log('📊 동기화 요약');
  console.log(`   ✅ 준비됨: ${results.synced.length}개`);
  console.log(`   ⏭️  스킵: ${results.skipped.length}개`);
  console.log(`   ❌ 에러: ${results.errors.length}개`);

  if (results.synced.length > 0) {
    console.log('\n💡 실제 동기화 실행:');
    console.log('   Claude Code에서 mcp__notion__notion-update-page 도구 사용');
  }

  return results;
}

/**
 * Notion에서 동기화 (from_notion)
 */
async function syncFromNotion(target, options = {}) {
  const mapping = loadMapping();
  if (!mapping) return { success: false, error: 'mapping not found' };

  console.log('\n📥 Notion에서 가져오기');
  console.log('━'.repeat(60));
  console.log('\n💡 실행 방법:');
  console.log('   Claude Code에서 mcp__notion__notion-fetch 도구로 페이지 내용 가져오기');
  console.log('   그 후 로컬 파일에 저장');

  // 대상 문서 목록 출력
  const targetDocs = target === 'all'
    ? Object.keys(mapping.mappings).filter(d => mapping.mappings[d].notionPageId)
    : [target];

  console.log('\n📋 대상 문서:');
  for (const docName of targetDocs) {
    const docMapping = mapping.mappings[docName];
    if (docMapping?.notionPageId) {
      console.log(`   - ${docName} (${docMapping.notionPageId})`);
    }
  }

  return { success: true, targetDocs };
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
    return;
  }

  console.log('\n📋 매핑 필요한 문서:');
  for (const docName of missing) {
    console.log(`   - ${docName}`);
  }

  console.log('\n💡 검색 방법:');
  console.log('   Claude Code에서 mcp__notion__notion-search 도구 사용');
  console.log('   예: mcp__notion__notion-search query="DOMAIN_SCHEMA.md"');

  return { missing };
}

/**
 * CLI 진입점
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Doc-Agent Sync Tool

사용법:
  node sync.js --status              문서 동기화 상태 확인
  node sync.js --to-notion <문서>    로컬 → Notion 동기화
  node sync.js --from-notion <문서>  Notion → 로컬 동기화
  node sync.js --discover            누락된 Notion 페이지 검색

예시:
  node sync.js --status
  node sync.js --to-notion CLAUDE.md
  node sync.js --to-notion all
  node sync.js --from-notion all
  node sync.js --discover
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
  discoverNotionPages
};

// CLI 직접 실행시에만 main() 호출
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}
