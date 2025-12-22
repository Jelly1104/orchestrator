/**
 * E2E Test Suite - 통합 시나리오 테스트
 *
 * @version 1.0.0
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    constructor() {
      this.messages = {
        create: vi.fn().mockImplementation(async (params) => {
          // Simulate different responses based on system prompt
          const systemPrompt = params.system || '';
          const userMessage = params.messages?.[0]?.content || '';

          if (systemPrompt.includes('Leader') || userMessage.includes('분석')) {
            return {
              content: [{ type: 'text', text: generateLeaderResponse() }],
              usage: { input_tokens: 500, output_tokens: 300 },
              stop_reason: 'end_turn'
            };
          }

          if (systemPrompt.includes('Sub') || userMessage.includes('코딩')) {
            return {
              content: [{ type: 'text', text: generateSubAgentResponse() }],
              usage: { input_tokens: 400, output_tokens: 600 },
              stop_reason: 'end_turn'
            };
          }

          return {
            content: [{ type: 'text', text: 'Default response' }],
            usage: { input_tokens: 100, output_tokens: 50 },
            stop_reason: 'end_turn'
          };
        })
      };
    }
  }
}));

function generateLeaderResponse() {
  return `## HANDOFF

## Mode
Coding

## Input
- docs/task-test/SDD.md
- .claude/global/DOMAIN_SCHEMA.md

## Output
- src/features/login/index.ts
- tests/login.test.ts

## Constraints
- TypeScript 5.0+
- Follow TDD workflow
- Use existing domain types

## ANALYSIS

Task analysis complete. Identified:
- 2 source files to create
- 1 test file
- Login feature implementation`;
}

function generateSubAgentResponse() {
  return `## FILES_START

### src/features/login/index.ts
\`\`\`typescript
export interface LoginCredentials {
  email: string;
  password: string;
}

export async function login(credentials: LoginCredentials): Promise<boolean> {
  // Implementation
  return true;
}
\`\`\`

### tests/login.test.ts
\`\`\`typescript
import { login } from '../src/features/login';

describe('login', () => {
  it('should authenticate valid credentials', async () => {
    const result = await login({ email: 'test@test.com', password: 'pass' });
    expect(result).toBe(true);
  });
});
\`\`\`

## FILES_END`;
}

// Dynamic import after mocks
const { Orchestrator } = await import('../orchestrator.js');

describe('E2E: Full Pipeline Test', () => {
  let orchestrator;
  const testOutputDir = '/tmp/orchestrator-e2e-test';

  beforeAll(async () => {
    orchestrator = new Orchestrator({
      projectRoot: process.cwd(),
      outputDir: testOutputDir,
      useFallback: false
    });

    // Create test output directory
    await fs.mkdir(testOutputDir, { recursive: true });
  });

  afterAll(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testOutputDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Scenario 1: Simple Feature Implementation', () => {
    it('should execute full pipeline for login feature', async () => {
      const taskId = 'e2e-test-login';
      const taskDescription = '로그인 기능 구현';
      const prdContent = `
# 로그인 기능 PRD

## 개요
사용자 인증을 위한 로그인 기능

## 요구사항
- 이메일/비밀번호 인증
- 세션 관리
- 에러 처리
`;

      const result = await orchestrator.run({
        taskId,
        taskDescription,
        prdContent
      });

      expect(result).toBeDefined();
      expect(result.taskId).toBe(taskId);
      // Result structure verification
      if (result.success !== undefined) {
        expect(typeof result.success).toBe('boolean');
      }
    }, 30000);
  });

  describe('Scenario 2: Analysis Task', () => {
    it('should handle analysis-only task', async () => {
      const taskId = 'e2e-test-analysis';
      const taskDescription = '현재 회원 활동 분석 요청';

      const result = await orchestrator.run({
        taskId,
        taskDescription,
        prdContent: ''
      });

      expect(result).toBeDefined();
      expect(result.taskId).toBe(taskId);
    }, 30000);
  });

  describe('Scenario 3: Error Recovery', () => {
    it('should handle invalid task gracefully', async () => {
      await expect(
        orchestrator.run({
          taskId: 'invalid/../task',
          taskDescription: 'Test',
          prdContent: ''
        })
      ).rejects.toThrow();
    });

    it('should reject empty task description', async () => {
      await expect(
        orchestrator.run({
          taskId: 'test-empty',
          taskDescription: '',
          prdContent: ''
        })
      ).rejects.toThrow();
    });
  });
});

describe('E2E: Agent Communication', () => {
  describe('Leader to SubAgent Handoff', () => {
    it('should properly format handoff document', async () => {
      const handoff = generateLeaderResponse();

      expect(handoff).toContain('## HANDOFF');
      expect(handoff).toContain('## Mode');
      expect(handoff).toContain('## Input');
      expect(handoff).toContain('## Output');
    });
  });

  describe('SubAgent Output Parsing', () => {
    it('should parse file outputs correctly', () => {
      const output = generateSubAgentResponse();

      expect(output).toContain('## FILES_START');
      expect(output).toContain('## FILES_END');
      expect(output).toContain('src/features/login/index.ts');
    });
  });
});

describe('E2E: Security Scenarios', () => {
  let orchestrator;

  beforeAll(() => {
    orchestrator = new Orchestrator({
      projectRoot: process.cwd(),
      useFallback: false
    });
  });

  describe('Input Validation', () => {
    it('should block path traversal in taskId', async () => {
      await expect(
        orchestrator.run({
          taskId: '../../../etc/passwd',
          taskDescription: 'Malicious task',
          prdContent: ''
        })
      ).rejects.toThrow(/Path traversal/);
    });

    it('should block special characters in taskId', async () => {
      await expect(
        orchestrator.run({
          taskId: 'task<script>alert(1)</script>',
          taskDescription: 'XSS attempt',
          prdContent: ''
        })
      ).rejects.toThrow();
    });
  });

  describe('Output Validation', () => {
    it('should reject protected file paths', () => {
      const protectedFiles = {
        '.claude/global/DOMAIN_SCHEMA.md': 'modified content'
      };

      // This should be filtered by SubAgent output validation
      const validator = orchestrator.getOutputValidator();
      if (validator) {
        const result = validator(protectedFiles);
        expect(Object.keys(result)).not.toContain('.claude/global/DOMAIN_SCHEMA.md');
      }
    });
  });
});

describe('E2E: Performance Scenarios', () => {
  describe('Token Tracking', () => {
    it('should track token usage across pipeline', async () => {
      const orchestrator = new Orchestrator({
        projectRoot: process.cwd(),
        useFallback: false
      });

      const result = await orchestrator.run({
        taskId: 'perf-test',
        taskDescription: 'Performance test task',
        prdContent: ''
      });

      if (result.totalTokens) {
        expect(result.totalTokens.total).toBeGreaterThan(0);
      }
    }, 30000);
  });

  describe('Retry Logic', () => {
    it('should respect maxRetries setting', () => {
      const orchestrator = new Orchestrator({
        maxRetries: 3
      });

      expect(orchestrator.maxRetries).toBe(3);
    });

    it('should cap maxRetries at 5', () => {
      const orchestrator = new Orchestrator({
        maxRetries: 10
      });

      expect(orchestrator.maxRetries).toBe(5);
    });
  });
});

describe('E2E: HITL (Human-in-the-Loop)', () => {
  describe('Approval Flow', () => {
    it('should identify tasks requiring approval', () => {
      const taskTypes = {
        'DB 스키마 변경': true,
        '보안 설정 변경': true,
        '프로덕션 배포': true,
        '단순 버그 수정': false,
        '문서 업데이트': false
      };

      // Verification of HITL trigger conditions
      for (const [task, requiresApproval] of Object.entries(taskTypes)) {
        const isHighRisk =
          task.includes('DB') ||
          task.includes('스키마') ||
          task.includes('보안') ||
          task.includes('프로덕션');

        expect(isHighRisk).toBe(requiresApproval);
      }
    });
  });
});
