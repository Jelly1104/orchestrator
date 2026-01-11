/**
 * Orchestrator Core Test Suite
 *
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock Anthropic SDK before imports
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    constructor() {
      this.messages = {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Test response' }],
          usage: { input_tokens: 100, output_tokens: 50 }
        })
      };
    }
  }
}));

// Dynamic import to ensure mocks are applied
const { Orchestrator } = await import('../orchestrator.js');

describe('Orchestrator', () => {
  let orchestrator;

  beforeEach(() => {
    orchestrator = new Orchestrator({
      projectRoot: process.cwd(),
      useFallback: true,
      maxRetries: 3
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const defaultOrch = new Orchestrator();
      expect(defaultOrch.projectRoot).toBeDefined();
      expect(defaultOrch.maxRetries).toBeLessThanOrEqual(5);
    });

    it('should cap maxRetries at 5', () => {
      const orch = new Orchestrator({ maxRetries: 10 });
      expect(orch.maxRetries).toBe(5);
    });

    it('should accept custom projectRoot', () => {
      const orch = new Orchestrator({ projectRoot: '/custom/path' });
      expect(orch.projectRoot).toBe('/custom/path');
    });
  });

  describe('validateTaskId', () => {
    it('should accept valid task ID', () => {
      const result = orchestrator.validateTaskId('task-123');
      expect(result).toBe('task-123');
    });

    it('should accept alphanumeric with underscores', () => {
      const result = orchestrator.validateTaskId('task_2024_12_19');
      expect(result).toBe('task_2024_12_19');
    });

    it('should reject path traversal attempts', () => {
      expect(() => orchestrator.validateTaskId('../etc/passwd'))
        .toThrow(/Path traversal/);
    });

    it('should reject slashes', () => {
      expect(() => orchestrator.validateTaskId('task/evil'))
        .toThrow(/Path traversal/);
    });

    it('should reject special characters', () => {
      expect(() => orchestrator.validateTaskId('task@#$'))
        .toThrow(/Invalid taskId format/);
    });

    it('should reject empty string', () => {
      expect(() => orchestrator.validateTaskId(''))
        .toThrow();
    });
  });

  describe('sanitizeTaskDescription', () => {
    it('should pass through normal description', () => {
      const result = orchestrator.sanitizeTaskDescription('Build a login page');
      expect(result).toBe('Build a login page');
    });

    it('should truncate long descriptions', () => {
      const longDesc = 'a'.repeat(15000);
      const result = orchestrator.sanitizeTaskDescription(longDesc);
      expect(result.length).toBe(10000);
    });

    it('should reject empty description', () => {
      expect(() => orchestrator.sanitizeTaskDescription(''))
        .toThrow(/Invalid taskDescription/);
    });

    it('should reject whitespace-only description', () => {
      expect(() => orchestrator.sanitizeTaskDescription('   '))
        .toThrow(/Invalid taskDescription/);
    });
  });

  describe('sanitizePrdContent', () => {
    it('should allow empty PRD', () => {
      const result = orchestrator.sanitizePrdContent('');
      expect(result).toBe('');
    });

    it('should truncate long PRD', () => {
      const longPrd = 'b'.repeat(60000);
      const result = orchestrator.sanitizePrdContent(longPrd);
      expect(result.length).toBe(50000);
    });

    it('should pass through normal PRD', () => {
      const prd = '# PRD\n\n## Overview\nThis is a PRD';
      const result = orchestrator.sanitizePrdContent(prd);
      expect(result).toBe(prd);
    });
  });

  describe('validateFilePath', () => {
    it('should accept valid relative path', () => {
      const result = orchestrator.validateFilePath('docs/task-1/SDD.md');
      expect(result).toContain('docs/task-1/SDD.md');
    });

    it('should reject path traversal', () => {
      expect(() => orchestrator.validateFilePath('../../../etc/passwd'))
        .toThrow(/Path traversal/);
    });

    it('should reject paths outside project', () => {
      expect(() => orchestrator.validateFilePath('/etc/passwd'))
        .toThrow();
    });
  });

  describe('generateTaskId', () => {
    it('should generate unique IDs', () => {
      const id1 = orchestrator.generateTaskId();
      const id2 = orchestrator.generateTaskId();
      expect(id1).not.toBe(id2);
    });

    it('should follow expected format', () => {
      const id = orchestrator.generateTaskId();
      expect(id).toMatch(/^[a-zA-Z0-9_-]+$/);
    });
  });

  describe('run', () => {
    it('should handle task execution', async () => {
      // This tests the basic run flow with mocks
      const result = await orchestrator.run({
        taskId: 'test-task',
        taskDescription: 'Test task',
        prdContent: ''
      });

      expect(result).toBeDefined();
      // With fallback mode, should complete without API calls
    });
  });
});

describe('Orchestrator Error Handling', () => {
  it('should handle missing task description', async () => {
    const orch = new Orchestrator();

    await expect(orch.run({
      taskId: 'test',
      taskDescription: '',
      prdContent: ''
    })).rejects.toThrow();
  });
});
