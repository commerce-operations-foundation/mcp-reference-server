/**
 * Report Generator Tests
 *
 * Tests the compliance report generation from validation results.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ReportGenerator } from '../../src/reporters/index.js';
import {
  createServerInfo,
  createToolValidationResult,
  createPassingResult,
  createFailingResult,
} from '../fixtures/index.js';
import { ToolValidationResult, ValidationResult } from '../../src/types.js';
import { ONX_TOOLS } from '@onx/schemas';

describe('ReportGenerator', () => {
  let generator: ReportGenerator;

  beforeEach(() => {
    generator = new ReportGenerator();
  });

  describe('generate', () => {
    it('should generate report with correct server info', () => {
      const serverInfo = createServerInfo({
        name: 'my-server',
        version: '2.0.0',
        protocolVersion: '2024-11-05',
      });
      const toolResults: ToolValidationResult[] = [];
      const functionalResults = new Map<string, ValidationResult[]>();

      const report = generator.generate(serverInfo, toolResults, functionalResults, 'http');

      expect(report.serverInfo).toEqual(serverInfo);
      expect(report.transport).toBe('http');
    });

    it('should generate valid timestamp', () => {
      const serverInfo = createServerInfo();
      const toolResults: ToolValidationResult[] = [];
      const functionalResults = new Map<string, ValidationResult[]>();

      const report = generator.generate(serverInfo, toolResults, functionalResults, 'stdio');

      expect(report.timestamp).toBeDefined();
      expect(new Date(report.timestamp).getTime()).not.toBeNaN();
    });

    it('should calculate summary correctly with all tools passing', () => {
      const serverInfo = createServerInfo();
      const toolResults: ToolValidationResult[] = ONX_TOOLS.map(tool =>
        createToolValidationResult(tool, { exists: true, schemaValid: true })
      );
      const functionalResults = new Map<string, ValidationResult[]>();

      const report = generator.generate(serverInfo, toolResults, functionalResults, 'stdio');

      expect(report.summary.totalTools).toBe(ONX_TOOLS.length);
      expect(report.summary.onXToolsImplemented).toBe(ONX_TOOLS.length);
      expect(report.summary.missingTools).toBe(0);
    });

    it('should identify missing tools', () => {
      const serverInfo = createServerInfo();
      const toolResults: ToolValidationResult[] = ONX_TOOLS.slice(0, 6).map(tool =>
        createToolValidationResult(tool, { exists: true })
      );
      for (const tool of ONX_TOOLS.slice(6)) {
        toolResults.push(
          createToolValidationResult(tool, {
            exists: false,
            errors: [createFailingResult(tool, 'tool-exists', `Missing: ${tool}`)],
          })
        );
      }
      const functionalResults = new Map<string, ValidationResult[]>();

      const report = generator.generate(serverInfo, toolResults, functionalResults, 'stdio');

      expect(report.summary.missingTools).toBeGreaterThan(0);
      expect(report.summary.onXToolsImplemented).toBeLessThan(ONX_TOOLS.length);
    });

    it('should merge functional results into tool results', () => {
      const serverInfo = createServerInfo();
      const toolResults: ToolValidationResult[] = [
        createToolValidationResult('get-orders', { exists: true }),
      ];
      const functionalResults = new Map<string, ValidationResult[]>([
        [
          'get-orders',
          [
            createPassingResult('get-orders', 'functional-test-1'),
            createFailingResult('get-orders', 'functional-test-2', 'Failed test'),
          ],
        ],
      ]);

      const report = generator.generate(serverInfo, toolResults, functionalResults, 'stdio');

      const getOrdersResult = report.tools.find(t => t.tool === 'get-orders');
      expect(getOrdersResult?.functionalValid).toBe(false);
      expect(getOrdersResult?.errors).toContainEqual(
        expect.objectContaining({ check: 'functional-test-2' })
      );
    });

    it('should set functionalValid to true when all functional tests pass', () => {
      const serverInfo = createServerInfo();
      const toolResults: ToolValidationResult[] = [
        createToolValidationResult('get-orders', { exists: true }),
      ];
      const functionalResults = new Map<string, ValidationResult[]>([
        [
          'get-orders',
          [
            createPassingResult('get-orders', 'functional-test-1'),
            createPassingResult('get-orders', 'functional-test-2'),
          ],
        ],
      ]);

      const report = generator.generate(serverInfo, toolResults, functionalResults, 'stdio');

      const getOrdersResult = report.tools.find(t => t.tool === 'get-orders');
      expect(getOrdersResult?.functionalValid).toBe(true);
    });

    it('should count passed and failed checks correctly', () => {
      const serverInfo = createServerInfo();
      const toolResults: ToolValidationResult[] = [
        createToolValidationResult('get-orders', {
          exists: true,
          errors: [
            createPassingResult('get-orders', 'check-1'),
            createPassingResult('get-orders', 'check-2'),
            createFailingResult('get-orders', 'check-3'),
          ],
        }),
      ];
      const functionalResults = new Map<string, ValidationResult[]>();

      const report = generator.generate(serverInfo, toolResults, functionalResults, 'stdio');

      expect(report.summary.passedChecks).toBe(3);
      expect(report.summary.failedChecks).toBe(1);
    });

    it('should count warnings', () => {
      const serverInfo = createServerInfo();
      const toolResults: ToolValidationResult[] = [
        createToolValidationResult('get-orders', {
          exists: true,
          warnings: [
            createPassingResult('get-orders', 'warning-1'),
            createPassingResult('get-orders', 'warning-2'),
          ],
        }),
      ];
      const functionalResults = new Map<string, ValidationResult[]>();

      const report = generator.generate(serverInfo, toolResults, functionalResults, 'stdio');

      expect(report.summary.warnings).toBe(2);
    });

    describe('compliance level', () => {
      it('should be "full" when all tools exist and all checks pass', () => {
        const serverInfo = createServerInfo();
        const toolResults: ToolValidationResult[] = ONX_TOOLS.map(tool =>
          createToolValidationResult(tool, { exists: true, errors: [] })
        );
        const functionalResults = new Map<string, ValidationResult[]>();

        const report = generator.generate(serverInfo, toolResults, functionalResults, 'stdio');

        expect(report.compliance).toBe('full');
      });

      it('should be "non-compliant" when no tools are implemented', () => {
        const serverInfo = createServerInfo();
        const toolResults: ToolValidationResult[] = ONX_TOOLS.map((tool) =>
          createToolValidationResult(tool, {
            exists: false,
            errors: [createFailingResult(tool, 'tool-exists', `Missing: ${tool}`)],
          })
        );
        const functionalResults = new Map<string, ValidationResult[]>();

        const report = generator.generate(serverInfo, toolResults, functionalResults, 'stdio');

        expect(report.compliance).toBe('non-compliant');
      });

      it('should be "partial" when any tools are implemented', () => {
        const serverInfo = createServerInfo();
        const toolResults: ToolValidationResult[] = ONX_TOOLS.map((tool, index) =>
          createToolValidationResult(tool, {
            exists: index < 2,
            errors: index >= 2
              ? [createFailingResult(tool, 'tool-exists', `Missing: ${tool}`)]
              : [],
          })
        );
        const functionalResults = new Map<string, ValidationResult[]>();

        const report = generator.generate(serverInfo, toolResults, functionalResults, 'stdio');

        expect(report.compliance).toBe('partial');
      });

      it('should be "partial" when all tools exist but some checks fail', () => {
        const serverInfo = createServerInfo();
        const toolResults: ToolValidationResult[] = ONX_TOOLS.map(tool =>
          createToolValidationResult(tool, {
            exists: true,
            errors: [createFailingResult(tool, 'schema-check', 'Schema error')],
          })
        );
        const functionalResults = new Map<string, ValidationResult[]>();

        const report = generator.generate(serverInfo, toolResults, functionalResults, 'stdio');

        expect(report.compliance).toBe('partial');
      });
    });

    describe('score calculation', () => {
      it('should be 100 when all checks pass', () => {
        const serverInfo = createServerInfo();
        const toolResults: ToolValidationResult[] = ONX_TOOLS.map(tool =>
          createToolValidationResult(tool, { exists: true, errors: [] })
        );
        const functionalResults = new Map<string, ValidationResult[]>();

        const report = generator.generate(serverInfo, toolResults, functionalResults, 'stdio');

        expect(report.score).toBe(100);
      });

      it('should be 0 when no checks pass', () => {
        const serverInfo = createServerInfo();
        const toolResults: ToolValidationResult[] = ONX_TOOLS.map(tool =>
          createToolValidationResult(tool, {
            exists: false,
            errors: [createFailingResult(tool, 'tool-exists')],
          })
        );
        const functionalResults = new Map<string, ValidationResult[]>();

        const report = generator.generate(serverInfo, toolResults, functionalResults, 'stdio');

        expect(report.score).toBe(0);
      });

      it('should calculate percentage correctly', () => {
        const serverInfo = createServerInfo();
        const toolResults: ToolValidationResult[] = [
          createToolValidationResult('get-orders', {
            exists: true,
            errors: [
              createPassingResult('get-orders', 'check-1'),
              createFailingResult('get-orders', 'check-2'),
            ],
          }),
        ];
        const functionalResults = new Map<string, ValidationResult[]>();

        const report = generator.generate(serverInfo, toolResults, functionalResults, 'stdio');

        expect(report.score).toBe(67);
      });
    });
  });

  describe('toJSON', () => {
    it('should return valid JSON string', () => {
      const serverInfo = createServerInfo();
      const toolResults: ToolValidationResult[] = [];
      const functionalResults = new Map<string, ValidationResult[]>();

      const report = generator.generate(serverInfo, toolResults, functionalResults, 'stdio');
      const json = ReportGenerator.toJSON(report);

      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should be properly formatted with indentation', () => {
      const serverInfo = createServerInfo();
      const toolResults: ToolValidationResult[] = [];
      const functionalResults = new Map<string, ValidationResult[]>();

      const report = generator.generate(serverInfo, toolResults, functionalResults, 'stdio');
      const json = ReportGenerator.toJSON(report);

      expect(json).toContain('\n');
      expect(json).toContain('"serverInfo"');
    });

    it('should roundtrip correctly', () => {
      const serverInfo = createServerInfo();
      const toolResults: ToolValidationResult[] = ONX_TOOLS.map(tool =>
        createToolValidationResult(tool, { exists: true })
      );
      const functionalResults = new Map<string, ValidationResult[]>();

      const report = generator.generate(serverInfo, toolResults, functionalResults, 'http');
      const json = ReportGenerator.toJSON(report);
      const parsed = JSON.parse(json);

      expect(parsed.serverInfo).toEqual(report.serverInfo);
      expect(parsed.transport).toBe(report.transport);
      expect(parsed.compliance).toBe(report.compliance);
      expect(parsed.score).toBe(report.score);
    });
  });
});
