/**
 * E2E 실제 API 호출 테스트
 *
 * 실제 Anthropic API를 호출하여 병렬 파이프라인 검증
 *
 * 실행:
 *   node orchestrator/tests/test-e2e-api.js
 *
 * 환경 변수:
 *   ANTHROPIC_API_KEY - Anthropic API 키
 */

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

// .env 로드
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// ═══════════════════════════════════════════════════════════════
// 테스트 데이터
// ═══════════════════════════════════════════════════════════════

const TEST_PRD = `
# PRD: 회원 목록 조회 API

## 개요
메디게이트 활성 회원 목록을 조회하는 API를 구현합니다.

## 산출물 체크리스트
- [ ] GET /api/members 엔드포인트
- [ ] 페이지네이션 지원 (page, limit)
- [ ] 회원 유형 필터링 (memberType)
- [ ] React 목록 컴포넌트
- [ ] 테스트 코드

## 기술 요구사항
- Express.js 라우터
- TypeScript
- React 18+
`;

const TEST_TASK_DESCRIPTION = '회원 목록 조회 API 및 UI 구현';

// ═══════════════════════════════════════════════════════════════
// 테스트 유틸리티
// ═══════════════════════════════════════════════════════════════

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatTokens(count) {
  if (!count) return 'N/A';
  return count.toLocaleString();
}

// ═══════════════════════════════════════════════════════════════
// 테스트 케이스
// ═══════════════════════════════════════════════════════════════

async function testSequentialPipeline() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🧪 Test 1: 순차 파이프라인 (Design → Code)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const { Orchestrator } = await import('../orchestrator.js');

  const orchestrator = new Orchestrator({
    projectRoot,
    saveFiles: false,  // dry-run
    maxRetries: 1
  });

  const startTime = Date.now();

  try {
    const result = await orchestrator.run(TEST_TASK_DESCRIPTION, {
      taskId: `test-seq-${Date.now()}`,
      prdContent: TEST_PRD,
      mode: 'design'  // Design만 실행 (토큰 절약)
    });

    const duration = Date.now() - startTime;

    console.log('결과:');
    console.log(`  - 상태: ${result.success ? '✅ 성공' : '❌ 실패'}`);
    console.log(`  - 소요 시간: ${formatDuration(duration)}`);
    console.log(`  - 총 토큰: ${formatTokens(result.metrics?.tokens?.grandTotal)}`);
    console.log(`  - 생성 파일: ${Object.keys(result.files || {}).length}개`);

    if (result.files) {
      console.log('\n생성된 파일:');
      Object.keys(result.files).forEach(f => {
        console.log(`  - ${f}`);
      });
    }

    return {
      success: result.success,
      duration,
      tokens: result.metrics?.tokens?.grandTotal || 0,
      files: Object.keys(result.files || {}).length
    };
  } catch (error) {
    console.error(`❌ 에러: ${error.message}`);
    return { success: false, duration: Date.now() - startTime, error: error.message };
  }
}

async function testParallelPipeline() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🧪 Test 2: 병렬 파이프라인 (Design || Code)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const { Orchestrator } = await import('../orchestrator.js');

  const orchestrator = new Orchestrator({
    projectRoot,
    saveFiles: false,
    maxRetries: 1
  });

  const startTime = Date.now();

  try {
    const result = await orchestrator.runParallelPipeline(
      `test-par-${Date.now()}`,
      TEST_TASK_DESCRIPTION,
      TEST_PRD,
      { mode: 'design' }
    );

    const duration = Date.now() - startTime;

    console.log('결과:');
    console.log(`  - 상태: ${result.success ? '✅ 성공' : '❌ 실패'}`);
    console.log(`  - 소요 시간: ${formatDuration(duration)}`);
    console.log(`  - 총 토큰: ${formatTokens(result.metrics?.tokens?.grandTotal)}`);
    console.log(`  - 생성 파일: ${Object.keys(result.files || {}).length}개`);

    // 병렬 실행 타이밍 확인
    if (result.metrics?.phases) {
      console.log('\n단계별 타이밍:');
      Object.entries(result.metrics.phases).forEach(([phase, data]) => {
        console.log(`  - ${phase}: ${data.duration || 'N/A'}`);
      });
    }

    return {
      success: result.success,
      duration,
      tokens: result.metrics?.tokens?.grandTotal || 0,
      files: Object.keys(result.files || {}).length
    };
  } catch (error) {
    console.error(`❌ 에러: ${error.message}`);
    return { success: false, duration: Date.now() - startTime, error: error.message };
  }
}

async function testCodeAgentStandalone() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🧪 Test 3: CodeAgent 단독 실행 (실제 API 호출)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const { CodeAgent } = await import('../agents/code-agent.js');

  const codeAgent = new CodeAgent({
    projectRoot,
    provider: 'anthropic'
  });

  // 간단한 설계 문서
  const simpleDesign = {
    sdd: `
# SDD: Hello API

## API 명세
### GET /api/hello
- 응답: { "message": "Hello, World!" }

## 데이터 모델
없음 (단순 응답)
    `,
    wireframe: '',
    ia: '',
    handoff: `
# HANDOFF.md

## Mode
Code

## Required Outputs
- Express 라우터 파일
- 간단한 테스트

## Completion Criteria
- GET /api/hello 구현
    `
  };

  const startTime = Date.now();

  try {
    const result = await codeAgent.implement(simpleDesign, {
      taskId: `test-code-${Date.now()}`
    });

    const duration = Date.now() - startTime;

    console.log('결과:');
    console.log(`  - 상태: ${result.success ? '✅ 성공' : '❌ 실패'}`);
    console.log(`  - 소요 시간: ${formatDuration(duration)}`);
    console.log(`  - 토큰: ${formatTokens(result.tokens?.total)}`);
    console.log(`  - 생성 파일: ${Object.keys(result.files || {}).length}개`);

    if (result.files) {
      console.log('\n생성된 파일:');
      Object.keys(result.files).forEach(f => {
        const preview = result.files[f].substring(0, 100).replace(/\n/g, ' ');
        console.log(`  - ${f}`);
        console.log(`    ${preview}...`);
      });
    }

    return {
      success: result.success,
      duration,
      tokens: result.tokens?.total || 0,
      files: Object.keys(result.files || {}).length
    };
  } catch (error) {
    console.error(`❌ 에러: ${error.message}`);
    return { success: false, duration: Date.now() - startTime, error: error.message };
  }
}

async function testAnalysisAgent() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🧪 Test 4: Analysis Agent (SQL 분석)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const { Orchestrator } = await import('../orchestrator.js');

  const orchestrator = new Orchestrator({
    projectRoot,
    saveFiles: false,
    maxRetries: 1
  });

  const analysisTask = '활성 회원(U_ALIVE=Y) 중 의사(U_KIND=DOC001) 수 집계';

  const startTime = Date.now();

  try {
    const result = await orchestrator.run(analysisTask, {
      taskId: `test-analysis-${Date.now()}`,
      pipeline: 'analysis'
    });

    const duration = Date.now() - startTime;

    console.log('결과:');
    console.log(`  - 상태: ${result.success ? '✅ 성공' : '❌ 실패'}`);
    console.log(`  - 소요 시간: ${formatDuration(duration)}`);
    console.log(`  - 토큰: ${formatTokens(result.metrics?.tokens?.grandTotal)}`);

    if (result.analysisResult?.sql) {
      console.log('\n생성된 SQL:');
      console.log('  ' + result.analysisResult.sql.substring(0, 200).replace(/\n/g, '\n  '));
    }

    return {
      success: result.success,
      duration,
      tokens: result.metrics?.tokens?.grandTotal || 0
    };
  } catch (error) {
    console.error(`❌ 에러: ${error.message}`);
    return { success: false, duration: Date.now() - startTime, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// 메인 실행
// ═══════════════════════════════════════════════════════════════

async function runAllTests() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║        E2E 실제 API 호출 테스트 스위트                        ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');

  // API 키 확인
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('\n❌ ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다.');
    console.error('   export ANTHROPIC_API_KEY="your-api-key"');
    process.exit(1);
  }

  console.log('\n⚠️  이 테스트는 실제 API를 호출합니다. 비용이 발생할 수 있습니다.');
  console.log('   예상 비용: ~$0.50-$2.00 (전체 테스트 실행 시)\n');

  const results = {};

  // 빠른 테스트만 기본 실행
  const quickMode = process.argv.includes('--quick');
  const fullMode = process.argv.includes('--full');

  if (quickMode) {
    console.log('🚀 Quick Mode: CodeAgent 단독 테스트만 실행\n');
    results.codeAgent = await testCodeAgentStandalone();
  } else if (fullMode) {
    console.log('🔬 Full Mode: 전체 테스트 실행\n');
    results.sequential = await testSequentialPipeline();
    results.parallel = await testParallelPipeline();
    results.codeAgent = await testCodeAgentStandalone();
    results.analysis = await testAnalysisAgent();
  } else {
    console.log('📋 Default Mode: CodeAgent + Analysis 테스트\n');
    results.codeAgent = await testCodeAgentStandalone();
    results.analysis = await testAnalysisAgent();
  }

  // 결과 요약
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                    테스트 결과 요약                           ║');
  console.log('╠═══════════════════════════════════════════════════════════════╣');

  const testLabels = {
    sequential: '순차 파이프라인',
    parallel: '병렬 파이프라인',
    codeAgent: 'CodeAgent 단독',
    analysis: 'Analysis Agent'
  };

  let totalTokens = 0;
  let totalDuration = 0;
  let passCount = 0;

  for (const [key, result] of Object.entries(results)) {
    const icon = result.success ? '✅' : '❌';
    const label = testLabels[key].padEnd(16);
    const duration = formatDuration(result.duration).padStart(8);
    const tokens = formatTokens(result.tokens).padStart(10);

    console.log(`║  ${icon} ${label} │ ${duration} │ ${tokens} tokens ║`);

    totalTokens += result.tokens || 0;
    totalDuration += result.duration || 0;
    if (result.success) passCount++;
  }

  console.log('╠═══════════════════════════════════════════════════════════════╣');
  console.log(`║  총 ${passCount}/${Object.keys(results).length} 테스트 통과                                     ║`);
  console.log(`║  총 소요 시간: ${formatDuration(totalDuration).padStart(10)}                              ║`);
  console.log(`║  총 토큰 사용: ${formatTokens(totalTokens).padStart(10)}                              ║`);
  console.log('╚═══════════════════════════════════════════════════════════════╝');

  // 비용 추정 (Sonnet 기준)
  const estimatedCost = (totalTokens / 1000000) * 3;  // $3/1M input (대략)
  console.log(`\n💰 추정 비용: ~$${estimatedCost.toFixed(4)}`);

  // 병렬 vs 순차 비교 (둘 다 실행한 경우)
  if (results.sequential && results.parallel) {
    const speedup = results.sequential.duration / results.parallel.duration;
    console.log(`\n⚡ 병렬 실행 속도 향상: ${speedup.toFixed(2)}x`);
  }

  const allPassed = Object.values(results).every(r => r.success);
  process.exit(allPassed ? 0 : 1);
}

// 도움말
if (process.argv.includes('--help')) {
  console.log(`
E2E API 테스트

사용법:
  node test-e2e-api.js [옵션]

옵션:
  --quick    CodeAgent 단독 테스트만 (최소 비용)
  --full     전체 테스트 실행 (병렬 포함)
  --help     이 도움말 표시

기본 모드: CodeAgent + Analysis 테스트
`);
  process.exit(0);
}

runAllTests().catch(error => {
  console.error('❌ 테스트 실행 실패:', error);
  process.exit(1);
});
