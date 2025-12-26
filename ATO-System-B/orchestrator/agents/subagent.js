import path from 'path';
import { fileURLToPath } from 'url';
import { BaseAgent } from './base-agent.js';
import { CoderSkill } from '../skills/coder/index.js';
import { ReviewerSkill } from '../skills/reviewer/index.js'; // optional self-check
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

    const projectRoot = config.projectRoot || path.resolve(__dirname, '..');

    // Skills ownership
    this.coderSkill = new CoderSkill({ ...config, projectRoot });
    this.reviewerSkill = new ReviewerSkill({ ...config, projectRoot }); // optional sanity check

    // Security utilities
    this.sandbox = getSandbox(projectRoot);
    this.securityMonitor = getSecurityMonitor();

    this.projectRoot = projectRoot;
  }

  /**
   * Execute Phase C implementation for the given case/context.
   * @param {Object} context - { caseId, projectRoot, designDocs, taskId, ... }
   */
  async execute(context = {}) {
    const caseId = context.caseId || context.taskId;
    const projectRoot = context.projectRoot || this.projectRoot;

    if (!caseId) {
      throw new Error('SubAgent: caseId is required to execute Phase C.');
    }

    this.log(`🛠️  Starting Implementation Phase for case: ${caseId}...`);

    try {
      const handoffPath = path.join(projectRoot, 'docs', 'cases', caseId, 'HANDOFF.md');

      // Initialize coder skill if needed
      if (typeof this.coderSkill.initialize === 'function') {
        await this.coderSkill.initialize();
      }

      const codingResult = await this.coderSkill.execute(
        {
          handoffPath,
          caseId,
          designDocs: context.designDocs,
          options: { projectRoot }
        },
        context
      );

      if (!codingResult || codingResult.status === 'not_implemented') {
        throw new Error('Coding not implemented or returned empty result.');
      }

      if (codingResult.status && codingResult.status !== 'success') {
        throw new Error(codingResult.message || 'Coding failed.');
      }

      const fileCount = codingResult.files?.length || 0;
      this.log(`✅ Coding completed. Generated ${fileCount} file(s).`);

      return {
        success: true,
        status: 'success',
        files: codingResult.files || [],
        output: codingResult.output,
        metadata: {
          agent: 'SubAgent',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.log(`🚨 Phase C Failed: ${error.message}`);
      if (this.securityMonitor) {
        this.securityMonitor.recordEvent(EVENT_TYPES.AGENT_ERROR, {
          agent: 'SubAgent',
          error: error.message
        });
      }
      throw error;
    }
  }
}
