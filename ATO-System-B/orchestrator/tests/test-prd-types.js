/**
 * PRD 유형별 테스트 스크립트
 * 정량적 / 정성적 / 혼합 PRD 샘플로 Gap Check + Output Validator 검증
 */

import { PRDAnalyzer } from './agents/prd-analyzer.js';
import { OutputValidator } from './agents/output-validator.js';
import path from 'path';

const projectRoot = path.resolve(process.cwd(), '..');

// ═══════════════════════════════════════════════════════════════
// 테스트 PRD 샘플
// ═══════════════════════════════════════════════════════════════

const PRD_SAMPLES = {
  // 정량적 PRD (데이터 분석 중심)
  QUANTITATIVE: {
    name: '정량적 PRD - 월간 활성 사용자(MAU) 분석',
    expectedPipeline: 'analysis',
    content: `
# PRD: 월간 활성 사용자(MAU) 분석

## 1. 목적 (Objective)
최근 3개월간 MAU 추이를 분석하여 성장률 산출

## 2. 타겟 유저 (Target User)
- AI PM
- 경영진

## 3. 핵심 기능 (Core Features)
- 월별 MAU 집계
- 전월 대비 증감률 계산
- 직종별 MAU 비교

## 4. 성공 지표 (Success Criteria)
- 3개월 MAU 데이터 추출 완료
- 증감률 정확도 100%

## 5. 산출물 체크리스트
- [ ] 월별 MAU 집계 SQL
- [ ] 직종별 MAU 비교 SQL
- [ ] MAU 추이 리포트 (Markdown)

## 6. 데이터 요구사항
- USERS 테이블 (U_ID, U_KIND, U_REG_DATE)
- USER_DETAIL 테이블 (U_MAJOR_CODE_1)

## 7. 제약사항
- SELECT 쿼리만 허용
- 최근 3개월 데이터만 조회
    `
  },

  // 정성적 PRD (설계/제안 중심)
  QUALITATIVE: {
    name: '정성적 PRD - 알림 센터 UX 개선안',
    expectedPipeline: 'design',
    content: `
# PRD: 알림 센터 UX 개선안

## 1. 목적 (Objective)
사용자 알림 센터의 사용성을 개선하여 클릭률 향상

## 2. 타겟 유저 (Target User)
- 일반 의사 회원
- 모바일 사용자

## 3. 핵심 기능 (Core Features)
- 알림 카테고리 분류 체계 설계
- 읽음/안읽음 상태 UX 개선
- 알림 설정 페이지 와이어프레임

## 4. 성공 지표 (Success Criteria)
- 알림 클릭률 +10% 향상 기대
- 사용자 설문 만족도 4.0/5.0 이상

## 5. 산출물 체크리스트
- [ ] 알림 카테고리 분류 체계 (IA)
- [ ] 알림 센터 와이어프레임
- [ ] 알림 설정 페이지 와이어프레임
- [ ] UX 개선안 제안서

## 6. 제약사항
- 기존 알림 API 구조 유지
- 모바일 우선 설계
    `
  },

  // 혼합 PRD (분석 → 인사이트 → 제안)
  MIXED: {
    name: '혼합 PRD - 이탈 회원 분석 및 리텐션 전략',
    expectedPipeline: 'analyzed_design',
    content: `
# PRD: 이탈 회원 분석 및 리텐션 전략

## 1. 목적 (Objective)
이탈 회원 패턴을 분석하고 리텐션 개선 전략 수립

## 2. 타겟 유저 (Target User)
- CRM 마케터
- AI PM

## 3. 핵심 기능 (Core Features)
- 이탈 회원 정의 및 추출 (30일 미접속)
- 이탈 전 행동 패턴 분석
- 리텐션 캠페인 타겟 세그먼트 제안

## 4. 성공 지표 (Success Criteria)
- 이탈 예측 정확도 70% 이상
- 리텐션 캠페인 대상 3개 세그먼트 도출

## 5. 산출물 체크리스트
- [ ] 이탈 회원 정의 SQL
- [ ] 이탈 전 행동 패턴 분석 SQL
- [ ] 이탈 회원 프로파일 분석 (Markdown)
- [ ] 리텐션 캠페인 타겟 세그먼트 제안서
- [ ] 캠페인 실행 액션 플랜

## 6. 데이터 요구사항
- USERS 테이블
- USER_DETAIL 테이블

## 7. 제약사항
- 개인정보 익명화 필수
- SELECT 쿼리만 허용
    `
  }
};

// ═══════════════════════════════════════════════════════════════
// 테스트 산출물 시뮬레이션
// ═══════════════════════════════════════════════════════════════

const MOCK_OUTPUTS = {
  QUANTITATIVE: [
    { name: '월별 MAU 집계 SQL', type: 'SQL', content: 'SELECT COUNT(DISTINCT U_ID) FROM USERS WHERE U_REG_DATE >= DATE_SUB(NOW(), INTERVAL 3 MONTH);' },
    { name: '직종별 MAU 비교 SQL', type: 'SQL', content: 'SELECT U_KIND, COUNT(*) FROM USERS GROUP BY U_KIND;' },
    { name: 'MAU 추이 리포트', type: 'Markdown', content: '# MAU 추이 리포트\n\n## 개요\n...' }
  ],
  QUALITATIVE: [
    { name: '알림 카테고리 분류 체계 (IA)', type: 'Markdown', content: '# 알림 카테고리 IA\n\n## 분류 체계\n...' },
    { name: '알림 센터 와이어프레임', type: 'Markdown', content: '# 알림 센터 와이어프레임\n\n## 화면 구성\n...' },
    { name: '알림 설정 페이지 와이어프레임', type: 'Markdown', content: '# 알림 설정 와이어프레임\n\n## 설정 항목\n...' },
    { name: 'UX 개선안 제안서', type: 'Markdown', content: '# UX 개선안\n\n## 제안 내용\n...' }
  ],
  MIXED: [
    { name: '이탈 회원 정의 SQL', type: 'SQL', content: 'SELECT U_ID FROM USERS WHERE DATEDIFF(NOW(), U_REG_DATE) > 30;' },
    { name: '이탈 전 행동 패턴 분석 SQL', type: 'SQL', content: 'SELECT U_ID, COUNT(*) FROM USER_DETAIL GROUP BY U_ID;' },
    { name: '이탈 회원 프로파일 분석', type: 'Markdown', content: '# 이탈 회원 프로파일\n\n## 분석 결과\n...' },
    { name: '리텐션 캠페인 타겟 세그먼트 제안서', type: 'Markdown', content: '# 타겟 세그먼트 제안\n\n## 세그먼트 정의\n...' },
    { name: '캠페인 실행 액션 플랜', type: 'Markdown', content: '# 액션 플랜\n\n## 실행 계획\n...' }
  ]
};

// ═══════════════════════════════════════════════════════════════
// 테스트 실행
// ═══════════════════════════════════════════════════════════════

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🧪 PRD 유형별 테스트 시작');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const prdAnalyzer = new PRDAnalyzer(projectRoot);
  const outputValidator = new OutputValidator(projectRoot);

  const results = [];

  for (const [type, sample] of Object.entries(PRD_SAMPLES)) {
    console.log(`\n${'━'.repeat(60)}`);
    console.log(`📄 ${sample.name}`);
    console.log(`${'━'.repeat(60)}\n`);

    // 1. Gap Check
    console.log('📋 [Step 1] Gap Check 실행...');
    const prdAnalysis = await prdAnalyzer.analyze(sample.content);

    console.log(`   - 파이프라인: ${prdAnalysis.pipeline}`);
    console.log(`   - 산출물: ${prdAnalysis.deliverables.length}개`);
    console.log(`   - 데이터 테이블: ${prdAnalysis.dataRequirements.map(r => r.table).join(', ') || '없음'}`);
    console.log(`   - Gap: ${prdAnalysis.gaps.length}개`);

    // 2. Output Validation
    console.log('\n🔍 [Step 2] Output Validation 실행...');
    const mockOutputs = MOCK_OUTPUTS[type];
    const validationResult = outputValidator.validate(mockOutputs, prdAnalysis);

    console.log(`   - 상태: ${validationResult.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   - Syntax 통과: ${validationResult.summary.syntaxPassed}/${validationResult.summary.total}`);
    console.log(`   - PRD 매칭: ${validationResult.prdMatch?.matched || 0}/${validationResult.prdMatch?.total || 0}`);

    if (validationResult.errors.length > 0) {
      console.log('\n   ❌ 오류:');
      validationResult.errors.slice(0, 3).forEach(e => {
        console.log(`      - [${e.type}] ${e.message}`);
      });
    }

    if (validationResult.warnings.length > 0) {
      console.log('\n   ⚠️  경고:');
      validationResult.warnings.slice(0, 3).forEach(w => {
        console.log(`      - [${w.type}] ${w.message}`);
      });
    }

    if (sample.expectedPipeline && prdAnalysis.pipeline !== sample.expectedPipeline) {
      throw new Error(`파이프라인 불일치: 기대=${sample.expectedPipeline}, 실제=${prdAnalysis.pipeline}`);
    }

    results.push({
      type,
      name: sample.name,
      pipeline: prdAnalysis.pipeline,
      deliverables: prdAnalysis.deliverables.length,
      gaps: prdAnalysis.gaps.length,
      validationPassed: validationResult.passed,
      prdMatched: validationResult.prdMatch?.matched || 0,
      prdTotal: validationResult.prdMatch?.total || 0
    });
  }

  // 요약
  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('📊 테스트 결과 요약');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('┌────────────────┬────────────────┬──────────┬────────┬────────────┐');
  console.log('│ 샘플 유형      │ 파이프라인     │ 산출물   │ Gap    │ 검증 결과  │');
  console.log('├────────────────┼────────────────┼──────────┼────────┼────────────┤');

  results.forEach(r => {
    const typeStr = r.type.padEnd(14);
    const classStr = r.pipeline.padEnd(14);
    const delStr = `${r.deliverables}개`.padEnd(8);
    const gapStr = `${r.gaps}개`.padEnd(6);
    const valStr = r.validationPassed ? '✅ PASSED' : '❌ FAILED';
    console.log(`│ ${typeStr} │ ${classStr} │ ${delStr} │ ${gapStr} │ ${valStr.padEnd(10)} │`);
  });

  console.log('└────────────────┴────────────────┴──────────┴────────┴────────────┘');

  const allPassed = results.every(r => r.validationPassed);
  console.log(`\n총 결과: ${allPassed ? '✅ 모든 테스트 통과' : '❌ 일부 테스트 실패'}`);

  console.log('\n✅ PRD 유형별 테스트 완료');
}

runAllTests().catch(console.error);
