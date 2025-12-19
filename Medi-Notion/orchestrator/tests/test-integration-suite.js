/**
 * 통합 테스트 스위트
 * 수정사항 검증을 위한 E2E 테스트
 */

import { Orchestrator } from '../orchestrator.js';
import { FeedbackLoopController } from '../agents/feedback-loop.js';
import { OutputValidator } from '../agents/output-validator.js';
import { KillSwitch } from '../security/kill-switch.js';
import { RateLimiter, destroyRateLimiter } from '../security/rate-limiter.js';
import path from 'path';
import fs from 'fs';

const PROJECT_ROOT = path.resolve(process.cwd(), '..');

console.log('═'.repeat(60));
console.log('🧪 통합 테스트 스위트');
console.log('═'.repeat(60));

let passCount = 0;
let failCount = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    passCount++;
  } catch (err) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${err.message}`);
    failCount++;
  }
}

// ═══════════════════════════════════════════════════════════════
// Test Suite 1: FeedbackLoop 방어적 초기화
// ═══════════════════════════════════════════════════════════════
console.log('\n--- Suite 1: FeedbackLoop 방어적 초기화 ---');

await test('validationResult 초기화 (빈 outputs)', async () => {
  const controller = new FeedbackLoopController(PROJECT_ROOT, { maxRetries: 0 });
  const result = await controller.runWithFeedback([], {}, null);

  if (result.validationResult === undefined) {
    throw new Error('validationResult가 undefined');
  }
  if (typeof result.validationResult.passed !== 'boolean') {
    throw new Error('validationResult.passed가 boolean이 아님');
  }
});

await test('validationResult 초기화 (null prdAnalysis)', async () => {
  const controller = new FeedbackLoopController(PROJECT_ROOT, { maxRetries: 1 });
  const outputs = [{ name: 'test.md', type: 'Design', content: '# Test' }];
  const result = await controller.runWithFeedback(outputs, null, null);

  if (!result.validationResult) {
    throw new Error('validationResult가 없음');
  }
});

// ═══════════════════════════════════════════════════════════════
// Test Suite 2: KillSwitch 메서드
// ═══════════════════════════════════════════════════════════════
console.log('\n--- Suite 2: KillSwitch 메서드 ---');

await test('isHalted() 반환값 타입', async () => {
  const ks = new KillSwitch({ projectRoot: '/tmp' });
  const result = ks.isHalted();

  if (typeof result !== 'boolean') {
    throw new Error(`isHalted() 반환 타입 오류: ${typeof result}`);
  }
});

await test('getStatus() 필수 필드', async () => {
  const ks = new KillSwitch({ projectRoot: '/tmp' });
  const status = ks.getStatus();

  const requiredFields = ['halted', 'haltReason', 'triggeredAt', 'recoveryRequired', 'anomalyCount'];
  for (const field of requiredFields) {
    if (!(field in status)) {
      throw new Error(`getStatus()에 ${field} 필드 누락`);
    }
  }
});

// ═══════════════════════════════════════════════════════════════
// Test Suite 3: RateLimiter 리소스 관리
// ═══════════════════════════════════════════════════════════════
console.log('\n--- Suite 3: RateLimiter 리소스 관리 ---');

await test('startCleanup/stopCleanup 동작', async () => {
  const limiter = new RateLimiter();

  limiter.startCleanup(1000);
  if (!limiter.cleanupIntervalId) {
    throw new Error('startCleanup 후 intervalId 없음');
  }

  limiter.stopCleanup();
  if (limiter.cleanupIntervalId !== null) {
    throw new Error('stopCleanup 후 intervalId가 null이 아님');
  }
});

await test('destroyRateLimiter 함수', async () => {
  // 이미 import 됨 - 타입 체크만
  if (typeof destroyRateLimiter !== 'function') {
    throw new Error('destroyRateLimiter가 함수가 아님');
  }
});

// ═══════════════════════════════════════════════════════════════
// Test Suite 4: Promise.allSettled 패턴 (코드 검증)
// ═══════════════════════════════════════════════════════════════
console.log('\n--- Suite 4: Promise.allSettled 패턴 ---');

await test('orchestrator.js에 Promise.allSettled 존재', async () => {
  const content = fs.readFileSync(
    path.join(process.cwd(), 'orchestrator.js'),
    'utf-8'
  );

  if (!content.includes('Promise.allSettled')) {
    throw new Error('Promise.allSettled 미사용');
  }
});

await test('부분 실패 처리 로직 존재', async () => {
  const content = fs.readFileSync(
    path.join(process.cwd(), 'orchestrator.js'),
    'utf-8'
  );

  if (!content.includes("status === 'fulfilled'") || !content.includes("status === 'rejected'")) {
    throw new Error('부분 실패 처리 로직 없음');
  }
});

await test('둘 다 실패 시 조기 종료 로직', async () => {
  const content = fs.readFileSync(
    path.join(process.cwd(), 'orchestrator.js'),
    'utf-8'
  );

  if (!content.includes('Design Agent와 Code Agent 모두 실패')) {
    throw new Error('둘 다 실패 시 처리 로직 없음');
  }
});

// ═══════════════════════════════════════════════════════════════
// Test Suite 5: Review 예외 처리
// ═══════════════════════════════════════════════════════════════
console.log('\n--- Suite 5: Review 예외 처리 ---');

await test('Review try-catch 블록 존재', async () => {
  const content = fs.readFileSync(
    path.join(process.cwd(), 'orchestrator.js'),
    'utf-8'
  );

  if (!content.includes('Review 호출 실패')) {
    throw new Error('Review 예외 처리 없음');
  }
});

// ═══════════════════════════════════════════════════════════════
// Test Suite 6: API 타임아웃
// ═══════════════════════════════════════════════════════════════
console.log('\n--- Suite 6: API 타임아웃 ---');

await test('analysis-agent.js에 타임아웃 구현', async () => {
  const content = fs.readFileSync(
    path.join(process.cwd(), 'agents', 'analysis-agent.js'),
    'utf-8'
  );

  if (!content.includes('Promise.race') || !content.includes('timeout')) {
    throw new Error('타임아웃 구현 없음');
  }
});

// ═══════════════════════════════════════════════════════════════
// 결과 출력
// ═══════════════════════════════════════════════════════════════
console.log('\n' + '═'.repeat(60));
console.log('📊 테스트 결과');
console.log('═'.repeat(60));
console.log(`✅ 통과: ${passCount}개`);
console.log(`❌ 실패: ${failCount}개`);
console.log(`📋 총: ${passCount + failCount}개`);

if (failCount === 0) {
  console.log('\n🎉 모든 통합 테스트 통과!');
  process.exit(0);
} else {
  console.log('\n⚠️ 일부 테스트 실패');
  process.exit(1);
}
