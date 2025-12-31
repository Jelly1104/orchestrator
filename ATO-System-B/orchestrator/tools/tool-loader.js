/**
 * ToolLoader - Tools 기반 Agent 전문화를 위한 동적 로더
 *
 * Anthropic Skills 아키텍처 기반:
 * - TOOL.md: Agent 역할 정의
 * - resources/: 참조 문서
 *
 * @version 2.0.0
 * @updated 2025-12-29 - Skill → Tool 리네이밍
 * @see https://github.com/anthropics/skills
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { isEnabled } from '../config/feature-flags.js';
import { getPathValidator } from '../security/path-validator.js';
import { getAuditLogger } from '../utils/audit-logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ToolLoader {
  /**
   * @param {string} toolsRoot - tools 폴더 루트 경로
   */
  constructor(toolsRoot = null) {
    this.toolsRoot = toolsRoot || path.join(__dirname);
    this.cache = new Map();
  }

  /**
   * 특정 Agent의 Tool을 로드
   * Security Layer 연동 (Phase D)
   * @param {string} agentName - Agent 이름 (예: 'query-agent')
   * @returns {Promise<{toolMd: string, resources: Object}>}
   */
  async loadTool(agentName) {
    // 캐시 확인
    if (this.cache.has(agentName)) {
      return this.cache.get(agentName);
    }

    const toolPath = path.join(this.toolsRoot, agentName);

    // Path Validation (Phase D) - 내부 시스템 경로용 검증 사용
    if (isEnabled('SECURITY_PATH_VALIDATION')) {
      const pathValidator = getPathValidator();
      // Tools는 내부 시스템 경로이므로 validateInternalPath() 사용
      // 프로젝트 루트 기준으로 상대 경로 계산 (process.cwd()는 orchestrator/ 내부일 수 있음)
      const projectRoot = path.resolve(__dirname, '../..');
      const relativePath = path.relative(projectRoot, toolPath).replace(/\\/g, '/');
      const validateResult = pathValidator.validateInternalPath(relativePath);
      if (!validateResult.valid) {
        const logger = getAuditLogger();
        logger.security('TOOL_PATH_VALIDATION_FAIL', `Invalid tool path: ${agentName}`, {
          path: relativePath,
          error: validateResult.error,
        });
        throw new Error(`[SECURITY] Invalid tool path: ${agentName}`);
      }
    }

    // TOOL.md 로드 (하위 호환: SKILL.md도 지원)
    const toolMdPath = path.join(toolPath, 'TOOL.md');
    const skillMdPath = path.join(toolPath, 'SKILL.md');
    let toolMd = '';

    try {
      toolMd = await fs.readFile(toolMdPath, 'utf-8');
    } catch (error) {
      // SKILL.md 폴백 (하위 호환)
      try {
        toolMd = await fs.readFile(skillMdPath, 'utf-8');
      } catch (fallbackError) {
        // TOOL.md가 없는 것은 정상 동작 - 경고 제거
        toolMd = `# ${agentName}\n\n기본 Tool 역할입니다.`;
      }
    }

    // resources 로드
    const resourcesPath = path.join(toolPath, 'resources');
    const resources = {};

    try {
      const resourcesExist = await fs.stat(resourcesPath).then(() => true).catch(() => false);

      if (resourcesExist) {
        const files = await fs.readdir(resourcesPath);

        for (const file of files) {
          if (file.endsWith('.md') || file.endsWith('.json') || file.endsWith('.txt')) {
            const content = await fs.readFile(
              path.join(resourcesPath, file),
              'utf-8'
            );
            resources[file] = content;
          }
        }
      }
    } catch (error) {
      // resources가 없는 것은 정상 동작
    }

    const tool = { toolMd, resources };

    // 캐시 저장
    this.cache.set(agentName, tool);

    return tool;
  }

  /**
   * Tool을 System Prompt로 변환
   * @param {Object} tool - loadTool() 반환값
   * @param {Object} options - 추가 옵션
   * @returns {string} System Prompt
   */
  buildSystemPrompt(tool, options = {}) {
    let prompt = tool.toolMd + '\n\n';

    // resources가 있으면 추가
    if (Object.keys(tool.resources).length > 0) {
      prompt += '---\n\n## Available Resources\n\n';
      prompt += '아래 문서들을 참조하여 작업을 수행하세요:\n\n';

      for (const [name, content] of Object.entries(tool.resources)) {
        // 파일 크기 제한 (토큰 절약)
        const truncatedContent = content.length > 10000
          ? content.substring(0, 10000) + '\n\n... (truncated)'
          : content;

        prompt += `### ${name}\n\n`;
        prompt += '```\n' + truncatedContent + '\n```\n\n';
      }
    }

    // 추가 컨텍스트
    if (options.additionalContext) {
      prompt += '---\n\n## Additional Context\n\n';
      prompt += options.additionalContext + '\n\n';
    }

    return prompt;
  }

  /**
   * 모든 사용 가능한 Tools 목록 반환
   * @returns {Promise<string[]>}
   */
  async listAvailableTools() {
    const tools = [];

    try {
      const entries = await fs.readdir(this.toolsRoot, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== 'resources') {
          const toolMdPath = path.join(this.toolsRoot, entry.name, 'TOOL.md');
          const skillMdPath = path.join(this.toolsRoot, entry.name, 'SKILL.md');
          const existsTool = await fs.stat(toolMdPath).then(() => true).catch(() => false);
          const existsSkill = await fs.stat(skillMdPath).then(() => true).catch(() => false);

          if (existsTool || existsSkill) {
            tools.push(entry.name);
          }
        }
      }
    } catch (error) {
      // 조용히 실패
    }

    return tools;
  }

  /**
   * Tool 메타데이터 추출
   * @param {string} agentName - Agent 이름
   * @returns {Promise<Object>}
   */
  async getToolMetadata(agentName) {
    const tool = await this.loadTool(agentName);

    // TOOL.md에서 메타데이터 추출
    const metadata = {
      name: agentName,
      version: '1.0.0',
      capabilities: [],
      constraints: []
    };

    // 버전 추출
    const versionMatch = tool.toolMd.match(/\*\*버전\*\*:\s*(\d+\.\d+\.\d+)/);
    if (versionMatch) {
      metadata.version = versionMatch[1];
    }

    // Capabilities 추출
    const capSection = tool.toolMd.match(/## Capabilities[\s\S]*?(?=##|$)/);
    if (capSection) {
      const caps = capSection[0].match(/- \*\*([^*]+)\*\*/g);
      if (caps) {
        metadata.capabilities = caps.map(c => c.replace(/- \*\*|\*\*/g, ''));
      }
    }

    // Constraints 추출
    const constSection = tool.toolMd.match(/## Constraints[\s\S]*?(?=##|$)/);
    if (constSection) {
      const consts = constSection[0].match(/- \*\*([^*]+)\*\*/g);
      if (consts) {
        metadata.constraints = consts.map(c => c.replace(/- \*\*|\*\*/g, ''));
      }
    }

    return metadata;
  }

  /**
   * 캐시 초기화
   */
  clearCache() {
    this.cache.clear();
  }
}

// 하위 호환: SkillLoader 별칭
export const SkillLoader = ToolLoader;

// 싱글톤 인스턴스
let defaultLoader = null;

/**
 * 기본 ToolLoader 인스턴스 반환
 * @returns {ToolLoader}
 */
export function getDefaultToolLoader() {
  if (!defaultLoader) {
    defaultLoader = new ToolLoader();
  }
  return defaultLoader;
}

// 하위 호환
export const getDefaultSkillLoader = getDefaultToolLoader;

export default ToolLoader;
