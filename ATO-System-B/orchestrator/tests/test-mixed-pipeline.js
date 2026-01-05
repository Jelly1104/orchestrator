/**
 * MIXED Pipeline E2E 테스트
 * - PRD: Case #5 휴면 전환 위험 예측 PoC (MIXED / analysis → design)
 * - 목표: PRD → Analysis → Design 체이닝 검증
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

// Case #5 PRD 로드
const prdPath = path.join(__dirname, 'test-output', 'prd', 'case5-dormancy-prediction-prd.md');
const prdContent = fs.readFileSync(prdPath, 'utf-8');

console.log('='.repeat(60));
console.log('MIXED Pipeline E2E 테스트');
console.log('PRD: Case #5 휴면 전환 위험 예측 (MIXED / analysis → design)');
console.log('='.repeat(60));

// Step 1: PRD 분류 테스트
console.log('\n[Step 1] PRD 분류 테스트...');
const prdAnalyzer = new PRDAnalyzer();
const classification = prdAnalyzer.classifyPRDv2(prdContent);
console.log('  파이프라인:', classification.pipeline);
console.log('  GapCheck:', JSON.stringify(classification.gapCheck || {}));

if (classification.pipeline !== 'analyzed_design') {
  console.warn('⚠️ PRD 분류 결과:', classification.pipeline);
  console.warn('  (analyzed_design 강제 적용)');
}
console.log('✅ PRD 분류 완료');

// Step 2: Orchestrator 초기화
console.log('\n[Step 2] Orchestrator 초기화...');

const projectRoot = __dirname;
const outputDir = path.join(__dirname, 'test-output', 'mixed');

// 출력 디렉토리 생성
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// DB 설정 (환경변수에서 로드)
const dbConfig = {
  host: process.env.DB_HOST || '222.122.26.242',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'medigate',
  password: process.env.DB_PASSWORD || 'apelWkd',
  database: process.env.DB_NAME || 'medigate'
};

console.log(`  DB Host: ${dbConfig.host}:${dbConfig.port}`);
console.log(`  DB Name: ${dbConfig.database}`);

const orchestrator = new Orchestrator({
  projectRoot: projectRoot,
  provider: 'anthropic',
  maxRetries: 2,
  autoApprove: true,
  saveFiles: true,
  fallbackOrder: ['anthropic', 'openai'],
  useFallback: true,
  dbConfig: dbConfig  // DB 설정 전달
});

console.log('✅ Orchestrator 초기화 완료');

// Step 3: MIXED Pipeline 실행
console.log('\n[Step 3] MIXED Pipeline 실행...');
console.log('  Phase A: Analysis (SQL 실행 → 분석 결과)');
console.log('  Phase B: Design (분석 결과 기반 설계 문서)');
console.log('');

const taskId = 'case5-dormancy-' + Date.now();
const taskDescription = 'Case #5: 휴면 전환 위험 예측 - 의사 회원 이탈 패턴 분석 및 리텐션 대시보드 설계';

try {
  const startTime = Date.now();

  // MIXED 파이프라인 강제 실행
  const result = await orchestrator.run(
    taskDescription,
    {
      taskId: taskId,
      prdContent: prdContent,
      mode: 'mixed',  // MIXED 모드 강제 지정
      dbConfig: dbConfig
    }
  );

  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('테스트 결과');
  console.log('='.repeat(60));
  console.log('  소요 시간:', elapsedTime, 's');
  console.log('  성공 여부:', result.success ? '✅ 성공' : '❌ 실패');
  console.log('  파이프라인:', result.pipeline);

  // Phase A (Analysis) 결과
  console.log('\n[Phase A: Analysis 결과]');
  if (result.analysis) {
    console.log('  출력 파일:', result.analysis.outputs?.length || 0, '개');
    console.log('  실행된 쿼리:', result.analysis.queries?.length || 0, '개');
    if (result.analysis.summary) {
      console.log('  요약:', result.analysis.summary.substring(0, 100) + '...');
    }
  } else {
    console.log('  (분석 결과 없음)');
  }

  // Phase B (Design) 결과
  console.log('\n[Phase B: Design 결과]');
  if (result.planning) {
    console.log('  IA.md:', result.planning.ia ? '✅' : '❌');
    console.log('  Wireframe.md:', result.planning.wireframe ? '✅' : '❌');
    console.log('  SDD.md:', result.planning.sdd ? '✅' : '❌');
    console.log('  HANDOFF.md:', result.planning.handoff ? '✅' : '❌');
  } else {
    console.log('  (설계 결과 없음)');
  }

  // 메트릭스
  if (result.metrics) {
    console.log('\n[토큰 사용량]');
    console.log('  총 토큰:', result.metrics.tokens?.grandTotal || 'N/A');
  }

  // 생성된 파일 확인
  console.log('\n[생성된 산출물]');
  const docsDir = path.join(projectRoot, 'orchestrator', 'docs', taskId);
  if (fs.existsSync(docsDir)) {
    const files = fs.readdirSync(docsDir);
    files.forEach(file => {
      const filePath = path.join(docsDir, file);
      const stats = fs.statSync(filePath);
      console.log(`  - ${file} (${stats.size} bytes)`);
    });

    // 산출물 검증
    const expectedDesignFiles = ['IA.md', 'Wireframe.md', 'SDD.md', 'HANDOFF.md'];
    const missingFiles = expectedDesignFiles.filter(f => !files.includes(f));

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
    pipeline: 'analyzed_design',
    phases: {
      analysis: {
        success: result.analysis?.queries?.length > 0,
        queriesExecuted: result.analysis?.queries?.length || 0,
        outputsGenerated: result.analysis?.outputs?.length || 0
      },
      design: {
        success: !!result.planning?.ia,
        documentsGenerated: [
          result.planning?.ia ? 'IA.md' : null,
          result.planning?.wireframe ? 'Wireframe.md' : null,
          result.planning?.sdd ? 'SDD.md' : null,
          result.planning?.handoff ? 'HANDOFF.md' : null
        ].filter(Boolean)
      }
    },
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
