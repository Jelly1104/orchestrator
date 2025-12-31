/**
 * DesignAgent Test Suite
 *
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DesignAgent } from '../tools/design-agent/index.js';
import fs from 'fs/promises';
import path from 'path';

// Mock fs
vi.mock('fs/promises', () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue('# Test Content')
  }
}));

describe('DesignAgent', () => {
  let agent;

  beforeEach(() => {
    agent = new DesignAgent({
      projectRoot: '/test/project',
      outputDir: '/test/project/docs/cases'
    });
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const defaultAgent = new DesignAgent();
      expect(defaultAgent.projectRoot).toBeDefined();
      expect(defaultAgent.outputDir).toBeDefined();
    });

    it('should accept custom config', () => {
      expect(agent.projectRoot).toBe('/test/project');
      expect(agent.outputDir).toBe('/test/project/docs/cases');
    });

    it('should extract caseId from taskId', () => {
      expect(agent.extractCaseId('case5-dormancy-20251223')).toBe('case5-dormancy');
      expect(agent.extractCaseId('case5-dormancy-1766037994472')).toBe('case5-dormancy');
      expect(agent.extractCaseId('task-1766037994472')).toBe('task');
    });
  });

  describe('_extractMermaid', () => {
    it('should extract mermaid blocks from content', () => {
      const content = `
# Architecture

\`\`\`mermaid
graph TD
    A --> B
\`\`\`

Some text

\`\`\`mermaid
sequenceDiagram
    A->>B: Hello
\`\`\`
`;
      const blocks = agent._extractMermaid(content);
      expect(blocks).toHaveLength(2);
      expect(blocks[0]).toContain('graph TD');
      expect(blocks[1]).toContain('sequenceDiagram');
    });

    it('should return empty array for no mermaid', () => {
      const content = '# Just text\nNo diagrams here';
      const blocks = agent._extractMermaid(content);
      expect(blocks).toHaveLength(0);
    });
  });

  describe('_extractAscii', () => {
    it('should extract ASCII art blocks', () => {
      const content = `
# Wireframe

\`\`\`
+--------+
| Header |
+--------+
\`\`\`

Some text

\`\`\`
+-------+
| Menu  |
+-------+
\`\`\`
`;
      const blocks = agent._extractAscii(content);
      expect(blocks.length).toBeGreaterThan(0);
    });

    it('should filter code blocks without ASCII art', () => {
      const content = `
\`\`\`javascript
const x = 1;
\`\`\`
`;
      const blocks = agent._extractAscii(content);
      expect(blocks).toHaveLength(0);
    });
  });

  describe('_extractApiSpecs', () => {
    it('should extract API endpoint specs', () => {
      const content = `
# API Design

## GET /api/users
Returns list of users

## POST /api/login
Login endpoint

## DELETE /api/users/{id}
Delete user
`;
      const specs = agent._extractApiSpecs(content);
      expect(specs.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle empty content', () => {
      const specs = agent._extractApiSpecs('');
      expect(specs).toHaveLength(0);
    });
  });

  describe('_generateIAHtml', () => {
    it('should generate HTML with mermaid diagrams', () => {
      const content = '# Information Architecture';
      const mermaidBlocks = ['graph TD\n    A --> B'];
      const html = agent._generateIAHtml(content, mermaidBlocks, {});

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('mermaid');
      expect(html).toContain('graph TD');
    });

    it('should include title from content', () => {
      const content = '# My Architecture\n\nDescription';
      const html = agent._generateIAHtml(content, [], {});

      expect(html).toContain('My Architecture');
    });
  });

  describe('_generateWireframeHtml', () => {
    it('should generate HTML for wireframe preview', () => {
      const content = '# Wireframe\n\nMain layout';
      const asciiBlocks = ['+--------+\n| Header |\n+--------+'];
      const html = agent._generateWireframeHtml(content, asciiBlocks, {});

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Wireframe');
    });
  });

  describe('_generateSDDHtml', () => {
    it('should generate HTML for SDD with API specs', () => {
      const content = '# System Design';
      const mermaidBlocks = ['sequenceDiagram\n    A->>B: Request'];
      const apiSpecs = [{ method: 'GET', path: '/api/users' }];
      const html = agent._generateSDDHtml(content, mermaidBlocks, apiSpecs, {});

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('mermaid');
    });
  });

  describe('visualize', () => {
    it('should process IA document', async () => {
      const input = {
        documents: {
          ia: '# IA\n\n```mermaid\ngraph TD\n    A --> B\n```'
        },
        options: { taskId: 'test-123' }
      };

      const result = await agent.visualize(input);

      expect(result.success).toBe(true);
      expect(result.generated).toBeDefined();
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should handle empty documents', async () => {
      const input = {
        documents: {},
        options: {}
      };

      const result = await agent.visualize(input);

      expect(result.success).toBe(true);
      expect(result.generated).toHaveLength(0);
    });

    it('should create output directory', async () => {
      const input = {
        documents: { ia: '# Test' },
        options: {}
      };

      await agent.visualize(input);

      expect(fs.mkdir).toHaveBeenCalled();
    });
  });
});
