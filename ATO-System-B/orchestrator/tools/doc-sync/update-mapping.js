#!/usr/bin/env node

/**
 * notion-mapping.json 업데이트 헬퍼 스크립트
 *
 * 사용법:
 *   node update-mapping.js \
 *     --analysis-id "페이지ID1" \
 *     --prd-id "페이지ID2" \
 *     --validation-id "페이지ID3" \
 *     --error-id "페이지ID4"
 *
 * 또는:
 *   node update-mapping.js --interactive
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');

const MAPPING_PATH = path.join(projectRoot, 'orchestrator/config/notion-mapping.json');

// Notion 페이지 ID 검증 (32자 16진수)
function validatePageId(pageId) {
  if (!pageId) return false;
  // Notion ID는 UUID 형식: 8-4-4-4-12 또는 32자 연속
  const uuidPattern = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
  return uuidPattern.test(pageId.replace(/-/g, ''));
}

// 대화형 모드
async function interactiveMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise((resolve) => {
    rl.question(prompt, resolve);
  });

  console.log('\n📝 Notion 페이지 ID 입력 모드\n');
  console.log('각 문서의 Notion 페이지 ID를 입력하세요.');
  console.log('(빈 칸으로 두면 해당 문서는 스킵됩니다)\n');

  const ids = {};

  ids.analysis = await question('ANALYSIS_GUIDE.md 페이지 ID: ');
  ids.prd = await question('PRD_GUIDE.md 페이지 ID: ');
  ids.validation = await question('VALIDATION_GUIDE.md 페이지 ID: ');
  ids.error = await question('ERROR_HANDLING_GUIDE.md 페이지 ID: ');

  rl.close();

  return ids;
}

// 매핑 파일 업데이트
function updateMapping(pageIds) {
  if (!fs.existsSync(MAPPING_PATH)) {
    console.error('❌ 매핑 파일을 찾을 수 없습니다:', MAPPING_PATH);
    process.exit(1);
  }

  // [Safe Sync 원칙 3] Safety Snapshot - 변경 전 백업 생성
  const backupPath = MAPPING_PATH.replace('.json', '.backup.json');
  fs.copyFileSync(MAPPING_PATH, backupPath);
  console.log(`📦 백업 생성됨: ${backupPath}`);

  const mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf-8'));
  let updated = 0;

  const updates = {
    'ANALYSIS_GUIDE.md': pageIds.analysis,
    'PRD_GUIDE.md': pageIds.prd,
    'VALIDATION_GUIDE.md': pageIds.validation,
    'ERROR_HANDLING_GUIDE.md': pageIds.error
  };

  console.log('\n🔄 매핑 파일 업데이트 중...\n');

  for (const [docName, pageId] of Object.entries(updates)) {
    if (!pageId) {
      console.log(`⏭️  ${docName}: 스킵 (페이지 ID 없음)`);
      continue;
    }

    if (!validatePageId(pageId)) {
      console.log(`⚠️  ${docName}: 잘못된 페이지 ID 형식 - "${pageId}"`);
      continue;
    }

    if (!mapping.mappings[docName]) {
      console.log(`⚠️  ${docName}: 매핑 정의 없음`);
      continue;
    }

    // 업데이트
    mapping.mappings[docName].notionPageId = pageId;
    mapping.mappings[docName].syncEnabled = true;
    mapping.mappings[docName].note = `${new Date().toISOString().split('T')[0]} 동기화 완료`;

    console.log(`✅ ${docName}: 페이지 ID 설정 - ${pageId}`);
    updated++;
  }

  // 최종 업데이트 시각 기록
  mapping.lastUpdated = new Date().toISOString().split('T')[0];

  // 파일 저장
  fs.writeFileSync(MAPPING_PATH, JSON.stringify(mapping, null, 2) + '\n');

  console.log('\n' + '━'.repeat(60));
  console.log(`✅ 매핑 파일 업데이트 완료: ${updated}개 문서`);
  console.log(`📁 저장 위치: ${MAPPING_PATH}`);
  console.log('━'.repeat(60));

  // 상태 확인 안내
  console.log('\n💡 상태 확인:');
  console.log('   node orchestrator/tools/doc-agent/sync.js --status\n');
}

// CLI 파라미터 파싱
function parseArgs() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.length === 0) {
    console.log(`
Notion Mapping 업데이트 도구

사용법:
  node update-mapping.js --interactive

  node update-mapping.js \\
    --analysis-id "2cc87960-3bef-81de-9b98-e3daf0fce7d1" \\
    --prd-id "2cc87960-3bef-8103-9376-d656b34564d6" \\
    --validation-id "2cc87960-3bef-817d-a183-f78583310bb9" \\
    --error-id "2cb87960-3bef-801f-adad-cf86815a7ce7"

옵션:
  --analysis-id <ID>     ANALYSIS_GUIDE.md의 Notion 페이지 ID
  --prd-id <ID>          PRD_GUIDE.md의 Notion 페이지 ID
  --validation-id <ID>   VALIDATION_GUIDE.md의 Notion 페이지 ID
  --error-id <ID>        ERROR_HANDLING_GUIDE.md의 Notion 페이지 ID
  --interactive          대화형 모드로 실행
  --help                 도움말 표시

페이지 ID 형식:
  - Notion URL에서 추출: https://notion.so/workspace/Title-[페이지ID]
  - 32자 16진수 (하이픈 포함/불포함 모두 가능)
  - 예: 2cc87960-3bef-81de-9b98-e3daf0fce7d1
`);
    process.exit(0);
  }

  if (args.includes('--interactive')) {
    return null; // 대화형 모드 시그널
  }

  const pageIds = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--analysis-id':
        pageIds.analysis = args[i + 1];
        i++;
        break;
      case '--prd-id':
        pageIds.prd = args[i + 1];
        i++;
        break;
      case '--validation-id':
        pageIds.validation = args[i + 1];
        i++;
        break;
      case '--error-id':
        pageIds.error = args[i + 1];
        i++;
        break;
    }
  }

  return pageIds;
}

// 메인
async function main() {
  console.log('\n📋 Notion Mapping 업데이트 도구\n');

  let pageIds = parseArgs();

  if (pageIds === null) {
    // 대화형 모드
    pageIds = await interactiveMode();
  }

  if (!pageIds || Object.keys(pageIds).length === 0) {
    console.log('❌ 페이지 ID가 제공되지 않았습니다.');
    console.log('💡 --help 옵션으로 사용법을 확인하세요.\n');
    process.exit(1);
  }

  updateMapping(pageIds);
}

main().catch((err) => {
  console.error('❌ 오류 발생:', err.message);
  process.exit(1);
});
