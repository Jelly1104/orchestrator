#!/usr/bin/env node
/**
 * 토큰 사용량 모니터링 스크립트
 * Context Mode별 토큰 절감 효과 측정
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LOG_FILE = path.join(ROOT, '.claude/state/token-usage.json');

// 문서별 예상 토큰 수 (근사치)
const DOC_TOKENS = {
  'CLAUDE.md': 2500,
  'AI_CONTEXT.md': 1800,
  'AI_Playbook.md': 1500,
  'DOMAIN_SCHEMA.md': 3000,
  'TDD_WORKFLOW.md': 1200,
  'DOCUMENT_PIPELINE.md': 1000,
  'QUALITY_GATES.md': 800,
  'CODE_STYLE.md': 1000,
  'AGENT_ARCHITECTURE.md': 1500,
  'PROJECT_STACK.md': 600,
  'PRD.md': 800,
};

// Context Mode별 로드 문서
const CONTEXT_MODES = {
  Planning: ['CLAUDE.md', 'DOMAIN_SCHEMA.md', 'AI_Playbook.md', 'DOCUMENT_PIPELINE.md'],
  Coding: ['CLAUDE.md', 'DOMAIN_SCHEMA.md', 'TDD_WORKFLOW.md', 'CODE_STYLE.md', 'PROJECT_STACK.md'],
  Review: ['CLAUDE.md', 'DOMAIN_SCHEMA.md', 'QUALITY_GATES.md', 'PRD.md'],
  Full: Object.keys(DOC_TOKENS),
};

function calculateTokens(mode) {
  const docs = CONTEXT_MODES[mode] || CONTEXT_MODES.Full;
  return docs.reduce((sum, doc) => sum + (DOC_TOKENS[doc] || 0), 0);
}

function getSavings(mode) {
  const fullTokens = calculateTokens('Full');
  const modeTokens = calculateTokens(mode);
  const saved = fullTokens - modeTokens;
  const percent = ((saved / fullTokens) * 100).toFixed(1);
  return { fullTokens, modeTokens, saved, percent };
}

function logUsage(mode, sessionId) {
  const timestamp = new Date().toISOString();
  const { fullTokens, modeTokens, saved, percent } = getSavings(mode);

  const entry = {
    timestamp,
    sessionId: sessionId || `session-${Date.now()}`,
    mode,
    tokensUsed: modeTokens,
    tokensSaved: saved,
    savingsPercent: percent,
  };

  let data = { sessions: [], summary: {} };
  if (fs.existsSync(LOG_FILE)) {
    try {
      data = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
    } catch {}
  }

  data.sessions.push(entry);

  // 요약 업데이트
  if (!data.summary[mode]) {
    data.summary[mode] = { count: 0, totalSaved: 0 };
  }
  data.summary[mode].count++;
  data.summary[mode].totalSaved += saved;

  fs.writeFileSync(LOG_FILE, JSON.stringify(data, null, 2));

  return entry;
}

function printReport() {
  console.log('\n📊 Token Usage Report\n');
  console.log('Mode          | Tokens Used | Tokens Saved | Savings %');
  console.log('--------------|-------------|--------------|----------');

  for (const mode of ['Planning', 'Coding', 'Review', 'Full']) {
    const { modeTokens, saved, percent } = getSavings(mode);
    const pad = (s, n) => String(s).padStart(n);
    console.log(
      `${mode.padEnd(13)} | ${pad(modeTokens, 11)} | ${pad(saved, 12)} | ${pad(percent + '%', 8)}`
    );
  }

  console.log('\n💡 권장: 작업 유형에 맞는 Context Mode 사용\n');

  // 누적 데이터 출력
  if (fs.existsSync(LOG_FILE)) {
    const data = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
    if (data.summary && Object.keys(data.summary).length > 0) {
      console.log('📈 누적 사용량:');
      for (const [mode, stats] of Object.entries(data.summary)) {
        console.log(`   ${mode}: ${stats.count}회, 총 ${stats.totalSaved} 토큰 절감`);
      }
      console.log('');
    }
  }
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

if (command === 'log') {
  const mode = args[1] || 'Coding';
  const sessionId = args[2];
  const entry = logUsage(mode, sessionId);
  console.log(`✅ 로그 기록: ${mode} 모드, ${entry.tokensSaved} 토큰 절감 (${entry.savingsPercent}%)`);
} else if (command === 'report') {
  printReport();
} else {
  console.log('Usage:');
  console.log('  node scripts/token-monitor.js report           # 토큰 리포트 출력');
  console.log('  node scripts/token-monitor.js log [mode] [id]  # 사용량 기록');
  console.log('');
  console.log('Modes: Planning, Coding, Review, Full');
  printReport();
}
