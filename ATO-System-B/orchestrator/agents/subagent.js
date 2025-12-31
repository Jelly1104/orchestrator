/**
 * SubAgent - Phase C Implementer (v3.4.0)
 *
 * 역할:
 * - CoderSkill을 소유하고 관리
 * - HANDOFF.md 로드 후 코드 생성 위임
 * - 생성된 코드 반환
 *
 * AGENT_ARCHITECTURE.md 규격 준수:
 * - SubAgent가 CoderSkill을 소유/관리
 * - Phase C 코드 생성 위임
 *
 * @version 3.4.0
 * @since 2025-12-26
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BaseAgent } from './base-agent.js';
import { CoderSkill } from '../tools/coder/index.js';
import { getSandbox } from '../security/sandbox.js';
import { getSecurityMonitor, EVENT_TYPES } from '../security/security-monitor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * SubAgent: Phase C Implementer
 * Owns CoderSkill and orchestrates code generation for a given case.
 */
export class SubAgent extends BaseAgent {
  constructor(config = {}) {
    super({
      ...config,
      name: 'SubAgent',
      role: 'Implementer',
      contextMode: 'Coding'
    });

    const projectRoot = config.projectRoot || path.resolve(__dirname, '../..');

    // Skills ownership
    this.coderSkill = new CoderSkill({
      ...config,
      projectRoot,
      provider: config.provider || 'anthropic',
      providerConfig: config.providerConfig || {}
    });

    // Security utilities
    this.sandbox = getSandbox({ projectRoot });
    this.securityMonitor = getSecurityMonitor();

    this.projectRoot = projectRoot;
    this.initialized = false;
  }

  /**
   * 초기화
   */
  async initialize() {
    if (this.initialized) return this;

    this.log('Initializing SubAgent v3.4.0...');

    // CoderSkill 초기화
    await this.coderSkill.initialize();

    this.initialized = true;
    this.log('SubAgent initialized');
    return this;
  }

  /**
   * Execute Phase C implementation for the given case/context.
   * @param {Object} context - { caseId, handoff, designDocs, taskId, ... }
   */
  async execute(context = {}) {
    const caseId = context.caseId || context.taskId;
    const projectRoot = context.projectRoot || this.projectRoot;

    this.log(`🛠️  Starting Implementation Phase for case: ${caseId || 'unknown'}...`);

    try {
      // 초기화 확인
      if (!this.initialized) {
        await this.initialize();
      }

      // HANDOFF 로드: context에서 직접 전달받거나 파일에서 읽기
      let handoff = context.handoff;

      if (!handoff && caseId) {
        const handoffPath = path.join(projectRoot, 'docs', 'cases', caseId, 'HANDOFF.md');
        if (fs.existsSync(handoffPath)) {
          handoff = fs.readFileSync(handoffPath, 'utf-8');
          this.log(`Loaded HANDOFF from: ${handoffPath}`);
        } else {
          throw new Error(`HANDOFF.md not found at: ${handoffPath}`);
        }
      }

      if (!handoff) {
        throw new Error('SubAgent: handoff is required to execute Phase C.');
      }

      // CoderSkill 호출
      const codingResult = await this.coderSkill.execute({
        handoff,
        designDocs: context.designDocs || {},
        options: { projectRoot }
      });

      if (!codingResult || !codingResult.success) {
        throw new Error(codingResult?.message || 'Coding failed.');
      }

      const fileCount = Object.keys(codingResult.files || {}).length;
      this.success(`Coding completed. Generated ${fileCount} file(s).`);

      // 생성된 파일 로그
      for (const filePath of Object.keys(codingResult.files || {})) {
        this.log(`  Generated: ${filePath}`);
      }

      return {
        success: true,
        status: 'success',
        files: codingResult.files || {},
        report: codingResult.report || '',
        provider: codingResult.provider,
        usage: codingResult.usage || { inputTokens: 0, outputTokens: 0 },
        metadata: {
          agent: 'SubAgent',
          caseId,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.error(`Phase C Failed: ${error.message}`);
      if (this.securityMonitor) {
        this.securityMonitor.report(EVENT_TYPES.AGENT_ERROR, {
          agent: 'SubAgent',
          error: error.message
        });
      }
      return {
        success: false,
        status: 'fail',
        error: error.message,
        metadata: {
          agent: 'SubAgent',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * 파일 목록을 Output 형식으로 변환
   * @param {Object} files - { filename: content } 형태
   * @returns {Array} - Output 배열
   */
  filesToOutputs(files) {
    if (!files || typeof files !== 'object') return [];

    return Object.entries(files).map(([filename, content]) => ({
      filename,
      content,
      type: this._inferFileType(filename)
    }));
  }

  /**
   * 파일 타입 추론
   */
  _inferFileType(filename) {
    if (filename.endsWith('.md')) return 'markdown';
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'typescript';
    if (filename.endsWith('.js') || filename.endsWith('.jsx')) return 'javascript';
    if (filename.endsWith('.sql')) return 'sql';
    return 'text';
  }

  /**
   * Output 검증
   * @param {Array} outputs - Output 배열
   * @param {Object} gapCheck - PRD Gap Check 결과
   * @returns {Object} - 검증 결과
   */
  validateOutputs(outputs, gapCheck) {
    const deliverables = gapCheck?.deliverables || [];
    const total = deliverables.length;

    // 간단한 매칭: 파일 개수 기준
    const matched = Math.min(outputs.length, total);

    return {
      passed: outputs.length > 0,
      prdMatch: {
        total,
        matched,
        missing: deliverables.slice(matched).map(d => d.item || d)
      },
      syntaxErrors: [],
      schemaErrors: []
    };
  }

  /**
   * 파일 저장
   * @param {Object} files - { path: content } 형태
   * @param {string} baseDir - 기본 디렉토리
   */
  async saveFiles(files, baseDir = '') {
    const savedFiles = [];

    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = path.join(this.projectRoot, baseDir, filePath);
      const dir = path.dirname(fullPath);

      // 디렉토리 생성
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 파일 저장
      fs.writeFileSync(fullPath, content, 'utf-8');
      savedFiles.push(fullPath);
      this.log(`Saved: ${filePath}`);
    }

    this.success(`Saved ${savedFiles.length} file(s) to disk`);
    return savedFiles;
  }
}

export default SubAgent;
