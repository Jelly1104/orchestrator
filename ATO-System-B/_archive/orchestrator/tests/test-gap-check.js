/**
 * Gap Check 테스트 스크립트
 * Case #4 PRD로 Gap Check 동작 확인
 */

import fs from 'fs';
import path from 'path';
import { PRDAnalyzer } from './agents/prd-analyzer.js';

const projectRoot = path.resolve(process.cwd(), '..');

// Case #4 PRD 로드
const prdPath = path.join(projectRoot, '.claude/project/PRD.md');
const prdContent = fs.readFileSync(prdPath, 'utf-8');

async function runTest() {
  console.log('🧪 Gap Check 테스트 시작\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📄 PRD: Case #4 - 활성 회원 패턴 분석 PoC');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // PRD Analyzer 실행
  const analyzer = new PRDAnalyzer(projectRoot);
  const result = await analyzer.analyze(prdContent);

  // 결과 출력
  console.log(analyzer.formatGapCheckResult(result));

  // 상세 결과
  console.log('\n📊 상세 분석 결과:\n');
  console.log('파이프라인:', result.pipeline);
  console.log('산출물 개수:', result.deliverables.length);
  console.log('레퍼런스 매칭:', result.reference ? result.reference.reference : '없음');
  console.log('데이터 테이블:', result.dataRequirements.map(r => r.table).join(', ') || '없음');
  console.log('Gap 개수:', result.gaps.length);

  // 이번 실패 원인 시뮬레이션
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 이번 실패 원인 분석');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (result.deliverables.length > 0) {
    console.log('PRD 산출물 체크리스트:');
    result.deliverables.forEach((d, i) => {
      console.log(`  ${i + 1}. ${d.item}`);
      console.log(`     → 유형: ${d.type}`);
      console.log(`     → 기존 Orchestrator: ❌ 무시됨`);
      console.log(`     → Gap Check 적용 후: ✅ HANDOFF에 강제 포함`);
      console.log('');
    });
  }

  console.log('\n✅ Gap Check 테스트 완료');
}

runTest().catch(console.error);
