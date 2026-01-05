/**
 * AnalysisAgent 테스트 스크립트
 * Case #4 PRD를 사용하여 SQL 생성 → 실행 → 결과 수집 검증
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// .env 파일 로드
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, 'orchestrator', '.env') });

import { AnalysisAgent } from './orchestrator/agents/analysis-agent.js';
import { PRDAnalyzer } from './orchestrator/agents/prd-analyzer.js';

// Case #4 PRD v2 형식
const CASE4_PRD = `
# PRD: HEAVY 세그먼트 회원 패턴 분석

## 1. 목적
AI Agent 타겟 세그먼트 정의를 위해 HEAVY 세그먼트 회원(최근 30일간 6회+ 로그인)의 패턴을 파악한다.

## 2. 타겟 유저
AI PM, 기획팀 - Agent 서비스 기획 시 참조

## 3. 핵심 기능
- HEAVY 세그먼트 조건 정의 및 회원 추출
- 전문과목별 분포 비교 (HEAVY vs 전체)
- 근무형태별 분포 비교 (HEAVY vs 전체)
- 프로파일 요약 리포트 생성

## 4. 성공 지표
- 전체 대비 +5%p 이상 차이 세그먼트 1개 이상 발견
- 분석 쿼리 실행 성공
- 인사이트 도출

## 5. PRD 유형
type: QUANTITATIVE

## 6. 파이프라인
pipeline: analysis

## 7. 산출물
- [x] 활성 회원 세그먼트 정의 SQL
- [x] 프로필-행동 조인 분석 쿼리
- [x] 전문과목별 분포 비교
- [x] 근무형태별 분포 비교
- [x] 활성 회원 프로파일 요약 리포트
- [x] Use Case Trigger 후보 제안

## 8. 데이터 요구사항
| 테이블 | 컬럼 | 용도 |
|--------|------|------|
| USERS | U_ID, U_KIND, U_ALIVE, U_REG_DATE | 회원 기본 |
| USER_DETAIL | U_MAJOR_CODE_1, U_WORK_TYPE_1 | 프로필 |
| CODE_MASTER | CODE, CODE_NAME | 코드 변환 |
| USER_LOGIN | U_ID, LOGIN_DATE | 로그인 이력 |

db_connection:
  host: "222.122.26.242"
  port: 3306
  database: "medigate"

## 9. 제약사항
- SELECT only
- 민감 컬럼 제외 (U_NAME, U_EMAIL 등)
- USER_LOGIN 테이블은 반드시 WHERE 조건과 LIMIT 사용
`;

async function testAnalysisAgent() {
  console.log('='.repeat(60));
  console.log('  AnalysisAgent 테스트 - Case #4 PRD');
  console.log('='.repeat(60));

  // 1. PRD 파싱 테스트
  console.log('\n[1] PRD 파싱 테스트...');
  const prdAnalyzer = new PRDAnalyzer();

  const classification = prdAnalyzer.classifyPRDv2(CASE4_PRD);
  console.log(`  - pipeline: ${classification.pipeline}`);

  if (classification.pipeline !== 'analysis') {
    console.error('  ❌ 파이프라인 판별 실패: analysis 예상');
    return;
  }
  console.log('  ✓ 파이프라인 판별 성공');

  const parsed = prdAnalyzer.parsePRD(CASE4_PRD);
  console.log(`  - 목적: ${parsed.objective.substring(0, 50)}...`);
  console.log(`  - 산출물: ${parsed.deliverables.length}개`);
  console.log(`  - 데이터요구사항: ${parsed.dataRequirements.length}개 테이블`);

  // 2. AnalysisAgent 초기화
  console.log('\n[2] AnalysisAgent 초기화...');
  const agent = new AnalysisAgent({
    projectRoot: process.cwd(),
    outputDir: './test-output/analysis',
    maxRetries: 2,
    dbConfig: {
      host: '222.122.26.242',
      port: 3306,
      database: 'medigate',
      user: 'medigate',
      password: 'apelWkd'
    }
  });
  console.log('  ✓ AnalysisAgent 초기화 완료');

  // 3. 분석 실행
  console.log('\n[3] 분석 실행...');
  const startTime = Date.now();

  try {
    const result = await agent.analyze({
      ...parsed,
      type: 'QUANTITATIVE',
      pipeline: 'analysis'
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n' + '='.repeat(60));
    console.log('  테스트 결과');
    console.log('='.repeat(60));
    console.log(`  - 성공: ${result.success ? '✓' : '✗'}`);
    console.log(`  - 소요 시간: ${elapsed}초`);
    console.log(`  - 생성된 쿼리: ${result.queries?.length || 0}개`);
    console.log(`  - 성공한 쿼리: ${result.data?.filter(d => d.success).length || 0}개`);
    console.log(`  - 실패한 쿼리: ${result.data?.filter(d => !d.success).length || 0}개`);
    console.log(`  - 산출물: ${result.outputs?.length || 0}개`);

    if (result.errors?.length > 0) {
      console.log('\n  오류 목록:');
      result.errors.forEach(e => console.log(`    - ${e}`));
    }

    if (result.outputs?.length > 0) {
      console.log('\n  생성된 산출물:');
      result.outputs.forEach(o => console.log(`    - [${o.type}] ${o.path}`));
    }

    if (result.summary) {
      console.log('\n  요약:');
      console.log(`    - 총 데이터 행: ${result.summary.totalRows}`);
      console.log(`    - 패턴 발견: ${result.summary.patternsFound}개`);
      console.log(`    - 인사이트: ${result.summary.insightsFound}개`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(result.success ? '  ✅ 테스트 통과!' : '  ❌ 테스트 실패');
    console.log('='.repeat(60));

    return result;

  } catch (error) {
    console.error('\n  ❌ 테스트 중 오류:', error.message);
    console.error(error.stack);
    return null;
  }
}

// 실행
testAnalysisAgent()
  .then(result => {
    process.exit(result?.success ? 0 : 1);
  })
  .catch(err => {
    console.error('테스트 실패:', err);
    process.exit(1);
  });
