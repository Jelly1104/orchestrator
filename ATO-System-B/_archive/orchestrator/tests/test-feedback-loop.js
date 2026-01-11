/**
 * Feedback Loop 테스트 스크립트
 * 검증 실패 → 재작업 → 검증 통과 시나리오 시뮬레이션
 */

import { FeedbackLoopController } from './agents/feedback-loop.js';
import { PRDAnalyzer } from './agents/prd-analyzer.js';
import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(process.cwd(), '..');

// 단계별 산출물 시뮬레이션 (재작업 시 점진적으로 추가)
const SIMULATION_OUTPUTS = {
  // 1차: 일부만 생성 (3/6)
  attempt1: [
    { name: '활성회원-세그먼트-정의.sql', type: 'SQL', content: 'SELECT * FROM USERS LIMIT 100;' },
    { name: '프로필-행동-조인-분석.sql', type: 'SQL', content: 'SELECT * FROM USER_DETAIL;' },
    { name: '활성회원-프로파일-요약-리포트.md', type: 'Markdown', content: '# 리포트\n...' }
  ],
  // 2차: 재작업으로 2개 추가 (5/6)
  retry1: [
    { name: '전문과목별-분포-비교.sql', type: 'SQL', content: 'SELECT U_MAJOR_CODE_1, COUNT(*) FROM USER_DETAIL GROUP BY 1;' },
    { name: '근무형태별-분포-비교.sql', type: 'SQL', content: 'SELECT U_WORK_TYPE_1, COUNT(*) FROM USER_DETAIL GROUP BY 1;' }
  ],
  // 3차: 마지막 1개 추가 (6/6)
  retry2: [
    { name: 'G1-UseCase-Trigger-후보-제안.md', type: 'Markdown', content: '# Use Case 제안\n...' }
  ]
};

let currentAttempt = 0;

// 재작업 콜백 시뮬레이션
async function mockRetryCallback(missing, feedback, existingOutputs) {
  currentAttempt++;

  console.log(`\n   [Mock] 재작업 시뮬레이션 (시도 ${currentAttempt})`);
  console.log(`   [Mock] 누락 항목 ${missing.length}개 처리 중...`);

  // 시뮬레이션: 각 시도마다 일부 산출물 추가
  await new Promise(resolve => setTimeout(resolve, 500)); // 0.5초 대기 (LLM 호출 시뮬레이션)

  if (currentAttempt === 1) {
    console.log(`   [Mock] 2개 산출물 추가 생성`);
    return SIMULATION_OUTPUTS.retry1;
  } else if (currentAttempt === 2) {
    console.log(`   [Mock] 1개 산출물 추가 생성`);
    return SIMULATION_OUTPUTS.retry2;
  }

  return [];
}

async function runTest() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔄 Feedback Loop 테스트');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // PRD 분석
  const prdPath = path.join(projectRoot, '.claude/project/PRD.md');
  const prdContent = fs.readFileSync(prdPath, 'utf-8');

  const prdAnalyzer = new PRDAnalyzer(projectRoot);
  const prdAnalysis = await prdAnalyzer.analyze(prdContent);

  console.log('📄 PRD 체크리스트:');
  prdAnalysis.deliverables.forEach((d, i) => {
    console.log(`  ${i + 1}. ${d.item}`);
  });

  // 피드백 루프 실행
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const controller = new FeedbackLoopController(projectRoot, { maxRetries: 3 });

  const result = await controller.runWithFeedback(
    SIMULATION_OUTPUTS.attempt1,
    prdAnalysis,
    mockRetryCallback
  );

  // 결과 출력
  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('📊 테스트 결과');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log(`최종 상태: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`총 시도 횟수: ${result.retryCount + 1}회`);
  console.log(`최종 산출물 수: ${result.outputs.length}개`);
  console.log(`PRD 매칭: ${result.validationResult.prdMatch?.matched}/${result.validationResult.prdMatch?.total}`);

  // 히스토리 출력
  console.log('\n' + controller.formatHistory());

  // 최종 산출물 목록
  console.log('📦 최종 산출물:');
  result.outputs.forEach((o, i) => {
    console.log(`  ${i + 1}. ${o.name} (${o.type})`);
  });

  console.log('\n✅ Feedback Loop 테스트 완료');
}

runTest().catch(console.error);
