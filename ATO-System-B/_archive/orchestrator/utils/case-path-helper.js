/**
 * CasePathHelper - Case 기반 경로 관리 유틸리티
 *
 * 산출물 경로 표준화:
 * - Phase A 산출물: docs/cases/{caseId}/analysis/
 * - Phase B 산출물: docs/cases/{caseId}/ (IA, WF, SDD)
 * - Phase C 산출물: src/ (코드), docs/cases/{caseId}/code_review/ (리뷰 로그)
 *
 * @version 1.0.0
 * @since 2025-12-29
 * @see SYSTEM_MANIFEST.md
 */

import fs from 'fs';
import path from 'path';

export class CasePathHelper {
  constructor(projectRoot) {
    this.projectRoot = projectRoot || process.cwd();
    this.casesDir = path.join(this.projectRoot, 'docs', 'cases');
  }

  /**
   * Case ID에서 순수 케이스명 추출 (날짜/타임스탬프 제거)
   * @param {string} taskId - 태스크 ID (예: case5-dormancy-20251222)
   * @returns {string} - 순수 케이스명 (예: case5-dormancy)
   */
  extractCaseId(taskId) {
    // 날짜(8자리) 또는 타임스탬프(13자리 이상) 접미사 제거
    return taskId.replace(/-(\d{8}|\d{13,})$/, '');
  }

  /**
   * Case 기본 디렉토리 경로
   * @param {string} taskId - Task ID
   * @returns {string} - Case 디렉토리 경로
   */
  getCaseDir(taskId) {
    const caseId = this.extractCaseId(taskId);
    return path.join(this.casesDir, caseId);
  }

  /**
   * Phase A 분석 산출물 디렉토리
   * @param {string} taskId - Task ID
   * @returns {string} - 분석 디렉토리 경로
   */
  getAnalysisDir(taskId) {
    return path.join(this.getCaseDir(taskId), 'analysis');
  }

  /**
   * Phase B 설계 산출물 경로들
   * @param {string} taskId - Task ID
   * @returns {Object} - 설계 문서 경로들
   */
  getDesignPaths(taskId) {
    const caseDir = this.getCaseDir(taskId);
    return {
      ia: path.join(caseDir, 'IA.md'),
      wireframe: path.join(caseDir, 'Wireframe.md'),
      sdd: path.join(caseDir, 'SDD.md'),
      handoff: path.join(caseDir, 'HANDOFF.md'),
    };
  }

  /**
   * Phase C 코드 리뷰 로그 디렉토리
   * @param {string} taskId - Task ID
   * @returns {string} - 코드 리뷰 디렉토리 경로
   */
  getCodeReviewDir(taskId) {
    return path.join(this.getCaseDir(taskId), 'code_review');
  }

  /**
   * 시각화 산출물 디렉토리
   * @param {string} taskId - Task ID
   * @returns {string} - 시각화 디렉토리 경로
   */
  getVisualsDir(taskId) {
    return path.join(this.getCaseDir(taskId), 'visuals');
  }

  /**
   * 필요한 디렉토리 생성
   * @param {string} taskId - Task ID
   * @param {string[]} phases - 생성할 Phase 목록 ['A', 'B', 'C']
   */
  ensureDirectories(taskId, phases = ['A', 'B', 'C']) {
    const caseDir = this.getCaseDir(taskId);

    // 기본 Case 디렉토리
    if (!fs.existsSync(caseDir)) {
      fs.mkdirSync(caseDir, { recursive: true });
    }

    // Phase별 디렉토리
    if (phases.includes('A')) {
      const analysisDir = this.getAnalysisDir(taskId);
      if (!fs.existsSync(analysisDir)) {
        fs.mkdirSync(analysisDir, { recursive: true });
      }
    }

    if (phases.includes('C')) {
      const codeReviewDir = this.getCodeReviewDir(taskId);
      if (!fs.existsSync(codeReviewDir)) {
        fs.mkdirSync(codeReviewDir, { recursive: true });
      }
    }

    return caseDir;
  }

  /**
   * 산출물 저장
   * @param {string} taskId - Task ID
   * @param {string} phase - Phase ('A', 'B', 'C')
   * @param {string} filename - 파일명
   * @param {string} content - 내용
   * @returns {string} - 저장된 파일 경로
   */
  saveArtifact(taskId, phase, filename, content) {
    let targetDir;

    switch (phase) {
      case 'A':
        targetDir = this.getAnalysisDir(taskId);
        break;
      case 'B':
        targetDir = this.getCaseDir(taskId);
        break;
      case 'C':
        targetDir = this.getCodeReviewDir(taskId);
        break;
      default:
        targetDir = this.getCaseDir(taskId);
    }

    // 디렉토리 확인
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, filename);
    fs.writeFileSync(filePath, content, 'utf-8');

    console.log(`[CasePathHelper] Saved: ${filePath}`);
    return filePath;
  }

  /**
   * 산출물 로드
   * @param {string} taskId - Task ID
   * @param {string} phase - Phase ('A', 'B', 'C')
   * @param {string} filename - 파일명
   * @returns {string|null} - 파일 내용 또는 null
   */
  loadArtifact(taskId, phase, filename) {
    let targetDir;

    switch (phase) {
      case 'A':
        targetDir = this.getAnalysisDir(taskId);
        break;
      case 'B':
        targetDir = this.getCaseDir(taskId);
        break;
      case 'C':
        targetDir = this.getCodeReviewDir(taskId);
        break;
      default:
        targetDir = this.getCaseDir(taskId);
    }

    const filePath = path.join(targetDir, filename);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    return fs.readFileSync(filePath, 'utf-8');
  }

  /**
   * Case의 모든 산출물 목록 조회
   * @param {string} taskId - Task ID
   * @returns {Object} - { analysis: [], design: [], codeReview: [] }
   */
  listArtifacts(taskId) {
    const result = {
      analysis: [],
      design: [],
      codeReview: [],
    };

    // Analysis
    const analysisDir = this.getAnalysisDir(taskId);
    if (fs.existsSync(analysisDir)) {
      result.analysis = fs.readdirSync(analysisDir);
    }

    // Design
    const caseDir = this.getCaseDir(taskId);
    if (fs.existsSync(caseDir)) {
      const designFiles = ['IA.md', 'Wireframe.md', 'SDD.md', 'HANDOFF.md', 'PRD.md'];
      result.design = fs.readdirSync(caseDir)
        .filter(f => designFiles.includes(f) || f.endsWith('.md'));
    }

    // Code Review
    const codeReviewDir = this.getCodeReviewDir(taskId);
    if (fs.existsSync(codeReviewDir)) {
      result.codeReview = fs.readdirSync(codeReviewDir);
    }

    return result;
  }
}

// 싱글톤 인스턴스
let instance = null;

export function getCasePathHelper(projectRoot) {
  if (!instance) {
    instance = new CasePathHelper(projectRoot);
  }
  return instance;
}

export default CasePathHelper;
