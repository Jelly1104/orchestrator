/**
 * 수정사항 검증 테스트
 */

import { FeedbackLoopController } from '../agents/feedback-loop.js';
import { KillSwitch } from '../security/kill-switch.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');

console.log('=== 수정사항 검증 테스트 ===\n');

// 1. FeedbackLoopController validationResult 초기화 검증
console.log('1. FeedbackLoopController validationResult 초기화 검증');
try {
  const controller = new FeedbackLoopController('/tmp', { maxRetries: 0 });

  // 빈 outputs로 테스트
  const result = await controller.runWithFeedback([], null, null);

  if (result.validationResult !== undefined) {
    console.log('   ✅ validationResult가 초기화됨');
    console.log('   - passed:', result.validationResult.passed);
    console.log('   - errors:', result.validationResult.errors || []);
  } else {
    console.log('   ❌ validationResult가 undefined');
  }
} catch (err) {
  console.log('   ⚠️ 테스트 중 예외:', err.message);
}

// 2. KillSwitch isHalted/getStatus 메서드 검증
console.log('\n2. KillSwitch isHalted/getStatus 메서드 검증');
try {
  const killSwitch = new KillSwitch({ projectRoot: '/tmp' });

  const hasIsHalted = typeof killSwitch.isHalted === 'function';
  const hasGetStatus = typeof killSwitch.getStatus === 'function';

  console.log('   - isHalted() 메서드:', hasIsHalted ? '✅ 존재' : '❌ 없음');
  console.log('   - getStatus() 메서드:', hasGetStatus ? '✅ 존재' : '❌ 없음');

  if (hasIsHalted && hasGetStatus) {
    const halted = killSwitch.isHalted();
    const status = killSwitch.getStatus();

    console.log('   - isHalted() 반환값:', halted);
    console.log('   - getStatus() 필드:', Object.keys(status).join(', '));
  }
} catch (err) {
  console.log('   ❌ 테스트 실패:', err.message);
}

// 3. Promise.allSettled 패턴 검증 (구문 검증만)
console.log('\n3. Promise.allSettled 패턴 검증');
try {
  const content = fs.readFileSync(path.join(PROJECT_ROOT, 'orchestrator/orchestrator.js'), 'utf-8');

  const hasAllSettled = content.includes('Promise.allSettled');
  const hasPartialHandling = content.includes("status === 'fulfilled'") || content.includes("status === 'rejected'");

  console.log('   - Promise.allSettled 사용:', hasAllSettled ? '✅' : '❌');
  console.log('   - 부분 실패 처리 로직:', hasPartialHandling ? '✅' : '❌');
} catch (err) {
  console.log('   ❌ 검증 실패:', err.message);
}

// 4. CodeAgent.revise() 메서드 확인
console.log('\n4. CodeAgent.revise() 메서드 검증');
try {
  const { CodeAgent } = await import('../agents/code-agent.js');
  const codeAgent = new CodeAgent({ projectRoot: '/tmp' });

  const hasRevise = typeof codeAgent.revise === 'function';
  console.log('   - revise() 메서드:', hasRevise ? '✅ 존재' : '❌ 없음');
} catch (err) {
  console.log('   ❌ 검증 실패:', err.message);
}

// 5. classifyPRDv2() 메서드 확인
console.log('\n5. classifyPRDv2() 메서드 검증');
try {
  const { PRDAnalyzer } = await import('../agents/prd-analyzer.js');
  const analyzer = new PRDAnalyzer('/tmp');

  const hasClassifyPRDv2 = typeof analyzer.classifyPRDv2 === 'function';
  console.log('   - classifyPRDv2() 메서드:', hasClassifyPRDv2 ? '✅ 존재' : '❌ 없음');
} catch (err) {
  console.log('   ❌ 검증 실패:', err.message);
}

console.log('\n=== 모든 검증 완료 ===');
