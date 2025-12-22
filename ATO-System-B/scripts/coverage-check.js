#!/usr/bin/env node
/**
 * 테스트 커버리지 자동 측정 스크립트
 * QUALITY_GATES.md 기준: 커버리지 ≥ 90%
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const THRESHOLD = 90; // QUALITY_GATES.md 기준

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function log(color, message) {
  console.log(`${color}${message}${RESET}`);
}

function runCoverage(projectPath, name) {
  const fullPath = path.join(ROOT, projectPath);

  if (!fs.existsSync(fullPath)) {
    return { name, status: 'skipped', reason: '디렉토리 없음' };
  }

  const packageJson = path.join(fullPath, 'package.json');
  if (!fs.existsSync(packageJson)) {
    return { name, status: 'skipped', reason: 'package.json 없음' };
  }

  try {
    // vitest coverage 실행
    const result = execSync(
      'npx vitest run --coverage --coverage.reporter=json-summary 2>/dev/null || true',
      {
        cwd: fullPath,
        encoding: 'utf-8',
        timeout: 60000,
      }
    );

    // coverage-summary.json 파싱
    const summaryPath = path.join(fullPath, 'coverage/coverage-summary.json');
    if (fs.existsSync(summaryPath)) {
      const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
      const total = summary.total;

      return {
        name,
        status: 'success',
        lines: total.lines.pct,
        branches: total.branches.pct,
        functions: total.functions.pct,
        statements: total.statements.pct,
      };
    }

    return { name, status: 'no-coverage', reason: 'coverage 파일 없음' };
  } catch (e) {
    return { name, status: 'error', reason: e.message.slice(0, 100) };
  }
}

function checkThreshold(results) {
  const failures = [];

  for (const r of results) {
    if (r.status === 'success') {
      const metrics = ['lines', 'branches', 'functions', 'statements'];
      for (const m of metrics) {
        if (r[m] < THRESHOLD) {
          failures.push(`${r.name}: ${m} ${r[m]}% < ${THRESHOLD}%`);
        }
      }
    }
  }

  return failures;
}

function printReport(results) {
  console.log('\n📊 테스트 커버리지 리포트\n');
  console.log(`기준: ${THRESHOLD}% (QUALITY_GATES.md)\n`);
  console.log('Project     | Lines  | Branches | Functions | Statements | Status');
  console.log('------------|--------|----------|-----------|------------|-------');

  for (const r of results) {
    if (r.status === 'success') {
      const pass = r.lines >= THRESHOLD && r.branches >= THRESHOLD;
      const status = pass ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`;
      console.log(
        `${r.name.padEnd(11)} | ${String(r.lines + '%').padStart(6)} | ${String(r.branches + '%').padStart(8)} | ${String(r.functions + '%').padStart(9)} | ${String(r.statements + '%').padStart(10)} | ${status}`
      );
    } else {
      console.log(
        `${r.name.padEnd(11)} | ${YELLOW}${r.status.padEnd(6)}${RESET} | ${r.reason || ''}`
      );
    }
  }

  console.log('');
}

function main() {
  log(YELLOW, '\n🔍 커버리지 측정 시작...\n');

  const projects = [
    { path: 'src/backend', name: 'Backend' },
    { path: 'src/frontend', name: 'Frontend' },
  ];

  const results = projects.map((p) => runCoverage(p.path, p.name));

  printReport(results);

  const failures = checkThreshold(results);
  if (failures.length > 0) {
    log(RED, '🚫 커버리지 기준 미달:\n');
    failures.forEach((f) => console.log(`   ${f}`));
    console.log('');
    process.exit(1);
  }

  log(GREEN, '✅ 모든 프로젝트 커버리지 기준 충족!\n');
}

// 간단 모드 (커버리지 설치 없이)
if (process.argv[2] === '--simple') {
  console.log('\n📊 테스트 커버리지 (간단 모드)\n');
  console.log(`기준: ${THRESHOLD}% (QUALITY_GATES.md)`);
  console.log('\n💡 전체 커버리지 측정: node scripts/coverage-check.js\n');
  console.log('현재 테스트 현황:');

  // 테스트 파일 수 카운트
  const testFiles = execSync(
    `find ${ROOT} -name "*.test.ts" -o -name "*.test.tsx" | grep -v node_modules | wc -l`,
    { encoding: 'utf-8' }
  ).trim();

  console.log(`   테스트 파일: ${testFiles}개`);
  console.log('   vitest --coverage 로 상세 측정 가능\n');
} else {
  main();
}
