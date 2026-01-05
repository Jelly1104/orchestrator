/**
 * 예외 케이스 테스트
 * - 빈 PRD: Gap Check HIGH 경고 및 필수 섹션 누락 확인
 * - 잘못된 pipeline 필드: design으로 폴백
 */

import assert from 'assert';
import { PRDAnalyzer } from '../agents/prd-analyzer.js';

const analyzer = new PRDAnalyzer();

async function main() {
  // Case 01: 빈 PRD
  const analysisResult = await analyzer.analyze('');
  assert.strictEqual(analysisResult.pipeline, 'design', '빈 PRD 기본 파이프라인은 design이어야 함');
  assert(analysisResult.missing.length >= 3, '필수 섹션 누락 감지 필요');

  // Case 03: 잘못된 파이프라인 타입 (숫자/객체)
  const prdContent = '| Pipeline | 123 |\n\n## 목적\n테스트';
  const classification = analyzer.classifyPRDv2(prdContent);
  assert.strictEqual(classification.pipeline, 'design', '잘못된 pipeline은 design으로 폴백해야 함');

  console.log('✅ 예외 케이스 테스트 완료');
}

main().catch(err => {
  console.error('❌ 예외 케이스 테스트 실패:', err);
  process.exit(1);
});
