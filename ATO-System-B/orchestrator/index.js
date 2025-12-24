#!/usr/bin/env node

/**

* Orchestrator CLI - Leader-Sub agent 자동 협업 시스템

*

* 사용법:

* node orchestrator "작업 설명"

* node orchestrator --prd path/to/PRD.md "작업 설명"

* node orchestrator --help

*

* 옵션:

* --prd <path> PRD 파일 경로

* --task-id <id> 작업 ID (기본: 자동 생성)

* --no-save 파일 저장 안 함 (dry-run)

* --max-retries 최대 재시도 횟수 (기본: 3)

* --help 도움말

*/

import fs from "fs";

import path from "path";

import readline from "readline";

import { fileURLToPath } from "url";

import dotenv from "dotenv";

import { Orchestrator } from "./orchestrator.js";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

// .env 파일 로드 (orchestrator 폴더 내)

dotenv.config({ path: path.join(__dirname, ".env") });

// 프로젝트 루트 (orchestrator 폴더의 부모)

const PROJECT_ROOT = path.resolve(__dirname, "..");

/**
 * PRD 스냅샷 전략 (v4.3.0)
 * .claude/project/PRD.md → docs/cases/{caseId}/PRD.md 복사
 */
function snapshotPRD(projectRoot, caseId, prdSourcePath) {
  const targetDir = path.join(projectRoot, "docs/cases", caseId);
  const targetPath = path.join(targetDir, "PRD.md");

  // 디렉토리 생성
  fs.mkdirSync(targetDir, { recursive: true });

  // PRD 복사
  fs.copyFileSync(prdSourcePath, targetPath);
  console.log(`📸 [Snapshot] PRD copied: docs/cases/${caseId}/PRD.md`);

  return targetPath;
}

/**
 * PRD에서 Case ID 추출
 * Case ID 형식: case6-orchestrator-validation-20251223
 */
function extractCaseIdFromPRD(prdContent) {
  // Case ID: case6-orchestrator-validation-20251223 형식 찾기
  const caseIdMatch = prdContent.match(/Case ID[:\s]*([a-zA-Z0-9_-]+)/i);
  if (caseIdMatch) {
    return caseIdMatch[1];
  }

  // PRD 제목에서 추출 시도
  const titleMatch = prdContent.match(/# PRD[:\s]*(.+)/);
  if (titleMatch) {
    // 제목을 케밥 케이스로 변환
    return titleMatch[1]
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 50);
  }

  return null;
}

/**
 * PRD에서 제목 추출 (작업 설명 강화용)
 * [Fix v4.3.1] 짧은 작업 설명으로 인한 산출물 품질 저하 방지
 */
function extractTitleFromPRD(prdContent) {
  // "# PRD: 제목" 형식
  const titleMatch = prdContent.match(/# PRD[:\s]*(.+)/);
  if (titleMatch) {
    return titleMatch[1].trim();
  }

  // "## 1. 목적" 섹션에서 추출
  const objectiveMatch = prdContent.match(/## 1\. 목적[^]*?\*\*([^*]+)\*\*/);
  if (objectiveMatch) {
    return objectiveMatch[1].trim().substring(0, 100);
  }

  return null;
}

/**
 * HITL Blocking Prompt (v4.3.1)
 * Phase 완료 후 사용자 승인 대기
 *
 * @param {string} taskId - 작업 ID
 * @param {object} options - 체크포인트 옵션
 * @param {string} options.phase - 현재 Phase (예: 'Phase A', 'Phase B', 'Final')
 * @param {string} options.description - 체크포인트 설명
 * @param {string} options.nextAction - Y 선택 시 다음 동작 설명
 * @param {string[]} options.completedPhases - 완료된 Phase 목록
 */
async function triggerHITLCheckpoint(taskId, options = {}) {
  // 하위 호환성: 문자열로 전달된 경우 처리
  if (typeof options === "string") {
    options = { phase: "Final", description: options };
  }

  const {
    phase = "Final",
    description = "실행 완료 - 결과 검토",
    nextAction = null,
    completedPhases = [],
  } = options;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(`\n${"─".repeat(60)}`);
  console.log(`👤 HITL 체크포인트`);
  console.log(`${"─".repeat(60)}`);
  console.log(`   📍 현재 Phase: ${phase}`);
  console.log(`   📋 상태: ${description}`);

  if (completedPhases.length > 0) {
    console.log(`   ✅ 완료된 Phase: ${completedPhases.join(" → ")}`);
  }

  console.log(`${"─".repeat(60)}`);

  if (nextAction) {
    console.log(`   [Y] 승인 → ${nextAction}`);
  } else {
    console.log(`   [Y] 승인 - 작업 완료 확인`);
  }
  console.log(`   [N] 거부 - 피드백 입력 후 재실행 (Not Implemented)`);
  console.log(`   [S] 중단 - 작업 종료`);

  return new Promise((resolve) => {
    rl.question(`\n계속하시겠습니까? (Y/N/S): `, (answer) => {
      rl.close();
      const action = answer.trim().toUpperCase();

      if (action === "Y") {
        if (nextAction) {
          console.log(`🚀 승인 확인. ${nextAction}...\n`);
        } else {
          console.log("✅ 승인 완료. 작업이 정상적으로 종료됩니다.\n");
        }
        resolve(true);
      } else if (action === "S") {
        console.log("🛑 사용자에 의해 작업이 중단되었습니다.");
        resolve(false);
      } else {
        console.log(
          "⚠️ [N] 또는 유효하지 않은 입력입니다. 현재 상태를 저장하고 종료합니다."
        );
        resolve(false);
      }
    });
  });
}

/**

* CLI 인자 파싱

*/

function parseArgs(args) {
  const options = {
    taskDescription: "",

    prdPath: null,

    taskId: null,

    saveFiles: true,

    maxRetries: 3,

    help: false,

    mode: null, // 'design', 'parallel', null(기본)

    pipeline: null, // 'analysis', 'mixed', 'parallel', null(자동 감지)
  };

  let i = 0;

  while (i < args.length) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--prd") {
      options.prdPath = args[++i];
    } else if (arg === "--task-id") {
      options.taskId = args[++i];
    } else if (arg === "--no-save") {
      options.saveFiles = false;
    } else if (arg === "--max-retries") {
      options.maxRetries = parseInt(args[++i], 10);
    } else if (arg === "--mode") {
      options.mode = args[++i]; // 'design', 'parallel'
    } else if (arg === "--pipeline") {
      options.pipeline = args[++i]; // 'analysis', 'mixed', 'parallel'
    } else if (arg === "--parallel") {
      options.pipeline = "parallel"; // 단축 옵션
    } else if (!arg.startsWith("-")) {
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

--prd <path> PRD 파일 경로 (선택)

--task-id <id> 작업 ID 지정 (기본: 자동 생성)

--no-save 파일 저장 안 함 (dry-run 모드)

--max-retries <n> 최대 재시도 횟수 (기본: 3)

--mode <mode> 실행 모드: design (설계만), parallel (병렬)

--pipeline <type> 파이프라인: analysis, mixed, parallel

--parallel 병렬 파이프라인 단축 옵션

--help, -h 이 도움말 표시



🔄 파이프라인 유형:

- design: Leader → Design Agent (설계 문서만)

- default: Leader → Code Agent → Review (순차)

- parallel: Leader → [Design || Code] → Review (병렬)

- analysis: Leader → Analysis Agent (SQL 분석)

- mixed: Leader → Analysis → Design (체이닝)



📊 출력:

- docs/<task-id>/ 설계 문서

- backend/src/ 백엔드 API 코드

- frontend/src/ 프론트엔드 컴포넌트

- orchestrator/logs/ 실행 로그



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



⚠️ 필수 환경 변수:

ANTHROPIC_API_KEY Anthropic API 키



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

  // API 키 확인

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("❌ ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다.");

    console.error(' export ANTHROPIC_API_KEY="your-api-key"');

    process.exit(1);
  }

  // PRD 파일 로드

  let prdContent = "";

  if (options.prdPath) {
    const prdFullPath = path.resolve(PROJECT_ROOT, options.prdPath);

    if (fs.existsSync(prdFullPath)) {
      prdContent = fs.readFileSync(prdFullPath, "utf-8");

      // [New v4.3.0] PRD에서 Case ID 추출 및 스냅샷
      const extractedCaseId = extractCaseIdFromPRD(prdContent);
      const caseId =
        options.taskId || extractedCaseId || `task-${Date.now()}`;

      // PRD 스냅샷 (Case-Centric 전략)
      const snapshotPath = snapshotPRD(PROJECT_ROOT, caseId, prdFullPath);

      // Task ID를 Case ID로 설정 (Orchestrator에 전달)
      options.taskId = caseId;

      // [Fix v4.3.1] 작업 설명 강화 - PRD 제목을 포함하여 LLM이 PRD를 무시하지 않도록 함
      const prdTitle = extractTitleFromPRD(prdContent);

      if (!options.taskDescription || options.taskDescription.length < 10) {
        // 작업 설명이 없거나 너무 짧으면 PRD 제목으로 자동 생성
        options.taskDescription = prdTitle
          ? `[PRD] ${prdTitle}`
          : `PRD 기반 작업 실행: ${path.basename(options.prdPath)}`;
        console.log(`ℹ️ 작업 설명 자동 생성: "${options.taskDescription}"`);
      } else if (prdTitle && !options.taskDescription.includes(prdTitle)) {
        // 작업 설명이 있어도 PRD 제목을 보강 (LLM 컨텍스트 강화)
        options.taskDescription = `[PRD: ${prdTitle}] ${options.taskDescription}`;
        console.log(`ℹ️ 작업 설명 보강: "${options.taskDescription}"`);
      }

      console.log(`📄 PRD 로드: ${options.prdPath}`);
      console.log(`📁 Case ID: ${caseId}`);
    } else {
      console.error(`❌ PRD 파일을 찾을 수 없습니다: ${prdFullPath}`);

      process.exit(1);
    }
  }

  // PRD도 없고 작업 설명도 없으면 에러 처리

  if (!options.taskDescription) {
    console.error("❌ 작업 설명이 필요합니다.");

    console.error(' 사용법: node orchestrator/index.js "작업 설명"');

    process.exit(1);
  }

  // Orchestrator 실행

  const orchestrator = new Orchestrator({
    projectRoot: PROJECT_ROOT,

    maxRetries: options.maxRetries,

    saveFiles: options.saveFiles,

    autoApprove: true,
  });

  try {
    let result;

    // 파이프라인 선택

    if (options.pipeline === "parallel") {
      console.log("🚀 병렬 파이프라인 실행\n");

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

        pipeline: options.pipeline,
      });
    }

    // 결과 요약

    console.log("\n" + "━".repeat(60));

    console.log("📋 최종 결과");

    console.log("━".repeat(60));

    console.log(`상태: ${result.success ? "✅ 성공" : "❌ 실패"}`);

    console.log(`Task ID: ${result.taskId}`);

    console.log(`생성 파일: ${Object.keys(result.files || {}).length}개`);

    console.log(
      `총 토큰: ${
        result.metrics?.tokens?.grandTotal?.toLocaleString() || "N/A"
      }`
    );

    console.log(
      `총 소요 시간: ${result.metrics?.summary?.totalDuration || "N/A"}`
    );

    if (!result.success && result.review?.feedback) {
      console.log("\n⚠️ 사용자 개입 필요:");

      console.log(result.review.feedback.substring(0, 500));
    }

    // [Fix v4.3.1] HITL Blocking Prompt - Phase 정보 포함
    if (result.success) {
      // 완료된 Phase 목록 구성
      const completedPhases = [];
      if (result.pipeline === "mixed") {
        completedPhases.push("Phase A (Analysis)", "Phase B (Design)");
      } else if (result.pipeline === "analysis") {
        completedPhases.push("Phase A (Analysis)");
      } else if (result.pipeline === "design" || result.planning) {
        completedPhases.push("Phase B (Design)");
      }

      // [Fix v4.3.2] Phase 표시: "Final" → 마지막 실행된 Phase
      const lastPhase = completedPhases.length > 0
        ? completedPhases[completedPhases.length - 1]
        : "Final";

      const continueNext = await triggerHITLCheckpoint(result.taskId, {
        phase: lastPhase,
        description: "모든 Phase 완료 - 산출물 검토",
        completedPhases: completedPhases,
        nextAction: null, // 최종 체크포인트이므로 다음 동작 없음
      });

      console.log("\n📋 산출물 위치:");
      console.log(`   - 설계 문서: docs/cases/${result.taskId}/`);
      console.log(`   - 분석 결과: docs/cases/${result.taskId}/analysis/`);

      if (!continueNext) {
        process.exit(0);
      }
    }

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error("\n❌ 실행 중 에러 발생:", error.message);

    process.exit(1);
  }
}

// 실행

main();
