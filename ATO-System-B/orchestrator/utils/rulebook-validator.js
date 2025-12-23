/**
 * RulebookValidator - 룰북 무결성 검증
 *
 * 보안 기능 (v3.2.0 P2, Constitution 체계 v4.0.0):
 * - .claude/rules/*, .claude/workflows/*, .claude/context/* 파일 해시 체크
 * - 무결성 위반 감지
 * - 변조 방지
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// 보호 대상 파일 목록 (Constitution 체계 v4.0.0)
const PROTECTED_FILES = [
  // 00. Constitution (절대 불변)
  'CLAUDE.md',
  '.claude/SYSTEM_MANIFEST.md',
  '.claude/rules/DOMAIN_SCHEMA.md',
  // 01. Rules (통제된 변경)
  '.claude/rules/CODE_STYLE.md',
  '.claude/rules/TDD_WORKFLOW.md',
  '.claude/rules/VALIDATION_GUIDE.md',
  '.claude/rules/ANALYSIS_GUIDE.md',
  // 02. Workflows
  '.claude/workflows/AGENT_ARCHITECTURE.md',
  '.claude/workflows/DOCUMENT_PIPELINE.md',
  '.claude/workflows/PRD_GUIDE.md',
  // 03. Context
  '.claude/context/AI_Playbook.md',
  // 기타
  '.clinerules',
];

export class RulebookValidator {
  constructor(config = {}) {
    this.projectRoot = config.projectRoot || process.cwd();
    this.hashFile = config.hashFile || '.claude/integrity.json';
    this.algorithm = config.algorithm || 'sha256';
  }

  /**
   * 파일 해시 계산
   */
  calculateHash(filePath) {
    const fullPath = path.join(this.projectRoot, filePath);

    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    return crypto.createHash(this.algorithm).update(content).digest('hex');
  }

  /**
   * 모든 보호 파일의 해시 계산
   */
  calculateAllHashes() {
    const hashes = {};

    for (const file of PROTECTED_FILES) {
      const hash = this.calculateHash(file);
      if (hash) {
        hashes[file] = {
          hash,
          algorithm: this.algorithm,
          timestamp: new Date().toISOString(),
        };
      }
    }

    return hashes;
  }

  /**
   * 해시 파일 저장 (초기화 또는 업데이트)
   */
  saveHashes() {
    const hashes = this.calculateAllHashes();
    const fullPath = path.join(this.projectRoot, this.hashFile);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const data = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      algorithm: this.algorithm,
      files: hashes,
    };

    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[RulebookValidator] Saved hashes to ${this.hashFile}`);

    return data;
  }

  /**
   * 저장된 해시 로드
   */
  loadHashes() {
    const fullPath = path.join(this.projectRoot, this.hashFile);

    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * 무결성 검증
   * @returns {Object} - { valid: boolean, violations: Array, missing: Array }
   */
  validate() {
    const stored = this.loadHashes();

    if (!stored) {
      return {
        valid: false,
        error: 'No integrity file found. Run saveHashes() first.',
        violations: [],
        missing: PROTECTED_FILES,
      };
    }

    const violations = [];
    const missing = [];
    const verified = [];

    for (const file of PROTECTED_FILES) {
      const currentHash = this.calculateHash(file);
      const storedData = stored.files[file];

      if (!currentHash) {
        missing.push(file);
        continue;
      }

      if (!storedData) {
        violations.push({
          file,
          type: 'NEW_FILE',
          message: `File exists but not in integrity record`,
        });
        continue;
      }

      if (currentHash !== storedData.hash) {
        violations.push({
          file,
          type: 'HASH_MISMATCH',
          expected: storedData.hash,
          actual: currentHash,
          message: `File has been modified since ${storedData.timestamp}`,
        });
      } else {
        verified.push(file);
      }
    }

    const valid = violations.length === 0;

    return {
      valid,
      verified,
      violations,
      missing,
      summary: {
        total: PROTECTED_FILES.length,
        verified: verified.length,
        violated: violations.length,
        missing: missing.length,
      },
    };
  }

  /**
   * 무결성 검증 및 로그 출력
   */
  validateAndReport() {
    const result = this.validate();

    console.log('\n📋 Rulebook Integrity Check');
    console.log('='.repeat(40));

    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
      return result;
    }

    console.log(`✅ Verified: ${result.summary.verified}/${result.summary.total}`);

    if (result.violations.length > 0) {
      console.log(`\n⚠️  Violations (${result.violations.length}):`);
      for (const v of result.violations) {
        console.log(`   - ${v.file}: ${v.type}`);
        if (v.type === 'HASH_MISMATCH') {
          console.log(`     Expected: ${v.expected.substring(0, 16)}...`);
          console.log(`     Actual:   ${v.actual.substring(0, 16)}...`);
        }
      }
    }

    if (result.missing.length > 0) {
      console.log(`\n📁 Missing (${result.missing.length}):`);
      for (const m of result.missing) {
        console.log(`   - ${m}`);
      }
    }

    console.log('='.repeat(40));
    console.log(result.valid ? '✅ All checks passed' : '❌ Integrity check failed');

    return result;
  }
}

export { PROTECTED_FILES };
export default RulebookValidator;
