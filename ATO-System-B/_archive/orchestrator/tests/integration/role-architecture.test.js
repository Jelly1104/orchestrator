/**
 * Role Architecture 통합 테스트
 *
 * DD-2025-002: 변경된 아키텍처 검증
 *
 * Test Cases:
 * 1. JIT 로딩 정확성 검증
 * 2. Role-Tool 권한 매트릭스 차단
 * 3. 보안 정책 작동 확인
 * 4. Implementation Leader 루프 테스트
 *
 * @version 1.0.0
 * @since 2025-12-29
 */

import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';

// 테스트 대상 모듈
import { RoleLoader, ROLE_SECTION_MAP } from '../../utils/role-loader.js';
import {
  isToolAllowed,
  getAllowedTools,
  validateToolUsage,
  filterToolsForRole,
  ROLE_TOOL_MATRIX,
} from '../../utils/role-tool-matrix.js';
import {
  SQLValidator,
  SENSITIVE_COLUMNS,
  BLOCKED_TABLES,
  FORBIDDEN_PATTERNS,
} from '../../security/sql-validator.js';
import { ImplementationLeader } from '../../agents/implementation-leader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

// ============================================================
// Test Case 1: JIT 로딩 정확성 검증
// ============================================================
describe('Test Case 1: JIT 로딩 정확성 검증', () => {
  let roleLoader;

  beforeAll(() => {
    roleLoader = new RoleLoader(PROJECT_ROOT);
  });

  it('Leader 프롬프트에는 섹션 2만 포함되어야 함', () => {
    const leaderPrompt = roleLoader.loadSection(2);

    // Leader 섹션이 존재해야 함
    expect(leaderPrompt).toBeTruthy();
    expect(leaderPrompt).toContain('## 2. Leader');
    expect(leaderPrompt).toContain('PM & Commander');

    // 다른 Role 섹션이 포함되면 안 됨
    expect(leaderPrompt).not.toContain('## 3. Analyzer');
    expect(leaderPrompt).not.toContain('## 4. Designer');
    expect(leaderPrompt).not.toContain('## 5. Implementation Leader');
    expect(leaderPrompt).not.toContain('## 6. Coder');
  });

  it('Coder 프롬프트에는 섹션 6만 포함되어야 함', () => {
    const coderPrompt = roleLoader.loadSection(6);

    // Coder 섹션이 존재해야 함
    expect(coderPrompt).toBeTruthy();
    expect(coderPrompt).toContain('## 6. Coder');
    expect(coderPrompt).toContain('Developer');

    // 다른 Role 섹션이 포함되면 안 됨
    expect(coderPrompt).not.toContain('## 2. Leader');
    expect(coderPrompt).not.toContain('## 3. Analyzer');
    expect(coderPrompt).not.toContain('## 5. Implementation Leader');
  });

  it('Analyzer 프롬프트에는 섹션 3만 포함되어야 함', () => {
    const analyzerPrompt = roleLoader.loadSection(3);

    expect(analyzerPrompt).toBeTruthy();
    expect(analyzerPrompt).toContain('## 3. Analyzer');
    expect(analyzerPrompt).toContain('Data Analyst');

    expect(analyzerPrompt).not.toContain('## 2. Leader');
    expect(analyzerPrompt).not.toContain('## 6. Coder');
  });

  it('Implementation Leader 프롬프트에는 섹션 5만 포함되어야 함', () => {
    const implLeaderPrompt = roleLoader.loadSection(5);

    expect(implLeaderPrompt).toBeTruthy();
    expect(implLeaderPrompt).toContain('## 5. Implementation Leader');
    expect(implLeaderPrompt).toContain('Quality Manager');

    expect(implLeaderPrompt).not.toContain('## 2. Leader');
    expect(implLeaderPrompt).not.toContain('## 6. Coder');
  });

  it('loadRole() 메서드가 Role 이름으로 올바른 섹션을 반환해야 함', () => {
    const leaderByName = roleLoader.loadRole('Leader');
    const leaderBySection = roleLoader.loadSection(2);

    expect(leaderByName).toEqual(leaderBySection);
  });

  it('시스템 프롬프트 요약이 올바르게 추출되어야 함', () => {
    const systemPrompt = roleLoader.loadSystemPrompt(2);

    expect(systemPrompt).toBeTruthy();
    expect(systemPrompt).toContain('Leader');
  });

  it('캐시가 정상 작동해야 함', () => {
    // 첫 번째 호출
    const first = roleLoader.loadSection(2);
    // 두 번째 호출 (캐시에서)
    const second = roleLoader.loadSection(2);

    expect(first).toEqual(second);

    // 캐시 클리어 후 다시 로드
    roleLoader.clearCache();
    const third = roleLoader.loadSection(2);

    expect(third).toEqual(first);
  });
});

// ============================================================
// Test Case 2: Role-Tool 권한 매트릭스 차단
// ============================================================
describe('Test Case 2: Role-Tool 권한 매트릭스 차단', () => {
  it('Leader는 어떤 Tool도 사용할 수 없어야 함', () => {
    const allowedTools = getAllowedTools('Leader');

    expect(allowedTools).toEqual([]);
    expect(isToolAllowed('Leader', 'CoderTool')).toBe(false);
    expect(isToolAllowed('Leader', 'QueryTool')).toBe(false);
    expect(isToolAllowed('Leader', 'ReviewerTool')).toBe(false);
  });

  it('Leader가 Tool 사용 시도 시 Permission Denied 발생', () => {
    const result = validateToolUsage('Leader', 'QueryTool');

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('not allowed');
    expect(result.reason).toContain('Leader');
  });

  it('Coder는 CoderTool만 사용 가능해야 함', () => {
    expect(isToolAllowed('Coder', 'CoderTool')).toBe(true);
    expect(isToolAllowed('Coder', 'QueryTool')).toBe(false);
    expect(isToolAllowed('Coder', 'ReviewerTool')).toBe(false);
  });

  it('Analyzer는 QueryTool, ProfilerTool만 사용 가능해야 함', () => {
    expect(isToolAllowed('Analyzer', 'QueryTool')).toBe(true);
    expect(isToolAllowed('Analyzer', 'ProfilerTool')).toBe(true);
    expect(isToolAllowed('Analyzer', 'CoderTool')).toBe(false);
  });

  it('Implementation Leader는 ReviewerTool만 사용 가능해야 함', () => {
    expect(isToolAllowed('ImplementationLeader', 'ReviewerTool')).toBe(true);
    expect(isToolAllowed('ImplementationLeader', 'CoderTool')).toBe(false);
    expect(isToolAllowed('ImplementationLeader', 'QueryTool')).toBe(false);
  });

  it('filterToolsForRole가 Leader에게 빈 배열을 반환해야 함', () => {
    const mockToolDefinitions = {
      CoderTool: { name: 'CoderTool' },
      QueryTool: { name: 'QueryTool' },
      ReviewerTool: { name: 'ReviewerTool' },
    };

    const leaderTools = filterToolsForRole('Leader', mockToolDefinitions);
    expect(leaderTools).toEqual([]);

    const coderTools = filterToolsForRole('Coder', mockToolDefinitions);
    expect(coderTools).toHaveLength(1);
    expect(coderTools[0].name).toBe('CoderTool');
  });

  it('알 수 없는 Role에 대해 false 반환', () => {
    expect(isToolAllowed('UnknownRole', 'CoderTool')).toBe(false);
    expect(getAllowedTools('UnknownRole')).toEqual([]);
  });
});

// ============================================================
// Test Case 3: 보안 정책 작동 확인
// ============================================================
describe('Test Case 3: 보안 정책 작동 확인', () => {
  let validator;

  beforeAll(() => {
    validator = new SQLValidator();
  });

  describe('민감 컬럼 차단', () => {
    it('U_PASSWD 컬럼 조회 시 CRITICAL 차단', () => {
      const result = validator.validate('SELECT U_PASSWD FROM USERS');

      expect(result.valid).toBe(false);
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          type: 'SENSITIVE_COLUMN_ACCESS',
          severity: 'CRITICAL',
        })
      );
      expect(result.canRetry).toBe(false);
    });

    it('U_JUMIN 컬럼 조회 시 차단', () => {
      const result = validator.validate('SELECT U_JUMIN FROM USERS');

      expect(result.valid).toBe(false);
      expect(result.violations.some(v => v.columns?.includes('U_JUMIN'))).toBe(true);
    });

    it('모든 민감 컬럼이 정의되어 있어야 함', () => {
      expect(SENSITIVE_COLUMNS).toContain('U_PASSWD');
      expect(SENSITIVE_COLUMNS).toContain('U_PASSWD_ENC');
      expect(SENSITIVE_COLUMNS).toContain('U_JUMIN');
      expect(SENSITIVE_COLUMNS).toContain('U_EMAIL');
      expect(SENSITIVE_COLUMNS).toContain('U_CARD_NO');
      expect(SENSITIVE_COLUMNS.length).toBeGreaterThanOrEqual(15);
    });
  });

  describe('접근 제한 테이블 차단', () => {
    it('USER_PASSWORD 테이블 조회 시 CRITICAL 차단', () => {
      const result = validator.validate('SELECT id FROM USER_PASSWORD');

      expect(result.valid).toBe(false);
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          type: 'BLOCKED_TABLE_ACCESS',
          severity: 'CRITICAL',
        })
      );
    });

    it('API_KEYS 테이블 조회 시 차단', () => {
      const result = validator.validate('SELECT * FROM API_KEYS');

      expect(result.valid).toBe(false);
    });

    it('모든 차단 테이블이 정의되어 있어야 함', () => {
      expect(BLOCKED_TABLES).toContain('USER_PASSWORD');
      expect(BLOCKED_TABLES).toContain('USER_SESSION');
      expect(BLOCKED_TABLES).toContain('PAYMENT_INFO');
      expect(BLOCKED_TABLES).toContain('API_KEYS');
    });
  });

  describe('쓰기 명령 차단', () => {
    it('INSERT 문 차단', () => {
      const result = validator.validate('INSERT INTO USERS VALUES (1)');

      expect(result.valid).toBe(false);
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          type: 'WRITE_COMMAND_FORBIDDEN',
          severity: 'CRITICAL',
        })
      );
    });

    it('UPDATE 문 차단', () => {
      const result = validator.validate('UPDATE USERS SET name = "test"');

      expect(result.valid).toBe(false);
    });

    it('DELETE 문 차단', () => {
      const result = validator.validate('DELETE FROM USERS WHERE id = 1');

      expect(result.valid).toBe(false);
    });

    it('DROP 문 차단', () => {
      const result = validator.validate('DROP TABLE USERS');

      expect(result.valid).toBe(false);
    });
  });

  describe('금지 패턴 차단', () => {
    it('다중 명령문 차단', () => {
      const result = validator.validate('SELECT 1; DELETE FROM USERS');

      expect(result.valid).toBe(false);
      expect(result.violations.some(v => v.type === 'FORBIDDEN_PATTERN')).toBe(true);
    });

    it('SLEEP 공격 차단', () => {
      const result = validator.validate('SELECT SLEEP(10)');

      expect(result.valid).toBe(false);
    });

    it('BENCHMARK 공격 차단', () => {
      const result = validator.validate('SELECT BENCHMARK(1000000, SHA1("test"))');

      expect(result.valid).toBe(false);
    });

    it('시스템 변수 접근 차단', () => {
      const result = validator.validate('SELECT @@version');

      expect(result.valid).toBe(false);
    });
  });

  describe('정상 쿼리 허용', () => {
    it('안전한 SELECT 쿼리 허용', () => {
      const result = validator.validate('SELECT U_ID, U_KIND FROM USERS LIMIT 100');

      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('COUNT(*) 허용 (SELECT * 와 다름)', () => {
      const result = validator.validate('SELECT COUNT(*) FROM USERS');

      expect(result.valid).toBe(true);
    });
  });

  describe('SELECT * 금지', () => {
    it('SELECT * FROM 패턴 차단', () => {
      const result = validator.validate('SELECT * FROM USERS');

      expect(result.valid).toBe(false);
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          type: 'SELECT_STAR_FORBIDDEN',
          severity: 'ERROR',
        })
      );
    });
  });
});

// ============================================================
// Test Case 4: Implementation Leader 루프 테스트
// ============================================================
describe('Test Case 4: Implementation Leader 루프 테스트', () => {
  let implLeader;

  beforeAll(() => {
    implLeader = new ImplementationLeader({
      projectRoot: PROJECT_ROOT,
      maxRetries: 3,
    });
  });

  it('Implementation Leader가 올바르게 초기화되어야 함', () => {
    expect(implLeader).toBeTruthy();
    expect(implLeader.role.name).toBe('ImplementationLeader');
    expect(implLeader.role.tools).toContain('ReviewerTool');
  });

  it('Role 프롬프트가 JIT 로드되어야 함', async () => {
    const rolePrompt = await implLeader.loadRolePrompt();

    expect(rolePrompt).toBeTruthy();
    expect(rolePrompt).toContain('Implementation Leader');
    expect(rolePrompt).toContain('Quality Manager');
  });

  it('재시도 카운터가 정상 작동해야 함', () => {
    const taskId = 'test-task-001';

    // 첫 번째 시도
    expect(implLeader._canRetry(taskId, 'B')).toBe(true);
    // 두 번째 시도
    expect(implLeader._canRetry(taskId, 'B')).toBe(true);
    // 세 번째 시도
    expect(implLeader._canRetry(taskId, 'B')).toBe(true);
    // 네 번째 시도 (초과)
    expect(implLeader._canRetry(taskId, 'B')).toBe(false);

    // 리셋 후 다시 가능
    implLeader.resetRetryCount(taskId);
    expect(implLeader._canRetry(taskId, 'B')).toBe(true);
  });

  it('Actionable Feedback이 올바르게 생성되어야 함', () => {
    const mockReviewResult = {
      pass: false,
      violations: [
        {
          type: 'SECURITY_ENV',
          location: 'src/config.ts:42',
          reason: 'API key exposed',
          recommendation: 'Use environment variable',
          codeExample: 'process.env.API_KEY',
        },
      ],
    };

    const feedback = implLeader._generateActionableFeedback(mockReviewResult);

    expect(feedback).toContain('Quality Gate FAIL');
    expect(feedback).toContain('SECURITY_ENV');
    expect(feedback).toContain('src/config.ts:42');
    expect(feedback).toContain('API key exposed');
    expect(feedback).toContain('process.env.API_KEY');
  });
});

// ============================================================
// 통합 테스트 요약
// ============================================================
describe('통합 테스트 요약', () => {
  it('모든 Role이 ROLE_SECTION_MAP에 정의되어 있어야 함', () => {
    expect(ROLE_SECTION_MAP.Leader).toBe(2);
    expect(ROLE_SECTION_MAP.Analyzer).toBe(3);
    expect(ROLE_SECTION_MAP.Designer).toBe(4);
    expect(ROLE_SECTION_MAP.ImplementationLeader).toBe(5);
    expect(ROLE_SECTION_MAP.Coder).toBe(6);
    expect(ROLE_SECTION_MAP.Orchestrator).toBe(7);
  });

  it('모든 Role이 ROLE_TOOL_MATRIX에 정의되어 있어야 함', () => {
    expect(ROLE_TOOL_MATRIX.Leader).toBeTruthy();
    expect(ROLE_TOOL_MATRIX.Analyzer).toBeTruthy();
    expect(ROLE_TOOL_MATRIX.Designer).toBeTruthy();
    expect(ROLE_TOOL_MATRIX.ImplementationLeader).toBeTruthy();
    expect(ROLE_TOOL_MATRIX.Coder).toBeTruthy();
    expect(ROLE_TOOL_MATRIX.Orchestrator).toBeTruthy();
  });
});
