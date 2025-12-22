/**
 * 최종 수정사항 검증 테스트
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');

console.log('=== 최종 수정사항 검증 테스트 ===\n');

let passCount = 0;
let failCount = 0;

function test(name, condition) {
  if (condition) {
    console.log(`✅ ${name}`);
    passCount++;
  } else {
    console.log(`❌ ${name}`);
    failCount++;
  }
}

// 1. orchestrator.js 검증
console.log('\n--- orchestrator.js ---');
const orchestratorContent = fs.readFileSync(
  path.join(PROJECT_ROOT, 'orchestrator/orchestrator.js'),
  'utf-8'
);

test(
  'Promise.allSettled 사용',
  orchestratorContent.includes('Promise.allSettled')
);

test(
  '부분 실패 처리 로직 (fulfilled 체크)',
  orchestratorContent.includes("status === 'fulfilled'")
);

test(
  '부분 실패 처리 로직 (rejected 체크)',
  orchestratorContent.includes("status === 'rejected'")
);

test(
  '둘 다 실패 시 조기 종료',
  orchestratorContent.includes('Design Agent와 Code Agent 모두 실패')
);

test(
  'Review 예외 처리 (try-catch)',
  orchestratorContent.includes('Review 호출 실패')
);

// 2. analysis-agent.js 검증
console.log('\n--- analysis-agent.js ---');
const analysisAgentContent = fs.readFileSync(
  path.join(PROJECT_ROOT, 'orchestrator/agents/analysis-agent.js'),
  'utf-8'
);

test(
  '_sendMessage 타임아웃 파라미터',
  analysisAgentContent.includes('timeout = 60000')
);

test(
  'Promise.race 타임아웃 구현',
  analysisAgentContent.includes('Promise.race')
);

test(
  '타임아웃 에러 메시지',
  analysisAgentContent.includes('API 호출 타임아웃')
);

// 3. rate-limiter.js 검증
console.log('\n--- rate-limiter.js ---');
const rateLimiterContent = fs.readFileSync(
  path.join(PROJECT_ROOT, 'orchestrator/security/rate-limiter.js'),
  'utf-8'
);

test(
  'cleanupIntervalId 필드',
  rateLimiterContent.includes('cleanupIntervalId')
);

test(
  'startCleanup 메서드',
  rateLimiterContent.includes('startCleanup(')
);

test(
  'stopCleanup 메서드',
  rateLimiterContent.includes('stopCleanup(')
);

test(
  'unref() 호출 (프로세스 종료 방해 방지)',
  rateLimiterContent.includes('.unref()')
);

test(
  'destroyRateLimiter 함수',
  rateLimiterContent.includes('destroyRateLimiter')
);

// 4. feedback-loop.js 검증
console.log('\n--- feedback-loop.js ---');
const feedbackLoopContent = fs.readFileSync(
  path.join(PROJECT_ROOT, 'orchestrator/agents/feedback-loop.js'),
  'utf-8'
);

test(
  'validationResult 방어적 초기화',
  feedbackLoopContent.includes('let validationResult = {')
);

test(
  '방어적 초기화 주석',
  feedbackLoopContent.includes('방어적 초기화')
);

// 5. kill-switch.js 검증
console.log('\n--- kill-switch.js ---');
const killSwitchContent = fs.readFileSync(
  path.join(PROJECT_ROOT, 'orchestrator/security/kill-switch.js'),
  'utf-8'
);

test(
  'isHalted() 메서드',
  killSwitchContent.includes('isHalted()')
);

test(
  'getStatus() 메서드',
  killSwitchContent.includes('getStatus()')
);

// 결과 출력
console.log('\n=== 테스트 결과 ===');
console.log(`통과: ${passCount}개`);
console.log(`실패: ${failCount}개`);
console.log(`총: ${passCount + failCount}개`);

if (failCount === 0) {
  console.log('\n🎉 모든 검증 통과!');
} else {
  console.log('\n⚠️ 일부 검증 실패');
  process.exit(1);
}
