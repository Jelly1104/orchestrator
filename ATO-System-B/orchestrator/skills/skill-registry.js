/**
 * SkillRegistry - 스킬 중앙 관리 레지스트리
 *
 * Phase 3: Skill-Centric Architecture 핵심 컴포넌트
 *
 * 역할:
 * - 모든 스킬(Agent)의 등록 및 관리
 * - 의존성 주입(DI) 패턴을 통한 에이전트 생성
 * - 동적 스킬 로딩 및 초기화
 * - 스킬 메타데이터 조회
 *
 * @see SKILL_CENTRIC_REFACTORING_PLAN.md
 * @version 1.0.0
 * @since 2025-12-22
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { SkillLoader, getDefaultSkillLoader } from './skill-loader.js';
import { getAuditLogger } from '../utils/audit-logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 스킬 유형 정의
 */
export const SkillType = {
  QUERY: 'query-agent',
  CODE: 'code-agent',
  DESIGN: 'design-agent',
  DOC: 'doc-agent',
  PROFILE: 'profile-agent',
  REVIEW: 'review-agent',
  VIEWER: 'viewer-agent',
};

/**
 * 스킬 상태 정의
 */
export const SkillStatus = {
  UNLOADED: 'UNLOADED',
  LOADING: 'LOADING',
  READY: 'READY',
  ERROR: 'ERROR',
};

export class SkillRegistry {
  /**
   * @param {Object} config - 설정
   * @param {string} config.projectRoot - 프로젝트 루트 경로
   * @param {Object} config.providerConfig - LLM Provider 설정
   */
  constructor(config = {}) {
    this.projectRoot = config.projectRoot || process.cwd();
    this.providerConfig = config.providerConfig || {};
    this.skillsRoot = path.join(__dirname);

    // 스킬 저장소
    this.skills = new Map();

    // 에이전트 인스턴스 캐시
    this.agentCache = new Map();

    // SkillLoader 인스턴스
    this.skillLoader = getDefaultSkillLoader();

    // 로거
    this.logger = getAuditLogger();

    // 초기화 상태
    this.initialized = false;
  }

  /**
   * 모든 스킬 일괄 로드
   * @param {string[]} skillTypes - 로드할 스킬 목록 (기본: 전체)
   * @returns {Promise<Object>} 로드 결과
   */
  async loadAll(skillTypes = null) {
    const targetSkills = skillTypes || Object.values(SkillType);
    const results = {
      success: [],
      failed: [],
      total: targetSkills.length,
    };

    console.log(`[SkillRegistry] Loading ${targetSkills.length} skills...`);

    for (const skillType of targetSkills) {
      try {
        await this.loadSkill(skillType);
        results.success.push(skillType);
      } catch (error) {
        console.error(`[SkillRegistry] Failed to load ${skillType}: ${error.message}`);
        results.failed.push({ skill: skillType, error: error.message });
      }
    }

    this.initialized = true;

    console.log(`[SkillRegistry] Loaded ${results.success.length}/${results.total} skills`);
    if (results.failed.length > 0) {
      console.warn(`[SkillRegistry] Failed skills: ${results.failed.map(f => f.skill).join(', ')}`);
    }

    this.logger.info('SKILL_REGISTRY_LOADED', `Loaded ${results.success.length} skills`, {
      success: results.success,
      failed: results.failed.map(f => f.skill),
    });

    return results;
  }

  /**
   * 개별 스킬 로드
   * @param {string} skillType - 스킬 유형
   * @returns {Promise<Object>} 스킬 정보
   */
  async loadSkill(skillType) {
    // 이미 로드된 경우
    if (this.skills.has(skillType) && this.skills.get(skillType).status === SkillStatus.READY) {
      return this.skills.get(skillType);
    }

    // 상태 업데이트
    this.skills.set(skillType, {
      type: skillType,
      status: SkillStatus.LOADING,
      loadedAt: null,
      metadata: null,
      AgentClass: null,
    });

    try {
      // 1. SKILL.md 및 리소스 로드
      const skillData = await this.skillLoader.loadSkill(skillType);

      // 2. 메타데이터 추출
      const metadata = await this.skillLoader.getSkillMetadata(skillType);

      // 3. Agent 클래스 동적 로드 (존재하는 경우)
      let AgentClass = null;
      try {
        const indexPath = path.join(this.skillsRoot, skillType, 'index.js');
        const module = await import(indexPath);

        // 클래스 이름 추론 (예: review-agent → ReviewAgent)
        const className = skillType
          .split('-')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join('');

        AgentClass = module[className] || module.default;
      } catch {
        // index.js가 없는 스킬은 기본 프롬프트 기반으로 동작
        console.log(`[SkillRegistry] No index.js for ${skillType}, using prompt-based mode`);
      }

      // 4. 스킬 정보 저장
      const skillInfo = {
        type: skillType,
        status: SkillStatus.READY,
        loadedAt: new Date().toISOString(),
        metadata,
        skillData,
        AgentClass,
      };

      this.skills.set(skillType, skillInfo);

      console.log(`[SkillRegistry] Loaded: ${skillType} (v${metadata.version})`);

      return skillInfo;
    } catch (error) {
      this.skills.set(skillType, {
        type: skillType,
        status: SkillStatus.ERROR,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 에이전트 인스턴스 생성/조회
   * @param {string} skillType - 스킬 유형
   * @param {Object} config - 에이전트 설정 (옵션)
   * @returns {Promise<Object>} 에이전트 인스턴스
   */
  async getAgent(skillType, config = {}) {
    // 캐시 확인 (config가 없는 경우에만)
    const cacheKey = `${skillType}:${JSON.stringify(config)}`;
    if (Object.keys(config).length === 0 && this.agentCache.has(skillType)) {
      return this.agentCache.get(skillType);
    }

    // 스킬이 로드되지 않은 경우 로드
    if (!this.skills.has(skillType) || this.skills.get(skillType).status !== SkillStatus.READY) {
      await this.loadSkill(skillType);
    }

    const skillInfo = this.skills.get(skillType);

    // Agent 클래스가 있는 경우 인스턴스 생성
    if (skillInfo.AgentClass) {
      const agentConfig = {
        projectRoot: this.projectRoot,
        ...this.providerConfig,
        ...config,
      };

      const agent = new skillInfo.AgentClass(agentConfig);

      // initialize 메서드가 있으면 호출
      if (typeof agent.initialize === 'function') {
        await agent.initialize();
      }

      // 캐시 저장 (기본 설정인 경우만)
      if (Object.keys(config).length === 0) {
        this.agentCache.set(skillType, agent);
      }

      return agent;
    }

    // Agent 클래스가 없는 경우 프롬프트 기반 에이전트 반환
    return this._createPromptBasedAgent(skillType, skillInfo, config);
  }

  /**
   * 프롬프트 기반 에이전트 생성 (클래스가 없는 스킬용)
   * @private
   */
  _createPromptBasedAgent(skillType, skillInfo, config) {
    return {
      type: skillType,
      isPromptBased: true,
      systemPrompt: this.skillLoader.buildSystemPrompt(skillInfo.skillData),
      metadata: skillInfo.metadata,
      config: {
        projectRoot: this.projectRoot,
        ...this.providerConfig,
        ...config,
      },

      // 기본 인터페이스
      async execute(input) {
        console.warn(`[PromptBasedAgent:${skillType}] execute() requires LLM integration`);
        return {
          success: false,
          message: 'Prompt-based agent requires external LLM call',
          systemPrompt: this.systemPrompt,
          input,
        };
      },
    };
  }

  /**
   * 스킬 정보 조회
   * @param {string} skillType - 스킬 유형
   * @returns {Object|null} 스킬 정보
   */
  getSkillInfo(skillType) {
    return this.skills.get(skillType) || null;
  }

  /**
   * 로드된 모든 스킬 목록
   * @returns {Object[]} 스킬 목록
   */
  listLoadedSkills() {
    return Array.from(this.skills.entries())
      .filter(([, info]) => info.status === SkillStatus.READY)
      .map(([type, info]) => ({
        type,
        version: info.metadata?.version || '1.0.0',
        hasAgentClass: !!info.AgentClass,
        capabilities: info.metadata?.capabilities || [],
      }));
  }

  /**
   * 스킬 언로드
   * @param {string} skillType - 스킬 유형
   */
  unloadSkill(skillType) {
    this.skills.delete(skillType);
    this.agentCache.delete(skillType);
    console.log(`[SkillRegistry] Unloaded: ${skillType}`);
  }

  /**
   * 모든 스킬 언로드
   */
  unloadAll() {
    this.skills.clear();
    this.agentCache.clear();
    this.initialized = false;
    console.log('[SkillRegistry] All skills unloaded');
  }

  /**
   * 레지스트리 상태 조회
   * @returns {Object} 상태 정보
   */
  getStatus() {
    const loaded = Array.from(this.skills.values()).filter(s => s.status === SkillStatus.READY).length;
    const total = this.skills.size;

    return {
      initialized: this.initialized,
      loaded,
      total,
      skills: Array.from(this.skills.entries()).map(([type, info]) => ({
        type,
        status: info.status,
        version: info.metadata?.version,
      })),
    };
  }
}

// 싱글톤 인스턴스
let instance = null;

/**
 * SkillRegistry 싱글톤 인스턴스 반환
 * @param {Object} config - 설정 (최초 호출 시에만 적용)
 * @returns {SkillRegistry}
 */
export function getSkillRegistry(config = {}) {
  if (!instance) {
    instance = new SkillRegistry(config);
  }
  return instance;
}

/**
 * SkillRegistry 인스턴스 초기화 (테스트용)
 */
export function resetSkillRegistry() {
  if (instance) {
    instance.unloadAll();
    instance = null;
  }
}

export default SkillRegistry;
