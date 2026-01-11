/**
 * Design Pipeline E2E 테스트
 * - PRD: 채용추천 Agent (QUALITATIVE / design)
 * - 목표: PRD → IA → Wireframe → SDD → HANDOFF 전체 흐름 검증
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env 로드
dotenv.config({ path: path.join(__dirname, 'orchestrator', '.env') });

import { Orchestrator } from './orchestrator/orchestrator.js';
import { PRDAnalyzer } from './orchestrator/agents/prd-analyzer.js';

// 채용추천 Agent PRD v2 로드
const prdPath = path.join(__dirname, 'test-output', 'prd', 'recruit-agent-prd-v2.md');
const prdContent = fs.readFileSync(prdPath, 'utf-8');

console.log('='.repeat(60));
console.log('Design Pipeline E2E 테스트');
console.log('PRD: 채용추천 Agent (QUALITATIVE / design)');
console.log('='.repeat(60));

// Step 1: PRD 분류 테스트
console.log('\n[Step 1] PRD 분류 테스트...');
const prdAnalyzer = new PRDAnalyzer();
const classification = prdAnalyzer.classifyPRDv2(prdContent);
console.log('  파이프라인:', classification.pipeline);

if (classification.pipeline !== 'design') {
  console.error('❌ PRD 분류 오류! 예상: design');
  process.exit(1);
}
console.log('✅ PRD 분류 정상 (design)');

// Step 2: Orchestrator 초기화
console.log('\n[Step 2] Orchestrator 초기화...');

// projectRoot는 .claude/rules/, .claude/workflows/ 문서가 있는 실제 프로젝트 루트를 사용
const projectRoot = __dirname;
const outputDir = path.join(__dirname, 'test-output', 'design');

// 출력 디렉토리 생성
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Constitution 디렉토리 존재 확인 (v4.0.0)
const rulesDir = path.join(projectRoot, '.claude', 'rules');
if (fs.existsSync(rulesDir)) {
  console.log('  .claude/rules 디렉토리 확인됨');
  const rulesFiles = fs.readdirSync(rulesDir);
  console.log(`  문서 수: ${rulesFiles.length}개`);
} else {
  console.warn('  ⚠️ .claude/rules 디렉토리 없음 - 컨텍스트 문서 누락 가능');
}

const orchestrator = new Orchestrator({
  projectRoot: projectRoot,  // 실제 프로젝트 루트 (문서가 있는 곳)
  provider: 'anthropic',
  maxRetries: 2,
  autoApprove: true,
  saveFiles: true,
  fallbackOrder: ['anthropic', 'openai'],
  useFallback: true
});

console.log('✅ Orchestrator 초기화 완료');

// Step 3: Design Pipeline 실행
console.log('\n[Step 3] Design Pipeline 실행...');
console.log('  (PRD → IA → Wireframe → SDD → HANDOFF)');
console.log('');

const taskId = 'recruit-agent-' + Date.now();
const taskDescription = '채용추천 Agent 설계: 의사 회원의 전문과목, 근무 선호에 맞는 채용공고 개인화 추천 시스템';

try {
  const startTime = Date.now();

  // Orchestrator.run(taskDescription, options) 시그니처에 맞게 호출
  const result = await orchestrator.run(
    taskDescription,
    {
      taskId: taskId,
      prdContent: prdContent,  // PRD 내용은 options.prdContent로 전달
      mode: 'design'
    }
  );

  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('테스트 결과');
  console.log('='.repeat(60));
  console.log('  소요 시간:', elapsedTime, 's');
  console.log('  성공 여부:', result.success ? '✅ 성공' : '❌ 실패');

  if (result.metrics) {
    console.log('  총 토큰:', result.metrics.totalTokens || 'N/A');
  }

  // 생성된 파일 확인
  console.log('\n[생성된 산출물]');
  // projectRoot 기준으로 docs 디렉토리 확인
  const docsDir = path.join(projectRoot, 'orchestrator', 'docs', taskId);
  if (fs.existsSync(docsDir)) {
    const files = fs.readdirSync(docsDir);
    files.forEach(file => {
      const filePath = path.join(docsDir, file);
      const stats = fs.statSync(filePath);
      console.log(`  - ${file} (${stats.size} bytes)`);
    });

    // 산출물 검증
    const expectedFiles = ['IA.md', 'Wireframe.md', 'SDD.md', 'HANDOFF.md'];
    const missingFiles = expectedFiles.filter(f => !files.includes(f));

    if (missingFiles.length === 0) {
      console.log('\n✅ 모든 설계 산출물 생성 완료!');
    } else {
      console.log('\n⚠️ 누락된 산출물:', missingFiles.join(', '));
    }
  } else {
    console.log('  (산출물 디렉토리 없음)');
  }

  // 결과 요약 저장
  const summaryPath = path.join(outputDir, 'test-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    taskId,
    pipeline: classification.pipeline,
    success: result.success,
    elapsedTime: parseFloat(elapsedTime),
    timestamp: new Date().toISOString()
  }, null, 2));

  console.log('\n결과 요약 저장:', summaryPath);

} catch (error) {
  console.error('\n❌ 테스트 실패:', error.message);
  console.error(error.stack);
  process.exit(1);
}

console.log('\n테스트 완료.');
