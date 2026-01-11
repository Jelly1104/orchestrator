/**
 * Phase 전환 및 보조 로직 테스트
 * - enrichPRDWithAnalysis: 분석 요약이 설계 컨텍스트에 주입되는지 확인
 * - generateFallbackHandoff: Gap Check 전달물이 HANDOFF에 반영되는지 확인
 */

import assert from 'assert';
import { Orchestrator } from '../orchestrator.js';

const orchestrator = new Orchestrator({
  projectRoot: process.cwd(),
  autoApprove: true,
  saveFiles: false
});

// 분석 결과가 존재할 때 요약/발견/권장사항이 포함되는지 확인
(() => {
  const prd = '# PRD\n\n## 목적\n테스트';
  const analysisResult = {
    insights: { llmInsights: { executiveSummary: '요약', keyFindings: [{ finding: 'A' }], recommendations: [{ priority: 'P1', action: 'Do it' }] } },
    data: [],
    summary: {}
  };

  const enriched = orchestrator.enrichPRDWithAnalysis(prd, analysisResult);
  assert(enriched.includes('📊 분석 결과 참고'), '분석 섹션 누락');
  assert(enriched.includes('요약'), 'Executive Summary 누락');
  assert(enriched.includes('핵심 발견사항'), 'Key Findings 누락');
})();

// Gap Check 전달물이 HANDOFF에 매핑되는지 확인
(() => {
  const planResult = {
    gapCheck: {
      deliverables: [
        { item: 'SQL 쿼리 작성', type: 'SQL' },
        { item: 'IA 설계', type: 'DESIGN' }
      ],
      pipeline: 'ui_mockup'
    },
    ia: '',
    wireframe: '',
    sdd: ''
  };

  const handoff = orchestrator.generateFallbackHandoff(planResult, '테스트 작업', '# PRD');
  assert(handoff.includes('SQL 쿼리 작성'), '산출물 매핑 누락');
  assert(handoff.includes('IA 설계'), '산출물 매핑 누락');
  assert(handoff.includes('UI Mockup'), '파이프라인 라벨 누락');
})();

console.log('✅ Phase 전환 보조 테스트 완료');
