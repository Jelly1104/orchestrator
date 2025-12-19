/**
 * SkillLoader - Skills 기반 Agent 전문화를 위한 동적 로더
 *
 * Anthropic Skills 아키텍처 기반:
 * - SKILL.md: Agent 역할 정의
 * - resources/: 참조 문서
 *
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

export class SkillLoader {
  /**
   * @param {string} skillsRoot - skills 폴더 루트 경로
   */
  constructor(skillsRoot = null) {
    this.skillsRoot = skillsRoot || path.join(__dirname);
    this.cache = new Map();
  }

  /**
   * 특정 Agent의 Skill을 로드
   * Security Layer 연동 (Phase D)
   * @param {string} agentName - Agent 이름 (예: 'query-agent')
   * @returns {Promise<{skillMd: string, resources: Object}>}
   */
  async loadSkill(agentName) {
    // 캐시 확인
    if (this.cache.has(agentName)) {
      return this.cache.get(agentName);
    }

    const skillPath = path.join(this.skillsRoot, agentName);

    // Path Validation (Phase D)
    if (isEnabled('SECURITY_PATH_VALIDATION')) {
      const pathValidator = getPathValidator();
      const validateResult = pathValidator.validateDocumentPath(skillPath);
      if (!validateResult.valid) {
        const logger = getAuditLogger();
        logger.security('SKILL_PATH_VALIDATION_FAIL', `Invalid skill path: ${agentName}`, {
          violations: validateResult.violations,
        });
        throw new Error(`[SECURITY] Invalid skill path: ${agentName}`);
      }
    }

    // SKILL.md 로드
    const skillMdPath = path.join(skillPath, 'SKILL.md');
    let skillMd = '';

    try {
      skillMd = await fs.readFile(skillMdPath, 'utf-8');
    } catch (error) {
      console.warn(`[SkillLoader] SKILL.md not found for ${agentName}: ${error.message}`);
      skillMd = `# ${agentName}\n\n기본 Agent 역할입니다.`;
    }

    // resources 로드
    const resourcesPath = path.join(skillPath, 'resources');
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
      console.warn(`[SkillLoader] resources not found for ${agentName}: ${error.message}`);
    }

    const skill = { skillMd, resources };

    // 캐시 저장
    this.cache.set(agentName, skill);

    return skill;
  }

  /**
   * Skill을 System Prompt로 변환
   * @param {Object} skill - loadSkill() 반환값
   * @param {Object} options - 추가 옵션
   * @returns {string} System Prompt
   */
  buildSystemPrompt(skill, options = {}) {
    let prompt = skill.skillMd + '\n\n';

    // resources가 있으면 추가
    if (Object.keys(skill.resources).length > 0) {
      prompt += '---\n\n## Available Resources\n\n';
      prompt += '아래 문서들을 참조하여 작업을 수행하세요:\n\n';

      for (const [name, content] of Object.entries(skill.resources)) {
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
   * 모든 사용 가능한 Skills 목록 반환
   * @returns {Promise<string[]>}
   */
  async listAvailableSkills() {
    const skills = [];

    try {
      const entries = await fs.readdir(this.skillsRoot, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== 'resources') {
          const skillMdPath = path.join(this.skillsRoot, entry.name, 'SKILL.md');
          const exists = await fs.stat(skillMdPath).then(() => true).catch(() => false);

          if (exists) {
            skills.push(entry.name);
          }
        }
      }
    } catch (error) {
      console.error(`[SkillLoader] Failed to list skills: ${error.message}`);
    }

    return skills;
  }

  /**
   * Skill 메타데이터 추출
   * @param {string} agentName - Agent 이름
   * @returns {Promise<Object>}
   */
  async getSkillMetadata(agentName) {
    const skill = await this.loadSkill(agentName);

    // SKILL.md에서 메타데이터 추출
    const metadata = {
      name: agentName,
      version: '1.0.0',
      capabilities: [],
      constraints: []
    };

    // 버전 추출
    const versionMatch = skill.skillMd.match(/\*\*버전\*\*:\s*(\d+\.\d+\.\d+)/);
    if (versionMatch) {
      metadata.version = versionMatch[1];
    }

    // Capabilities 추출
    const capSection = skill.skillMd.match(/## Capabilities[\s\S]*?(?=##|$)/);
    if (capSection) {
      const caps = capSection[0].match(/- \*\*([^*]+)\*\*/g);
      if (caps) {
        metadata.capabilities = caps.map(c => c.replace(/- \*\*|\*\*/g, ''));
      }
    }

    // Constraints 추출
    const constSection = skill.skillMd.match(/## Constraints[\s\S]*?(?=##|$)/);
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

// 싱글톤 인스턴스
let defaultLoader = null;

/**
 * 기본 SkillLoader 인스턴스 반환
 * @returns {SkillLoader}
 */
export function getDefaultSkillLoader() {
  if (!defaultLoader) {
    defaultLoader = new SkillLoader();
  }
  return defaultLoader;
}

export default SkillLoader;
