/**
 * Code Agent 테스트
 * Phase 1 - CodeAgent 단독 기능 검증
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

// Mock 설계 문서
const MOCK_SDD = `
# SDD.md - 회원 목록 조회 API

## 1. API 명세

### GET /api/members
- **설명**: 활성 회원 목록 조회
- **파라미터**:
  - page (number): 페이지 번호 (기본값: 1)
  - limit (number): 페이지당 항목 수 (기본값: 20)
  - memberType (string): 회원 유형 필터 (선택)
- **응답**:
  \`\`\`json
  {
    "success": true,
    "data": {
      "members": [
        {
          "id": "string",
          "name": "string",
          "memberType": "string",
          "createdAt": "string"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 100,
        "totalPages": 5
      }
    }
  }
  \`\`\`

### GET /api/members/:id
- **설명**: 회원 상세 조회
- **응답**: 회원 상세 정보

## 2. 데이터 모델

### Member
| 필드 | 타입 | 설명 |
|------|------|------|
| id | string | 회원 ID (U_ID) |
| name | string | 회원명 |
| memberType | string | 회원 유형 (U_KIND) |
| status | string | 상태 (U_ALIVE) |
| createdAt | Date | 가입일 |
`;

const MOCK_WIREFRAME = `
# Wireframe.md - 회원 목록 화면

## 1. 화면: MemberList

\`\`\`
┌────────────────────────────────────────┐
│ 🏥 회원 관리                    [필터] │
├────────────────────────────────────────┤
│ ┌──────┬──────────┬──────────┬───────┐│
│ │ ID   │ 이름     │ 유형     │ 상태  ││
│ ├──────┼──────────┼──────────┼───────┤│
│ │ 001  │ 홍길동   │ 의사     │ 활성  ││
│ │ 002  │ 김철수   │ 약사     │ 활성  ││
│ │ ...  │ ...      │ ...      │ ...   ││
│ └──────┴──────────┴──────────┴───────┘│
│                                        │
│          [< 1 2 3 4 5 >]              │
└────────────────────────────────────────┘
\`\`\`

## 2. 컴포넌트
- MemberListView: 메인 컨테이너
- MemberTable: 회원 테이블
- Pagination: 페이지네이션
- FilterPanel: 필터 패널
`;

const MOCK_HANDOFF = `
# HANDOFF.md - Sub-agent 작업 지시서

## Mode
Code

## Required Outputs
- API 엔드포인트 (GET /api/members, GET /api/members/:id)
- React 컴포넌트 (MemberListView, MemberTable)
- 테스트 코드

## Input Documents
- SDD.md: API 명세 및 데이터 모델
- Wireframe.md: 화면 설계

## Completion Criteria
- SDD.md의 모든 API 엔드포인트 구현
- Wireframe.md의 모든 컴포넌트 구현
- 에러 핸들링 포함
- 테스트 코드 작성
`;

// ═══════════════════════════════════════════════════════════════
// 테스트 실행
// ═══════════════════════════════════════════════════════════════

async function testCodeAgentStructure() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🧪 Test 1: CodeAgent 구조 검증');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Dynamic import
    const { CodeAgent } = await import('../agents/code-agent.js');

    const codeAgent = new CodeAgent({
      projectRoot,
      provider: 'anthropic'
    });

    // 구조 검증
    const hasImplement = typeof codeAgent.implement === 'function';
    const hasRevise = typeof codeAgent.revise === 'function';
    const hasSaveFiles = typeof codeAgent.saveFiles === 'function';
    const hasExtractFiles = typeof codeAgent.extractFiles === 'function';
    const hasSanitizeInput = typeof codeAgent.sanitizeInput === 'function';

    console.log('메서드 존재 여부:');
    console.log(`  - implement(): ${hasImplement ? '✅' : '❌'}`);
    console.log(`  - revise(): ${hasRevise ? '✅' : '❌'}`);
    console.log(`  - saveFiles(): ${hasSaveFiles ? '✅' : '❌'}`);
    console.log(`  - extractFiles(): ${hasExtractFiles ? '✅' : '❌'}`);
    console.log(`  - sanitizeInput(): ${hasSanitizeInput ? '✅' : '❌'}`);

    const allPassed = hasImplement && hasRevise && hasSaveFiles && hasExtractFiles && hasSanitizeInput;
    console.log(`\n결과: ${allPassed ? '✅ PASSED' : '❌ FAILED'}`);

    return allPassed;
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    return false;
  }
}

async function testExtractFiles() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🧪 Test 2: extractFiles() 기능 검증');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    const { CodeAgent } = await import('../agents/code-agent.js');

    const codeAgent = new CodeAgent({ projectRoot });

    const mockContent = `
<FILE path="src/api/routes.ts">
import { Router } from 'express';
const router = Router();
export default router;
</FILE>

<FILE path="src/components/MemberList.tsx">
import React from 'react';
export const MemberList = () => <div>Members</div>;
</FILE>

<REPORT>
## 생성된 파일
- src/api/routes.ts
- src/components/MemberList.tsx
</REPORT>
`;

    const files = codeAgent.extractFiles(mockContent);

    console.log('추출된 파일:');
    Object.keys(files).forEach(f => {
      console.log(`  - ${f}: ${files[f].length} chars`);
    });

    const hasRoutes = 'src/api/routes.ts' in files;
    const hasMemberList = 'src/components/MemberList.tsx' in files;

    console.log(`\n검증:`);
    console.log(`  - routes.ts 추출: ${hasRoutes ? '✅' : '❌'}`);
    console.log(`  - MemberList.tsx 추출: ${hasMemberList ? '✅' : '❌'}`);

    const passed = hasRoutes && hasMemberList;
    console.log(`\n결과: ${passed ? '✅ PASSED' : '❌ FAILED'}`);

    return passed;
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    return false;
  }
}

async function testSecurityValidation() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🧪 Test 3: 보안 검증 (Path Traversal 방지)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    const { CodeAgent } = await import('../agents/code-agent.js');

    const codeAgent = new CodeAgent({ projectRoot });

    const maliciousFiles = {
      '../../../etc/passwd': 'malicious content',
      '/etc/shadow': 'malicious content',
      '.claude/global/DOMAIN_SCHEMA.md': 'overwrite attempt',
      'src/valid/file.ts': 'valid content'
    };

    const validated = codeAgent.validateOutput(maliciousFiles);

    console.log('입력 파일:');
    Object.keys(maliciousFiles).forEach(f => {
      console.log(`  - ${f}`);
    });

    console.log('\n검증 후 파일:');
    Object.keys(validated).forEach(f => {
      console.log(`  - ${f}`);
    });

    const blockedTraversal = !('../../../etc/passwd' in validated);
    const blockedAbsolute = !('/etc/shadow' in validated);
    const blockedClaude = !('.claude/global/DOMAIN_SCHEMA.md' in validated);
    const allowedValid = 'src/valid/file.ts' in validated;

    console.log(`\n보안 검증:`);
    console.log(`  - Path Traversal 차단: ${blockedTraversal ? '✅' : '❌'}`);
    console.log(`  - 절대 경로 차단: ${blockedAbsolute ? '✅' : '❌'}`);
    console.log(`  - .claude/global 보호: ${blockedClaude ? '✅' : '❌'}`);
    console.log(`  - 유효 경로 허용: ${allowedValid ? '✅' : '❌'}`);

    const passed = blockedTraversal && blockedAbsolute && blockedClaude && allowedValid;
    console.log(`\n결과: ${passed ? '✅ PASSED' : '❌ FAILED'}`);

    return passed;
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    return false;
  }
}

async function testOrchestratorIntegration() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🧪 Test 4: Orchestrator 연동 검증');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    const { Orchestrator } = await import('../orchestrator.js');

    const orchestrator = new Orchestrator({
      projectRoot,
      saveFiles: false,
      maxRetries: 1
    });

    // CodeAgent 존재 여부 확인
    const hasCodeAgent = orchestrator.codeAgent !== undefined;
    const hasImplementMethod = hasCodeAgent && typeof orchestrator.codeAgent.implement === 'function';

    console.log('Orchestrator 연동 상태:');
    console.log(`  - codeAgent 초기화: ${hasCodeAgent ? '✅' : '❌'}`);
    console.log(`  - implement() 메서드: ${hasImplementMethod ? '✅' : '❌'}`);

    const passed = hasCodeAgent && hasImplementMethod;
    console.log(`\n결과: ${passed ? '✅ PASSED' : '❌ FAILED'}`);

    return passed;
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    return false;
  }
}

async function testSkillLoading() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🧪 Test 5: SKILL.md 로딩 검증');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    const { SkillLoader } = await import('../skills/skill-loader.js');
    const skillsRoot = path.join(projectRoot, 'orchestrator/skills');

    const skillLoader = new SkillLoader(skillsRoot);
    const skill = await skillLoader.loadSkill('code-agent');

    // skillMd에서 메타데이터 추출
    const skillMd = skill?.skillMd || '';
    const nameMatch = skillMd.match(/^#\s+(.+?)$/m);
    const versionMatch = skillMd.match(/\*\*버전\*\*:\s*(\d+\.\d+\.\d+)/);

    const extractedName = nameMatch ? nameMatch[1].trim() : 'N/A';
    const extractedVersion = versionMatch ? versionMatch[1] : 'N/A';

    console.log('code-agent SKILL.md:');
    console.log(`  - 이름: ${extractedName}`);
    console.log(`  - 버전: ${extractedVersion}`);
    console.log(`  - 내용 길이: ${skillMd.length} chars`);

    const hasName = extractedName === 'CodeAgent Skill';
    const hasVersion = extractedVersion === '1.0.0';
    const hasContent = skillMd.length > 100;

    console.log(`\n검증:`);
    console.log(`  - 이름 일치: ${hasName ? '✅' : '❌'}`);
    console.log(`  - 버전 일치: ${hasVersion ? '✅' : '❌'}`);
    console.log(`  - 내용 존재: ${hasContent ? '✅' : '❌'}`);

    const passed = hasName && hasVersion && hasContent;
    console.log(`\n결과: ${passed ? '✅ PASSED' : '❌ FAILED'}`);

    return passed;
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    console.log('  (skill-loader.js가 없거나 code-agent SKILL.md를 찾을 수 없음)');
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// 메인 실행
// ═══════════════════════════════════════════════════════════════

async function runAllTests() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║          CodeAgent Phase 1 테스트 스위트                      ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const results = {
    structure: await testCodeAgentStructure(),
    extractFiles: await testExtractFiles(),
    security: await testSecurityValidation(),
    orchestrator: await testOrchestratorIntegration(),
    skill: await testSkillLoading()
  };

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                    테스트 결과 요약                           ║');
  console.log('╠═══════════════════════════════════════════════════════════════╣');

  const testNames = {
    structure: 'CodeAgent 구조',
    extractFiles: 'extractFiles()',
    security: '보안 검증',
    orchestrator: 'Orchestrator 연동',
    skill: 'SKILL.md 로딩'
  };

  let passCount = 0;
  for (const [key, passed] of Object.entries(results)) {
    const icon = passed ? '✅' : '❌';
    console.log(`║  ${icon} ${testNames[key].padEnd(20)} ${passed ? 'PASSED' : 'FAILED'.padEnd(10)} ║`);
    if (passed) passCount++;
  }

  console.log('╠═══════════════════════════════════════════════════════════════╣');
  console.log(`║  총 ${passCount}/${Object.keys(results).length} 테스트 통과                                     ║`);
  console.log('╚═══════════════════════════════════════════════════════════════╝');

  const allPassed = Object.values(results).every(r => r);
  process.exit(allPassed ? 0 : 1);
}

runAllTests().catch(console.error);
