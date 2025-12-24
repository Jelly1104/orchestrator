/**
 * CoderSkill - 설계 문서 기반 코드 구현 전문가
 *
 * 기존 agents/code-agent.js 구현체를 래핑하여 SkillRegistry 호환
 *
 * @version 1.3.0
 * @since 2025-12-19
 * @updated 2025-12-24 - 네이밍 리팩토링 (CodeAgentSkill → CoderSkill)
 */

import { CodeAgent } from '../../agents/code-agent.js';
import { SkillLoader } from '../skill-loader.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * CoderSkill 클래스
 *
 * SkillRegistry와 호환되는 인터페이스 제공
 */
export class CoderSkill {
  constructor(config = {}) {
    this.projectRoot = config.projectRoot || process.cwd();
    this.skillLoader = new SkillLoader(path.join(__dirname, '..'));
    this.skill = null;

    // 실제 구현체 인스턴스
    this.agent = new CodeAgent({
      projectRoot: this.projectRoot,
      ...config
    });
  }

  /**
   * 초기화 - SKILL.md 로드
   */
  async initialize() {
    this.skill = await this.skillLoader.loadSkill('coder');
    console.log('[CoderSkill] Initialized with SKILL.md v1.3.0');
    return this;
  }

  /**
   * 코드 구현 (메인 기능)
   * @param {Object} designDocs - 설계 문서 { sdd, wireframe, ia, handoff }
   * @param {Object} options - 추가 옵션
   * @returns {Promise<Object>} - { files, report, usage }
   */
  async implement(designDocs, options = {}) {
    return await this.agent.implement(designDocs, options);
  }

  /**
   * 수정 요청 처리 (Review FAIL 시)
   * @param {string} feedback - 피드백
   * @param {Object} previousFiles - 이전에 생성한 파일들
   * @returns {Promise<Object>} - { files, report, usage }
   */
  async revise(feedback, previousFiles) {
    return await this.agent.revise(feedback, previousFiles);
  }

  /**
   * 파일 저장
   * @param {Object} files - { path: content } 형태
   * @param {string} baseDir - 기본 디렉토리
   */
  async saveFiles(files, baseDir = '') {
    return await this.agent.saveFiles(files, baseDir);
  }

  /**
   * 스킬 메타데이터 반환
   */
  getMetadata() {
    return {
      name: 'code-agent',
      version: '1.2.0',
      description: '설계 문서 기반 코드 구현 전문가 (TDD 기반)',
      capabilities: [
        '설계 문서 해석',
        'Backend API 구현 (Node.js/Express)',
        'Frontend 컴포넌트 구현 (React/TypeScript)',
        '테스트 코드 작성',
        '보안 검증 (SQL Injection, XSS 방지)'
      ],
      inputFormat: {
        sdd: 'SDD.md 내용',
        wireframe: 'Wireframe.md 내용',
        ia: 'IA.md 내용 (선택)',
        handoff: 'HANDOFF 문서 내용'
      },
      outputFormat: {
        files: '{ "path/to/file.ts": "content" }',
        report: 'Markdown 형식의 구현 보고서',
        tokens: '{ input, output, total }'
      }
    };
  }
}

/**
 * SkillRegistry 호환 팩토리
 */
export default {
  /**
   * CodeAgent 인스턴스 생성
   * @param {Object} config - 설정
   * @returns {CodeAgentSkill}
   */
  create: (config = {}) => new CodeAgentSkill(config),

  /**
   * 스킬 메타데이터
   */
  meta: {
    name: 'code-agent',
    version: '1.2.0',
    description: '설계 문서 기반 코드 구현 전문가 (TDD 기반)',
    category: 'implementation',
    dependencies: ['SkillLoader', 'ProviderFactory'],
    author: 'ATO-System-B',
    status: 'active'
  }
};

// Named export for SkillRegistry compatibility
// SkillRegistry가 "CodeAgent"를 찾으면 CodeAgentSkill이 로딩되도록 alias 설정
export { CodeAgentSkill as CodeAgent };
