#!/usr/bin/env node
/**
 * .clinerules 위반 검증 스크립트
 * pre-commit hook에서 실행됨
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const STATE_FILE = path.join(ROOT, '.claude/state/handoff-status.json');
const GLOBAL_DIR = path.join(ROOT, '.claude/global');

// 색상 코드
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function log(color, message) {
  console.log(`${color}${message}${RESET}`);
}

function getChangedFiles() {
  const { execSync } = require('child_process');
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function checkGlobalFilesModified(files) {
  const violations = [];

  for (const file of files) {
    if (file.startsWith('.claude/global/')) {
      violations.push(`🔴 VIOLATION: .claude/global/ 파일 수정 금지 - ${file}`);
    }
    if (file === 'CLAUDE.md') {
      violations.push(`🔴 VIOLATION: CLAUDE.md 수정 금지`);
    }
  }

  return violations;
}

function checkHandoffStatus() {
  const warnings = [];

  if (!fs.existsSync(STATE_FILE)) {
    warnings.push(`⚠️  WARNING: 상태 파일 없음 - ${STATE_FILE}`);
    return warnings;
  }

  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));

    if (state.currentHandoff) {
      const { status, violations, errors } = state.currentHandoff;

      if (status === 'failed') {
        warnings.push(`🔴 BLOCKED: Handoff 상태가 failed입니다`);
      }

      if (violations && violations.length > 0) {
        violations.forEach(v => warnings.push(`🔴 VIOLATION: ${v}`));
      }

      if (errors && errors.length > 0) {
        errors.forEach(e => warnings.push(`⚠️  ERROR: ${e}`));
      }
    }
  } catch (e) {
    warnings.push(`⚠️  WARNING: 상태 파일 파싱 오류 - ${e.message}`);
  }

  return warnings;
}

function checkEnvHardcoded(files) {
  const violations = [];
  const envPattern = /(['"])(DB_PASSWORD|API_KEY|SECRET|PRIVATE_KEY|TOKEN)=.+\1/gi;

  for (const file of files) {
    if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
      const filePath = path.join(ROOT, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (envPattern.test(content)) {
          violations.push(`🔴 VIOLATION: 환경변수 하드코딩 감지 - ${file}`);
        }
      }
    }
  }

  return violations;
}

function main() {
  log(YELLOW, '\n🔍 .clinerules 검증 시작...\n');

  const changedFiles = getChangedFiles();
  const allViolations = [];
  const allWarnings = [];

  // 1. Global 파일 수정 검사
  allViolations.push(...checkGlobalFilesModified(changedFiles));

  // 2. Handoff 상태 검사
  const statusWarnings = checkHandoffStatus();
  statusWarnings.forEach(w => {
    if (w.includes('VIOLATION') || w.includes('BLOCKED')) {
      allViolations.push(w);
    } else {
      allWarnings.push(w);
    }
  });

  // 3. 환경변수 하드코딩 검사
  allViolations.push(...checkEnvHardcoded(changedFiles));

  // 결과 출력
  if (allWarnings.length > 0) {
    log(YELLOW, '⚠️  Warnings:');
    allWarnings.forEach(w => console.log(`   ${w}`));
    console.log('');
  }

  if (allViolations.length > 0) {
    log(RED, '🚫 .clinerules 위반 감지! Commit 차단됨.\n');
    allViolations.forEach(v => console.log(`   ${v}`));
    console.log('');
    log(RED, '위반사항을 수정한 후 다시 시도하세요.\n');
    process.exit(1);
  }

  log(GREEN, '✅ .clinerules 검증 통과!\n');
  process.exit(0);
}

main();
