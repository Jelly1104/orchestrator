/**
 * SubAgent + Output Validator 통합 테스트
 * 실제 LLM 호출 없이 통합 로직만 검증
 */

import { SubAgent } from './agents/subagent.js';
import { PRDAnalyzer } from './agents/prd-analyzer.js';
import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(process.cwd(), '..');

// Mock 파일 (LLM 응답 시뮬레이션) - PRD 체크리스트와 매칭되는 파일명 사용
const mockFiles = {
  'outputs/활성회원-세그먼트-정의.sql': `
-- 활성 회원 세그먼트 SQL
SELECT
  u.U_ID,
  u.U_KIND,
  u.U_ALIVE,
  CASE
    WHEN login_count >= 20 THEN 'HEAVY'
    WHEN login_count >= 5 THEN 'MEDIUM'
    ELSE 'LIGHT'
  END AS segment
FROM USERS u
WHERE u.U_ALIVE = 'Y'
LIMIT 10000;
  `,
  'outputs/프로필-행동-조인-분석.sql': `
-- 프로필-행동 조인 쿼리
SELECT
  u.U_ID,
  ud.U_MAJOR_CODE_1,
  ud.U_WORK_TYPE_1
FROM USERS u
INNER JOIN USER_DETAIL ud ON u.U_ID = ud.U_ID
WHERE u.U_KIND = 'DOC001';
  `,
  'outputs/전문과목별-분포-비교.sql': `
-- 전문과목별 분포 비교
SELECT
  ud.U_MAJOR_CODE_1 AS major_code,
  COUNT(*) AS count
FROM USER_DETAIL ud
GROUP BY ud.U_MAJOR_CODE_1
ORDER BY count DESC;
  `,
  'outputs/근무형태별-분포-비교.sql': `
-- 근무형태별 분포 비교
SELECT
  ud.U_WORK_TYPE_1 AS work_type,
  COUNT(*) AS count
FROM USER_DETAIL ud
GROUP BY ud.U_WORK_TYPE_1;
  `,
  'outputs/활성회원-프로파일-요약-리포트.md': `
# 활성 회원 프로파일 요약 리포트

## 1. 개요
본 리포트는 HEAVY 세그먼트 회원의 프로파일 특성을 분석합니다.

## 2. 주요 발견
- 내과(IM)와 정신건강의학과(PSY)에서 HEAVY 비율 높음
- 봉직의보다 개원의에서 HEAVY 비율 +12%p 차이

## 3. 데이터 기준
- 분석 기간: 최근 30일
- 대상: U_ALIVE='Y', U_KIND='DOC001'
  `,
  'outputs/G1-UseCase-Trigger-후보-제안.md': `
# G1 Use Case Trigger 후보 제안

## 1. 타겟 마케팅
HEAVY 세그먼트 중 내과 개원의를 대상으로 한 마케팅 캠페인

## 2. 이탈 방지
LIGHT 세그먼트 중 과거 HEAVY였던 회원 리타겟팅
  `
};

async function runTest() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🧪 SubAgent + Output Validator 통합 테스트');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // 1. PRD 분석 (Gap Check)
  console.log('📋 [Step 1] PRD 분석 (Gap Check)...\n');
  const prdPath = path.join(projectRoot, '.claude/project/PRD.md');
  const prdContent = fs.readFileSync(prdPath, 'utf-8');

  const prdAnalyzer = new PRDAnalyzer(projectRoot);
  const prdAnalysis = await prdAnalyzer.analyze(prdContent);

  console.log(`   파이프라인: ${prdAnalysis.pipeline}`);
  console.log(`   산출물 체크리스트: ${prdAnalysis.deliverables.length}개`);
  prdAnalysis.deliverables.forEach((d, i) => {
    console.log(`     ${i + 1}. ${d.item}`);
  });

  // 2. SubAgent 초기화 (실제 LLM 호출 없이)
  console.log('\n📦 [Step 2] SubAgent 초기화...\n');
  const subAgent = new SubAgent({ projectRoot });

  // 3. Mock 파일을 산출물로 변환
  console.log('🔄 [Step 3] Mock 파일 → 산출물 변환...\n');
  const outputs = subAgent.filesToOutputs(mockFiles);
  console.log(`   변환된 산출물: ${outputs.length}개`);
  outputs.forEach((o, i) => {
    console.log(`     ${i + 1}. ${o.name} (${o.type})`);
  });

  // 4. 산출물 검증
  console.log('\n🔍 [Step 4] 산출물 검증 (Output Validation)...');
  const validation = subAgent.validateOutputs(outputs, prdAnalysis);

  // 5. 결과 요약
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 테스트 결과 요약');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log(`검증 결과: ${validation.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`산출물: ${validation.summary.total}개`);
  console.log(`Syntax 통과: ${validation.summary.syntaxPassed}/${validation.summary.total}`);
  console.log(`PRD 매칭: ${validation.prdMatch?.matched || 0}/${validation.prdMatch?.total || 0}`);

  if (validation.prdMatch?.missing?.length > 0) {
    console.log('\n⚠️  누락된 PRD 체크리스트 항목:');
    validation.prdMatch.missing.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m}`);
    });
  }

  console.log('\n✅ 통합 테스트 완료');
}

runTest().catch(console.error);
