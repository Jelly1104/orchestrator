/**
 * Case #4 SQL 실행 테스트
 * - AnalysisAgent의 실제 DB 연결 및 SQL 실행 검증
 * - DOMAIN_SCHEMA.md 기반 쿼리 생성 + 실행
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env 로드
dotenv.config({ path: path.join(__dirname, 'orchestrator', '.env') });

import { AnalysisAgent } from './orchestrator/agents/analysis-agent.js';

console.log('='.repeat(60));
console.log('Case #4 SQL 실행 테스트');
console.log('AnalysisAgent DB 연결 검증');
console.log('='.repeat(60));

// DB 설정
const dbConfig = {
  host: process.env.DB_HOST || '222.122.26.242',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'medigate',
  password: process.env.DB_PASSWORD || 'apelWkd',
  database: process.env.DB_NAME || 'medigate'
};

console.log('\n[DB 설정]');
console.log(`  Host: ${dbConfig.host}:${dbConfig.port}`);
console.log(`  Database: ${dbConfig.database}`);
console.log(`  User: ${dbConfig.user}`);

// AnalysisAgent 초기화
console.log('\n[Step 1] AnalysisAgent 초기화...');
const analysisAgent = new AnalysisAgent({
  projectRoot: __dirname,
  provider: 'anthropic',
  dbConfig: dbConfig,
  outputDir: path.join(__dirname, 'test-output', 'analysis')
});

console.log('✅ AnalysisAgent 초기화 완료');

// 테스트 PRD 정의 (Case #4 기반 간소화)
const testPRD = {
  title: 'Case #4: 활성 회원 패턴 분석 PoC',
  type: 'QUANTITATIVE',
  pipeline: 'analysis',
  analysisRequirements: [
    {
      id: 'AQ-001',
      question: '전체 의사 회원 중 HEAVY 세그먼트(월 6회+ 로그인)는 몇 명인가?',
      tables: ['USER_LOGIN', 'USER_DETAIL'],
      metrics: ['회원 수', '세그먼트 비율']
    },
    {
      id: 'AQ-002',
      question: 'HEAVY 세그먼트의 전문과목별 분포는?',
      tables: ['USER_LOGIN', 'USER_DETAIL'],
      metrics: ['전문과목', '회원 수', '비율']
    },
    {
      id: 'AQ-003',
      question: 'HEAVY 세그먼트의 근무형태별 분포는?',
      tables: ['USER_LOGIN', 'USER_DETAIL'],
      metrics: ['근무형태', '회원 수', '비율']
    }
  ],
  deliverables: [
    { item: 'HEAVY 세그먼트 정의 SQL', type: 'QUERY' },
    { item: '전문과목별 분석 결과', type: 'DATA' },
    { item: '근무형태별 분석 결과', type: 'DATA' }
  ]
};

// Step 2: 분석 실행
console.log('\n[Step 2] Analysis 실행...');
console.log('  분석 요구사항:', testPRD.analysisRequirements.length, '개');

try {
  const startTime = Date.now();

  const result = await analysisAgent.analyze(testPRD);

  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('테스트 결과');
  console.log('='.repeat(60));
  console.log('  소요 시간:', elapsedTime, 's');
  console.log('  성공 여부:', result.success ? '✅ 성공' : '❌ 실패');

  // 쿼리 결과
  console.log('\n[실행된 쿼리]');
  if (result.queries && result.queries.length > 0) {
    result.queries.forEach((q, i) => {
      console.log(`  ${i + 1}. ${q.name || q.id || 'Query ' + (i + 1)}`);
      console.log(`     결과 행 수: ${q.rowCount || q.rows?.length || 0}`);
      if (q.error) {
        console.log(`     ❌ 에러: ${q.error}`);
      } else {
        console.log(`     ✅ 성공`);
      }
    });
  } else {
    console.log('  (실행된 쿼리 없음)');
  }

  // 데이터 결과
  console.log('\n[분석 데이터]');
  if (result.data) {
    Object.keys(result.data).forEach(key => {
      const data = result.data[key];
      if (Array.isArray(data)) {
        console.log(`  ${key}: ${data.length}개 행`);
      } else {
        console.log(`  ${key}: ${JSON.stringify(data).substring(0, 50)}...`);
      }
    });
  } else {
    console.log('  (분석 데이터 없음)');
  }

  // 인사이트
  console.log('\n[인사이트]');
  if (result.insights && result.insights.length > 0) {
    result.insights.forEach((insight, i) => {
      console.log(`  ${i + 1}. ${insight.substring(0, 80)}...`);
    });
  } else if (result.summary) {
    console.log('  ', result.summary.substring(0, 200) + '...');
  } else {
    console.log('  (인사이트 없음)');
  }

  // 출력 파일
  console.log('\n[생성된 파일]');
  if (result.outputs && result.outputs.length > 0) {
    result.outputs.forEach(file => {
      console.log(`  - ${file}`);
    });
  } else {
    console.log('  (생성된 파일 없음)');
  }

  // 토큰 사용량
  if (result.usage) {
    console.log('\n[토큰 사용량]');
    console.log(`  입력: ${result.usage.inputTokens || 0}`);
    console.log(`  출력: ${result.usage.outputTokens || 0}`);
    console.log(`  총합: ${(result.usage.inputTokens || 0) + (result.usage.outputTokens || 0)}`);
  }

  // 결과 저장
  const outputDir = path.join(__dirname, 'test-output', 'analysis');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const summaryPath = path.join(outputDir, 'case4-sql-test-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    testName: 'Case #4 SQL 실행 테스트',
    success: result.success,
    queriesExecuted: result.queries?.length || 0,
    dataGenerated: result.data ? Object.keys(result.data).length : 0,
    elapsedTime: parseFloat(elapsedTime),
    timestamp: new Date().toISOString(),
    errors: result.errors || []
  }, null, 2));

  console.log('\n결과 요약 저장:', summaryPath);

  // 최종 판정
  console.log('\n' + '='.repeat(60));
  if (result.success && result.queries?.length > 0) {
    console.log('✅ Case #4 SQL 실행 테스트 통과!');
    console.log('   - DB 연결 성공');
    console.log('   - SQL 쿼리 실행 성공');
    console.log('   - 분석 결과 생성 완료');
  } else {
    console.log('❌ 테스트 실패');
    if (result.errors) {
      result.errors.forEach(e => console.log('   -', e));
    }
  }
  console.log('='.repeat(60));

} catch (error) {
  console.error('\n❌ 테스트 실패:', error.message);
  console.error(error.stack);
  process.exit(1);
}

console.log('\n테스트 완료.');
