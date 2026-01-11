/**
 * DocSync 경로 불일치 테스트
 * - taskId가 있는 경로(docs/cases/{caseId}/{taskId})와 없는 경로(docs/cases/{caseId}) 둘 다 처리되는지 확인
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { DocSyncTool } from '../tools/doc-sync/index.js';

// 쓰기 가능 영역(.claude/project) 사용
const projectRoot = path.join(process.cwd(), '.claude', 'project');

// 테스트용 가짜 파일 구조 생성
const tmpRoot = path.join(projectRoot, 'docs', 'cases', 'case-test');
const taskDir = path.join(tmpRoot, 'task-1', 'design');
const caseDir = path.join(tmpRoot, 'design');

fs.mkdirSync(taskDir, { recursive: true });
fs.writeFileSync(path.join(taskDir, 'IA.md'), '# IA (task path)', 'utf-8');

fs.mkdirSync(caseDir, { recursive: true });
fs.writeFileSync(path.join(caseDir, 'IA.md'), '# IA (case path)', 'utf-8');

// 환경 변수 백업 및 mock 모드 강제
const originalEnv = {
  NOTION_API_KEY: process.env.NOTION_API_KEY,
  NOTION_TOKEN: process.env.NOTION_TOKEN,
  NOTION_PARENT_PAGE_ID: process.env.NOTION_PARENT_PAGE_ID,
  NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID
};
process.env.NOTION_API_KEY = '';
process.env.NOTION_TOKEN = '';
process.env.NOTION_PARENT_PAGE_ID = '';
process.env.NOTION_DATABASE_ID = '';

const docSync = new DocSyncTool({ projectRoot, notionApiKey: null }); // mock mode

async function main() {
  // 1) taskId가 주어지면 task 경로 우선 사용
  const taskResult = await docSync.syncCase('case-test', { taskId: 'task-1' });
  assert.strictEqual(taskResult.summary.total, 5, '동기화 대상 총합 확인');
  const iaUploadTask = taskResult.uploads.find(u => u.file === 'design/IA.md');
  assert(iaUploadTask, 'task 경로 IA.md 업로드되어야 함');

  // 2) taskId가 없으면 case 경로 사용
  const caseResult = await docSync.syncCase('case-test');
  const iaUploadCase = caseResult.uploads.find(u => u.file === 'design/IA.md');
  assert(iaUploadCase, 'case 경로 IA.md 업로드되어야 함');

  console.log('✅ DocSync 경로 불일치 테스트 완료');

  // 환경 복원
  process.env.NOTION_API_KEY = originalEnv.NOTION_API_KEY;
  process.env.NOTION_TOKEN = originalEnv.NOTION_TOKEN;
  process.env.NOTION_PARENT_PAGE_ID = originalEnv.NOTION_PARENT_PAGE_ID;
  process.env.NOTION_DATABASE_ID = originalEnv.NOTION_DATABASE_ID;
}

main().catch(err => {
  console.error('❌ DocSync 경로 테스트 실패:', err);
  process.exit(1);
});
