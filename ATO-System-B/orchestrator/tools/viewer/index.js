/**
 * ViewerSkill - 결과 뷰어 Skill
 *
 * 역할: Orchestrator 결과를 웹 대시보드에서 시각화
 *
 * @version 1.5.0
 * @updated 2025-12-24 - 네이밍 리팩토링 (ViewerAgent → ViewerSkill)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SkillLoader } from '../tool-loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');

/**
 * ViewerSkill 클래스
 */
class ViewerTool {
  constructor(options = {}) {
    this.name = 'viewer';
    this.version = '1.5.0';
    this.options = options;
    this.viewerDir = path.join(projectRoot, 'orchestrator/viewer');
    this.logsDir = path.join(projectRoot, 'orchestrator/logs');

    // SkillLoader 추가
    this.skillLoader = new SkillLoader(path.join(__dirname, '..'));
    this.skill = null;
  }

  /**
   * 초기화 - SKILL.md 로드
   */
  async initialize() {
    this.skill = await this.skillLoader.loadSkill('viewer');
    return this;
  }

  /**
   * 에이전트 정보
   */
  getInfo() {
    return {
      name: this.name,
      version: this.version,
      description: 'Orchestrator 결과 웹 뷰어',
      capabilities: [
        'dashboard',         // 대시보드 조회
        'task-list',         // 실행 목록
        'task-detail',       // 상세 보기
        'doc-view',          // 문서 뷰어
        'file-tree',         // 파일 트리
        'stats'              // 통계
      ],
      phases: {
        current: 1,
        implemented: ['dashboard', 'task-list', 'doc-view', 'file-tree'],
        planned: ['realtime-monitoring', 'hitl-panel', 'analysis-viz']
      }
    };
  }

  /**
   * 서버 상태 확인
   */
  async checkServerStatus() {
    const serverPath = path.join(this.viewerDir, 'server.js');
    const hasServer = fs.existsSync(serverPath);

    return {
      serverExists: hasServer,
      serverPath: hasServer ? serverPath : null,
      port: 3000,
      url: 'http://localhost:3000'
    };
  }

  /**
   * 실행 로그 목록 조회
   */
  getTaskList() {
    if (!fs.existsSync(this.logsDir)) {
      return [];
    }

    const logs = fs.readdirSync(this.logsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try {
          const content = JSON.parse(fs.readFileSync(path.join(this.logsDir, f), 'utf-8'));
          return {
            taskId: f.replace('.json', ''),
            timestamp: content.startTime || content.timestamp,
            status: content.success !== false ? 'SUCCESS' : 'FAIL',
            totalTokens: content.totalTokens?.total || 0,
            duration: content.totalDuration || 0,
            phases: content.phases ? Object.keys(content.phases).length : 0
          };
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return logs;
  }

  /**
   * 실행 로그 상세 조회
   * @param {string} taskId - Task ID
   */
  getTaskDetail(taskId) {
    const logPath = path.join(this.logsDir, `${taskId}.json`);
    if (!fs.existsSync(logPath)) {
      return { error: 'Task not found' };
    }

    return JSON.parse(fs.readFileSync(logPath, 'utf-8'));
  }

  /**
   * 문서 목록 조회
   * @param {string} taskId - Task ID
   */
  getDocList(taskId) {
    const docsDir = path.join(projectRoot, 'docs', taskId);
    if (!fs.existsSync(docsDir)) {
      return [];
    }

    return fs.readdirSync(docsDir)
      .filter(f => f.endsWith('.md'))
      .map(f => ({
        name: f,
        path: path.join(docsDir, f)
      }));
  }

  /**
   * 통계 조회
   */
  getStats() {
    const tasks = this.getTaskList();

    const stats = {
      totalTasks: tasks.length,
      successCount: tasks.filter(t => t.status === 'SUCCESS').length,
      failCount: tasks.filter(t => t.status === 'FAIL').length,
      totalTokens: tasks.reduce((sum, t) => sum + (t.totalTokens || 0), 0),
      recentTasks: tasks.slice(0, 5)
    };

    stats.successRate = stats.totalTasks > 0
      ? ((stats.successCount / stats.totalTasks) * 100).toFixed(1) + '%'
      : 'N/A';

    return stats;
  }

  /**
   * 생성된 파일 목록
   * [Fix v4.3.0] Case-Centric 경로 지원
   */
  getGeneratedFiles(caseId = null) {
    // Case ID가 있으면 해당 케이스 폴더, 없으면 전체 cases 폴더
    const srcDir = caseId
      ? path.join(projectRoot, 'docs/cases', caseId)
      : path.join(projectRoot, 'docs/cases');
    const files = [];

    const walkDir = (dir, prefix = '') => {
      if (!fs.existsSync(dir)) return;
      fs.readdirSync(dir).forEach(f => {
        const fullPath = path.join(dir, f);
        const relPath = prefix ? prefix + '/' + f : f;
        if (fs.statSync(fullPath).isDirectory()) {
          walkDir(fullPath, relPath);
        } else if (f.endsWith('.ts') || f.endsWith('.sql') || f.endsWith('.md') || f.endsWith('.json')) {
          files.push({
            name: f,
            path: relPath,
            fullPath: fullPath,
            ext: path.extname(f),
            size: fs.statSync(fullPath).size
          });
        }
      });
    };

    walkDir(srcDir);
    return files;
  }

  /**
   * 에이전트 실행 (CLI 호환)
   * @param {string} command - 명령어
   * @param {object} args - 인자
   */
  async execute(command, args = {}) {
    switch (command) {
      case 'status':
        return await this.checkServerStatus();

      case 'tasks':
        return this.getTaskList();

      case 'task':
        return this.getTaskDetail(args.taskId);

      case 'docs':
        return this.getDocList(args.taskId);

      case 'files':
        return this.getGeneratedFiles();

      case 'stats':
        return this.getStats();

      case 'info':
      default:
        return this.getInfo();
    }
  }
}

// 싱글톤 인스턴스
let instance = null;

/**
 * ViewerSkill 인스턴스 가져오기
 */
export function getViewerSkill(options = {}) {
  if (!instance) {
    instance = new ViewerSkill(options);
  }
  return instance;
}

// 팩토리 패턴 기본 내보내기
export default {
  create: (config = {}) => new ViewerSkill(config),
  meta: {
    name: 'viewer',
    version: '1.5.0',
    description: 'Orchestrator 결과 웹 뷰어',
    category: 'utility',
    dependencies: ['SkillLoader'],
    status: 'active'
  }
};

export { ViewerSkill };

// CLI 실행 시
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const skill = getViewerSkill();
  const command = process.argv[2] || 'info';
  const args = {
    taskId: process.argv[3]
  };

  skill.execute(command, args)
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(console.error);
}
