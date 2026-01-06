/**
 * CodeAgent - CoderTool 래퍼 (v3.0.x)
 *
 * 기존 레거시 code-agent.legacy.js 의존성을 제거하고
 * tools/coder의 CoderTool을 직접 위임합니다.
 * (tests에서 요구하는 extractFiles/sanitizeInput/validateOutput 등을
 *  호환용으로 노출)
 */

import { CoderTool } from '../tools/coder/index.js';

export class CodeAgent {
  constructor(config = {}) {
    this.projectRoot = config.projectRoot || process.cwd();
    this.config = { ...config, projectRoot: this.projectRoot };
    this.tool = new CoderTool(this.config);
    this.initialized = false;
  }

  async _ensureInitialized() {
    if (this.initialized) return;
    if (typeof this.tool.initialize === 'function') {
      await this.tool.initialize();
    }
    this.initialized = true;
  }

  /**
   * 코드 구현
   * @param {Object} context - {handoff, sdd, wireframe, ia, ...}
   */
  async implement(context = {}) {
    await this._ensureInitialized();
    const { handoff, sdd, wireframe, ia, options = {} } = context;
    const designDocs = { sdd, wireframe, ia };
    return this.tool.execute({ handoff, designDocs, options });
  }

  /**
   * 코드 수정 (피드백 반영)
   */
  async revise(feedback, currentFiles) {
    await this._ensureInitialized();
    return this.tool.revise(feedback, currentFiles);
  }

  /**
   * 파일 저장
   */
  async saveFiles(files) {
    await this._ensureInitialized();
    return this.tool.saveFiles(files);
  }

  // ── 호환용 유틸 (tests 및 기존 호출부 대응) ──
  extractFiles(content) {
    return typeof this.tool._extractFiles === 'function'
      ? this.tool._extractFiles(content)
      : {};
  }

  extractTag(content, tagName) {
    return typeof this.tool._extractTag === 'function'
      ? this.tool._extractTag(content, tagName)
      : '';
  }

  sanitizeInput(input, maxLength = 50000) {
    return typeof this.tool._sanitizeInput === 'function'
      ? this.tool._sanitizeInput(input, maxLength)
      : input;
  }

  validateOutput(files) {
    return typeof this.tool._validateOutput === 'function'
      ? this.tool._validateOutput(files)
      : files;
  }
}

export default CodeAgent;
