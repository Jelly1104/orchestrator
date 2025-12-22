#!/usr/bin/env node
/**
 * HANDOFF 준수 자동 검증 스크립트
 * Leader가 Sub-agent 작업 완료 후 실행
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

function log(color, message) {
  console.log(`${color}${message}${RESET}`);
}

function parseHandoffOutput(handoffPath) {
  if (!fs.existsSync(handoffPath)) {
    throw new Error(`HANDOFF 파일 없음: ${handoffPath}`);
  }

  const content = fs.readFileSync(handoffPath, "utf-8");

  // Output 기대 섹션 파싱 (케이스별로 "## Output 기대" 또는 "## 3. Output 기대" 형태가 있음)
  const outputMatch = content.match(
    /##\s+(?:\d+\.\s+)?Output 기대[\s\S]*?```([\s\S]*?)```/
  );
  if (!outputMatch) {
    throw new Error("HANDOFF에서 Output 기대 섹션을 찾을 수 없음");
  }

  const outputBlock = outputMatch[1];
  const expectedFiles = [];

  // 트리 구조 파싱
  // 예)
  // src/
  // ├── features/
  // │   └── dr-insight/
  // │       ├── index.ts
  const lines = outputBlock.split("\n");
  const stack = [];

  function setStack(depth, dirName) {
    stack.length = depth;
    stack.push(dirName);
  }

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) continue;

    // 최상위 디렉토리 라인 (예: src/ or tests/)
    const rootDirMatch = line.match(/^([A-Za-z0-9_.-]+)\/$/);
    if (rootDirMatch) {
      stack.length = 0;
      stack.push(rootDirMatch[1]);
      continue;
    }

    // 트리 라인
    const treeMatch = line.match(
      /^(?<indent>[│ ]*)(?<branch>[├└]── )(?<name>.+)$/
    );
    if (!treeMatch) continue;

    const indent = treeMatch.groups.indent || "";
    const rawName = (treeMatch.groups.name || "").trim();

    // 파일/폴더명 뒤 주석(# ...) 제거
    const name = rawName.split("#")[0].trim().split(/\s+/)[0];

    // 4칸 단위로 depth 계산 ("│   " or "    ")
    const depth = Math.floor(indent.length / 4) + 1;

    if (name.endsWith("/")) {
      setStack(depth, name.replace(/\/$/, ""));
      continue;
    }

    if (name.endsWith(".ts") || name.endsWith(".tsx")) {
      const dirPath = stack.join("/");
      expectedFiles.push(`${dirPath}/${name}`);
    }
  }

  return expectedFiles;
}

function checkFilesExist(expectedFiles) {
  const results = [];

  for (const file of expectedFiles) {
    const fullPath = path.join(ROOT, file);
    const exists = fs.existsSync(fullPath);

    let lines = 0;
    if (exists) {
      const content = fs.readFileSync(fullPath, "utf-8");
      lines = content.split("\n").length;
    }

    results.push({
      file,
      exists,
      lines,
      status: exists ? "PASS" : "FAIL",
    });
  }

  return results;
}

function checkCodeQuality(results) {
  const issues = [];

  for (const r of results) {
    if (!r.exists) continue;

    const fullPath = path.join(ROOT, r.file);
    const content = fs.readFileSync(fullPath, "utf-8");

    // 함수 길이 체크 (30줄 이하)
    const functions = content.match(/function\s+\w+[\s\S]*?\n\}/g) || [];
    for (const fn of functions) {
      const fnLines = fn.split("\n").length;
      if (fnLines > 30) {
        const fnName = fn.match(/function\s+(\w+)/)?.[1] || "anonymous";
        issues.push(`${r.file}: 함수 ${fnName}이 ${fnLines}줄 (기준: 30줄)`);
      }
    }

    // console.log 체크 (민감정보)
    const sensitivePatterns = [
      /console\.log.*password/i,
      /console\.log.*secret/i,
      /console\.log.*token/i,
    ];
    for (const pattern of sensitivePatterns) {
      if (pattern.test(content)) {
        issues.push(`${r.file}: console.log에 민감정보 출력 의심`);
      }
    }

    // SDD 참조 주석 확인
    if (!content.includes("@see") && !content.includes("SDD")) {
      issues.push(`${r.file}: SDD 참조 주석 없음 (권장)`);
    }
  }

  return issues;
}

function printReport(results, issues) {
  console.log("\n📋 HANDOFF 준수 검증 리포트\n");
  console.log("파일                                          | 상태  | 줄 수");
  console.log("----------------------------------------------|-------|------");

  let passCount = 0;
  let failCount = 0;

  for (const r of results) {
    const status = r.exists ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`;
    const lines = r.exists ? String(r.lines).padStart(5) : "    -";
    console.log(`${r.file.padEnd(45)} | ${status}  | ${lines}`);

    if (r.exists) passCount++;
    else failCount++;
  }

  console.log("");
  console.log(
    `총 ${results.length}개 파일 중 ${passCount}개 생성, ${failCount}개 누락`
  );

  if (issues.length > 0) {
    console.log(`\n${YELLOW}⚠️  코드 품질 이슈:${RESET}`);
    issues.forEach((i) => console.log(`   - ${i}`));
  }

  console.log("");

  return failCount === 0;
}

function main() {
  const handoffPath = process.argv[2];

  if (!handoffPath) {
    console.log("Usage: node scripts/validate-handoff.js <HANDOFF.md 경로>");
    console.log(
      "Example: node scripts/validate-handoff.js docs/case2-notification/HANDOFF.md"
    );
    process.exit(1);
  }

  const fullHandoffPath = path.resolve(ROOT, handoffPath);

  log(YELLOW, "\n🔍 HANDOFF 준수 검증 시작...\n");
  log(YELLOW, `📄 HANDOFF: ${handoffPath}\n`);

  try {
    const expectedFiles = parseHandoffOutput(fullHandoffPath);
    console.log(`기대 파일 수: ${expectedFiles.length}개\n`);

    const results = checkFilesExist(expectedFiles);
    const issues = checkCodeQuality(results);
    const passed = printReport(results, issues);

    if (passed) {
      log(GREEN, "✅ HANDOFF Output 준수 완료!\n");
      process.exit(0);
    } else {
      log(RED, "🚫 HANDOFF Output 미준수. 누락된 파일을 확인하세요.\n");
      process.exit(1);
    }
  } catch (e) {
    log(RED, `❌ 오류: ${e.message}\n`);
    process.exit(1);
  }
}

main();
