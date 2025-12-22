#!/usr/bin/env node
/**
 * Orchestrator CLI - Leader-Sub agent 자동 협업 시스템
 *
 * 사용법:
 *   node orchestrator "작업 설명"
 *   node orchestrator --prd path/to/PRD.md "작업 설명"
 *   node orchestrator --help
 *
 * 옵션:
 *   --prd <path>     PRD 파일 경로
 *   --task-id <id>   작업 ID (기본: 자동 생성)
 *   --no-save        파일 저장 안 함 (dry-run)
 *   --max-retries    최대 재시도 횟수 (기본: 3)
 *   --help           도움말
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Orchestrator } from './orchestrator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env 파일 로드 (orchestrator 폴더 내)
dotenv.config({ path: path.join(__dirname, '.env') });

// 프로젝트 루트 (orchestrator 폴더의 부모)
const PROJECT_ROOT = path.resolve(__dirname, '..');

/**
 * CLI 인자 파싱
 */
function parseArgs(args) {
  const options = {
    taskDescription: '',
    prdPath: null,
    taskId: null,
    saveFiles: true,
    maxRetries: 3,
    help: false,
    mode: null,        // 'design', 'parallel', null(기본)
    pipeline: null     // 'analysis', 'mixed', 'parallel', null(자동 감지)
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--prd') {
      options.prdPath = args[++i];
    } else if (arg === '--task-id') {
      options.taskId = args[++i];
    } else if (arg === '--no-save') {
      options.saveFiles = false;
    } else if (arg === '--max-retries') {
      options.maxRetries = parseInt(args[++i], 10);
    } else if (arg === '--mode') {
      options.mode = args[++i];  // 'design', 'parallel'
    } else if (arg === '--pipeline') {
      options.pipeline = args[++i];  // 'analysis', 'mixed', 'parallel'
    } else if (arg === '--parallel') {
      options.pipeline = 'parallel';  // 단축 옵션
    } else if (!arg.startsWith('-')) {
      options.taskDescription = arg;
    }

    i++;
  }

  return options;
}

/**
 * 도움말 출력
 */
function printHelp() {
  console.log(`
🤖 ATO-System-B Orchestrator
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Leader-Sub agent 자동 협업 시스템

📌 사용법:
  node orchestrator/index.js "작업 설명"
  node orchestrator/index.js --prd docs/PRD.md "작업 설명"

📋 옵션:
  --prd <path>        PRD 파일 경로 (선택)
  --task-id <id>      작업 ID 지정 (기본: 자동 생성)
  --no-save           파일 저장 안 함 (dry-run 모드)
  --max-retries <n>   최대 재시도 횟수 (기본: 3)
  --mode <mode>       실행 모드: design (설계만), parallel (병렬)
  --pipeline <type>   파이프라인: analysis, mixed, parallel
  --parallel          병렬 파이프라인 단축 옵션
  --help, -h          이 도움말 표시

🔄 파이프라인 유형:
  - design:    Leader → Design Agent (설계 문서만)
  - default:   Leader → Code Agent → Review (순차)
  - parallel:  Leader → [Design || Code] → Review (병렬)
  - analysis:  Leader → Analysis Agent (SQL 분석)
  - mixed:     Leader → Analysis → Design (체이닝)

📊 출력:
  - docs/<task-id>/         설계 문서
  - backend/src/            백엔드 API 코드
  - frontend/src/           프론트엔드 컴포넌트
  - orchestrator/logs/      실행 로그

📝 예시:
  # 간단한 기능 구현 (순차)
  node orchestrator/index.js "게시글 목록 조회 API 구현"

  # PRD 기반 구현 (순차)
  node orchestrator/index.js --prd docs/PRD.md "기능 구현"

  # 병렬 실행 (Design + Code 동시)
  node orchestrator/index.js --parallel --prd docs/PRD.md "병렬 구현"

  # 설계 문서만 생성
  node orchestrator/index.js --mode design --prd docs/PRD.md "설계만"

  # Dry-run (파일 저장 없이 실행)
  node orchestrator/index.js --no-save "테스트 작업"

⚠️  필수 환경 변수:
  ANTHROPIC_API_KEY    Anthropic API 키

`);
}

/**
 * 메인 함수
 */
async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  // 도움말
  if (options.help || args.length === 0) {
    printHelp();
    process.exit(0);
  }

  // 작업 설명 필수
  if (!options.taskDescription) {
    console.error('❌ 작업 설명이 필요합니다.');
    console.error('   사용법: node orchestrator/index.js "작업 설명"');
    process.exit(1);
  }

  // API 키 확인
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다.');
    console.error('   export ANTHROPIC_API_KEY="your-api-key"');
    process.exit(1);
  }

  // PRD 파일 로드
  let prdContent = '';
  if (options.prdPath) {
    const prdFullPath = path.resolve(PROJECT_ROOT, options.prdPath);
    if (fs.existsSync(prdFullPath)) {
      prdContent = fs.readFileSync(prdFullPath, 'utf-8');
      console.log(`📄 PRD 로드: ${options.prdPath}`);
    } else {
      console.error(`❌ PRD 파일을 찾을 수 없습니다: ${prdFullPath}`);
      process.exit(1);
    }
  }

  // Orchestrator 실행
  const orchestrator = new Orchestrator({
    projectRoot: PROJECT_ROOT,
    maxRetries: options.maxRetries,
    saveFiles: options.saveFiles,
    autoApprove: true
  });

  try {
    let result;

    // 파이프라인 선택
    if (options.pipeline === 'parallel') {
      console.log('🚀 병렬 파이프라인 실행\n');
      result = await orchestrator.runParallelPipeline(
        options.taskId || `task-${Date.now()}`,
        options.taskDescription,
        prdContent,
        { mode: options.mode }
      );
    } else {
      // 기본 파이프라인 (mode 옵션 전달)
      result = await orchestrator.run(options.taskDescription, {
        taskId: options.taskId,
        prdContent,
        mode: options.mode,
        pipeline: options.pipeline
      });
    }

    // 결과 요약
    console.log('\n' + '━'.repeat(60));
    console.log('📋 최종 결과');
    console.log('━'.repeat(60));
    console.log(`상태: ${result.success ? '✅ 성공' : '❌ 실패'}`);
    console.log(`Task ID: ${result.taskId}`);
    console.log(`생성 파일: ${Object.keys(result.files || {}).length}개`);
    console.log(`총 토큰: ${result.metrics?.tokens?.grandTotal?.toLocaleString() || 'N/A'}`);
    console.log(`총 소요 시간: ${result.metrics?.summary?.totalDuration || 'N/A'}`);

    if (!result.success && result.review?.feedback) {
      console.log('\n⚠️  사용자 개입 필요:');
      console.log(result.review.feedback.substring(0, 500));
    }

    process.exit(result.success ? 0 : 1);

  } catch (error) {
    console.error('\n❌ 실행 중 에러 발생:', error.message);
    process.exit(1);
  }
}

// 실행
main();
