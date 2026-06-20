/**
 * Report Generator
 * Generates compliance reports from validation results
 */

import {
  ComplianceReport,
  ToolValidationResult,
  ValidationResult,
} from '../types.js';
import { ONX_TOOLS } from '@onx/schemas';
import { ServerInfo } from '../transports/index.js';

export class ReportGenerator {
  generate(
    serverInfo: ServerInfo,
    toolResults: ToolValidationResult[],
    functionalResults: Map<string, ValidationResult[]>,
    transport: 'stdio' | 'http'
  ): ComplianceReport {
    for (const toolResult of toolResults) {
      const funcResults = functionalResults.get(toolResult.tool);
      if (funcResults) {
        const funcErrors = funcResults.filter(r => !r.passed);
        toolResult.errors.push(...funcErrors);
        toolResult.functionalValid = funcErrors.length === 0;
      }
    }

    // All tools on server that exist
    const serverTools = toolResults.filter(t => t.exists);

    // onX standard tools that exist on the server
    const onxImplementedTools = toolResults.filter(
      t => t.exists && ONX_TOOLS.includes(t.tool as typeof ONX_TOOLS[number])
    );

    // Non-onX tools on server (other tools)
    const otherTools = toolResults.filter(
      t => t.exists && !ONX_TOOLS.includes(t.tool as typeof ONX_TOOLS[number])
    );

    // Missing onX standard tools (count)
    const missingToolsCount = ONX_TOOLS.length - onxImplementedTools.length;

    let passedChecks = 0;
    let failedChecks = 0;
    let warnings = 0;

    for (const toolResult of toolResults) {
      const isOnxTool = ONX_TOOLS.includes(toolResult.tool as typeof ONX_TOOLS[number]);

      if (isOnxTool) {
        // Only count pass/fail for onX standard tools
        passedChecks += toolResult.errors.filter(e => e.passed).length;
        failedChecks += toolResult.errors.filter(e => !e.passed).length;

        if (toolResult.exists) {
          passedChecks++;  // Tool presence check passed
        } else {
          failedChecks++;  // Tool presence check failed
        }
      }

      // Count warnings for all tools
      warnings += toolResult.warnings.length;
    }

    const totalChecks = passedChecks + failedChecks;
    const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

    let compliance: 'full' | 'partial' | 'non-compliant';
    if (missingToolsCount === 0 && failedChecks === 0) {
      compliance = 'full';
    } else if (onxImplementedTools.length >= 1) {
      compliance = 'partial';
    } else {
      compliance = 'non-compliant';
    }

    return {
      serverInfo,
      timestamp: new Date().toISOString(),
      transport,
      summary: {
        totalTools: serverTools.length,
        otherTools: otherTools.length,
        onXTools: ONX_TOOLS.length,
        onXToolsImplemented: onxImplementedTools.length,
        missingTools: missingToolsCount,
        passedChecks,
        failedChecks,
        warnings,
      },
      tools: toolResults,
      compliance,
      score,
    };
  }

  static toJSON(report: ComplianceReport): string {
    return JSON.stringify(report, null, 2);
  }
}
