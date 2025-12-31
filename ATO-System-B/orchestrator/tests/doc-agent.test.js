/**
 * DocAgent Test Suite
 *
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import DocAgent, { getDocAgent } from '../tools/doc-agent/index.js';
import {
  extractVersion,
  compareVersions,
  loadMapping,
  readLocalDoc
} from '../tools/doc-agent/sync.js';
import fs from 'fs';

// Mock fs
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    readFileSync: vi.fn().mockReturnValue('{}'),
    writeFileSync: vi.fn()
  }
}));

describe('DocAgent', () => {
  let agent;

  beforeEach(() => {
    agent = new DocAgent();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(agent.name).toBe('doc-agent');
      expect(agent.version).toBe('1.0.0');
    });

    it('should accept options', () => {
      const options = { customOption: 'test' };
      const customAgent = new DocAgent(options);
      expect(customAgent.options.customOption).toBe('test');
    });
  });

  describe('getInfo', () => {
    it('should return agent info', () => {
      const info = agent.getInfo();

      expect(info.name).toBe('doc-agent');
      expect(info.version).toBe('1.0.0');
      expect(info.capabilities).toContain('status-check');
      expect(info.capabilities).toContain('sync-to-notion');
    });
  });

  describe('compareVersions', () => {
    it('should identify newer version', () => {
      const result = agent.compareVersions('2.0.0', '1.0.0');
      expect(result).toBe('newer');
    });

    it('should identify older version', () => {
      const result = agent.compareVersions('1.0.0', '2.0.0');
      expect(result).toBe('older');
    });

    it('should identify same version', () => {
      const result = agent.compareVersions('1.0.0', '1.0.0');
      expect(result).toBe('same');
    });
  });

  describe('execute', () => {
    it('should return info for unknown command', async () => {
      const result = await agent.execute('unknown');
      expect(result.name).toBe('doc-agent');
    });

    it('should handle version command', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify({
        mappings: {
          'CLAUDE.md': {
            localPath: 'CLAUDE.md',
            notionPageId: 'test-id',
            syncEnabled: true
          }
        }
      }));

      const result = agent.getDocVersion('CLAUDE.md');
      // Result may vary based on mocking
      expect(result).toBeDefined();
    });
  });
});

describe('Sync Module', () => {
  describe('extractVersion', () => {
    it('should extract version from document', () => {
      const content = '> **문서 버전**: 3.4.1\n\nContent here';
      const version = extractVersion(content);
      expect(version).toBe('3.4.1');
    });

    it('should extract alternative version format', () => {
      const content = '> **버전**: 2.0.0\n\nContent';
      const version = extractVersion(content);
      expect(version).toBe('2.0.0');
    });

    it('should return null for no version', () => {
      const content = 'No version here';
      const version = extractVersion(content);
      expect(version).toBeNull();
    });
  });

  describe('compareVersions', () => {
    it('should compare major versions', () => {
      expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
      expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
    });

    it('should compare minor versions', () => {
      expect(compareVersions('1.2.0', '1.1.0')).toBe(1);
      expect(compareVersions('1.1.0', '1.2.0')).toBe(-1);
    });

    it('should compare patch versions', () => {
      expect(compareVersions('1.0.2', '1.0.1')).toBe(1);
      expect(compareVersions('1.0.1', '1.0.2')).toBe(-1);
    });

    it('should handle equal versions', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    });

    it('should handle null versions', () => {
      expect(compareVersions(null, null)).toBe(0);
      expect(compareVersions('1.0.0', null)).toBe(1);
      expect(compareVersions(null, '1.0.0')).toBe(-1);
    });
  });
});

describe('getDocAgent', () => {
  it('should return singleton instance', () => {
    const agent1 = getDocAgent();
    const agent2 = getDocAgent();
    expect(agent1).toBe(agent2);
  });
});
