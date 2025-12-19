/**
 * Output Validator 테스트 스크립트
 * 자체 검증 로직 동작 확인
 */

import { OutputValidator } from './agents/output-validator.js';
import { PRDAnalyzer } from './agents/prd-analyzer.js';
import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(process.cwd(), '..');

// 테스트 산출물 (Case #4 시뮬레이션)
const testOutputs = [
  {
    name: '활성 회원 세그먼트 SQL',
    type: 'SQL',
    content: `
-- 활성 회원 (HEAVY/MEDIUM/LIGHT) 세그먼트 쿼리
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
INNER JOIN (
  SELECT U_ID, COUNT(*) as login_count
  FROM USER_LOGIN
  WHERE LOGIN_DATE >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  GROUP BY U_ID
) login ON u.U_ID = login.U_ID
WHERE u.U_ALIVE = 'Y'
LIMIT 10000;
    `
  },
  {
    name: '프로필-행동 조인 쿼리',
    type: 'SQL',
    content: `
-- 프로필 + 행동 데이터 조인
SELECT
  u.U_ID,
  ud.U_MAJOR_CODE_1,
  ud.U_WORK_TYPE_1,
  seg.segment
FROM USERS u
INNER JOIN USER_DETAIL ud ON u.U_ID = ud.U_ID
INNER JOIN user_segments seg ON u.U_ID = seg.U_ID
WHERE u.U_KIND = 'DOC001';
    `
  },
  {
    name: '전문과목별 분포 비교',
    type: 'SQL',
    content: `
-- 전문과목별 세그먼트 분포
SELECT
  ud.U_MAJOR_CODE_1 AS major_code,
  cm.CODE_NAME AS major_name,
  segment,
  COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(PARTITION BY ud.U_MAJOR_CODE_1), 2) AS percentage
FROM USER_DETAIL ud
INNER JOIN CODE_MASTER cm ON ud.U_MAJOR_CODE_1 = cm.CODE_VALUE
INNER JOIN user_segments seg ON ud.U_ID = seg.U_ID
GROUP BY ud.U_MAJOR_CODE_1, cm.CODE_NAME, segment
ORDER BY major_code, segment;
    `
  },
  {
    name: '근무형태별 분포 비교',
    type: 'SQL',
    content: `
-- 근무형태별 세그먼트 분포
SELECT
  ud.U_WORK_TYPE_1 AS work_type,
  segment,
  COUNT(*) AS count
FROM USER_DETAIL ud
INNER JOIN user_segments seg ON ud.U_ID = seg.U_ID
GROUP BY ud.U_WORK_TYPE_1, segment;
    `
  },
  {
    name: '프로파일 요약 리포트',
    type: 'Markdown',
    content: `
# 활성 회원 프로파일 요약 리포트

## 1. 개요
본 리포트는 HEAVY 세그먼트 회원의 프로파일 특성을 분석합니다.

## 2. 주요 발견
- 내과(IM)와 정신건강의학과(PSY)에서 HEAVY 비율 높음
- 봉직의보다 개원의에서 HEAVY 비율 +12%p 차이

## 3. 데이터 기준
- 분석 기간: 최근 30일
- 대상: U_ALIVE='Y', U_KIND='DOC001'
    `
  },
  {
    name: 'Use Case 제안',
    type: 'Markdown',
    content: `
# Use Case 제안

## 1. 타겟 마케팅
HEAVY 세그먼트 중 내과 개원의를 대상으로 한 마케팅 캠페인

## 2. 이탈 방지
LIGHT 세그먼트 중 과거 HEAVY였던 회원 리타겟팅
    `
  }
];

// 잘못된 산출물 테스트 케이스
const badOutputs = [
  {
    name: '잘못된 SQL',
    type: 'SQL',
    content: `
DELETE FROM USERS WHERE U_ALIVE = 'N';
    `
  },
  {
    name: '존재하지 않는 컬럼 사용',
    type: 'SQL',
    content: `
SELECT U_ID, U_PHONE_NUMBER, U_ADDRESS
FROM USERS
WHERE U_ACTIVE = 'Y';
    `
  }
];

async function runTest() {
  console.log('🧪 Output Validator 테스트 시작\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📄 테스트 케이스: Case #4 시뮬레이션');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // PRD 분석
  const prdPath = path.join(projectRoot, '.claude/project/PRD.md');
  const prdContent = fs.readFileSync(prdPath, 'utf-8');

  const prdAnalyzer = new PRDAnalyzer(projectRoot);
  const prdAnalysis = await prdAnalyzer.analyze(prdContent);

  console.log(`📋 PRD 산출물 체크리스트: ${prdAnalysis.deliverables.length}개\n`);

  // Validator 인스턴스 생성
  const validator = new OutputValidator(projectRoot);

  // 테스트 1: 정상 산출물 검증
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ 테스트 1: 정상 산출물 검증');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const result1 = validator.validate(testOutputs, prdAnalysis);
  console.log(validator.formatValidationResult(result1));

  // 테스트 2: 잘못된 산출물 검증
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('❌ 테스트 2: 잘못된 산출물 검증');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const result2 = validator.validate(badOutputs, prdAnalysis);
  console.log(validator.formatValidationResult(result2));

  // 테스트 3: 산출물 누락 시나리오
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️  테스트 3: 산출물 누락 시나리오 (2개만 제공)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const partialOutputs = testOutputs.slice(0, 2);
  const result3 = validator.validate(partialOutputs, prdAnalysis);
  console.log(validator.formatValidationResult(result3));

  console.log('\n✅ Output Validator 테스트 완료');
}

runTest().catch(console.error);
