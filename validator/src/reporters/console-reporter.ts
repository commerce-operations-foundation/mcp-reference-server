/**
 * Console Reporter
 * Formats compliance reports for terminal output
 */

import { ComplianceReport, ToolValidationResult } from '../types.js';
import { ONX_TOOLS } from '@onx/schemas';

const colors = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  blue: (s: string) => `\x1b[34m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
};

export class ConsoleReporter {
  print(report: ComplianceReport): void {
    this.printHeader(report);
    this.printSummary(report);
    this.printToolResults(report);
    this.printFooter(report);
  }

  private printHeader(report: ComplianceReport): void {
    console.log();
    console.log(colors.bold('═══════════════════════════════════════════════════════════════'));
    console.log(colors.bold('                    onX MCP Compliance Report                   '));
    console.log(colors.bold('═══════════════════════════════════════════════════════════════'));
    console.log();
    console.log(`  Server:    ${colors.cyan(report.serverInfo.name)} v${report.serverInfo.version}`);
    console.log(`  Protocol:  ${report.serverInfo.protocolVersion}`);
    console.log(`  Transport: ${report.transport}`);
    console.log(`  Timestamp: ${report.timestamp}`);
    console.log();
  }

  private printSummary(report: ComplianceReport): void {
    const { summary, compliance, score } = report;

    let complianceBadge: string;
    switch (compliance) {
      case 'full':
        complianceBadge = colors.green('● FULLY COMPLIANT');
        break;
      case 'partial':
        complianceBadge = colors.yellow('◐ PARTIALLY COMPLIANT');
        break;
      case 'non-compliant':
        complianceBadge = colors.red('○ NON-COMPLIANT');
        break;
    }

    console.log(colors.bold('─── Summary ─────────────────────────────────────────────────────'));
    console.log();
    console.log(`  Status: ${complianceBadge}`);
    console.log(`  Score:  ${this.formatScore(score)}`);
    console.log();
    console.log(`  Tools on Server:       ${summary.totalTools}`);
    console.log(`  onX Tools Implemented: ${summary.onXToolsImplemented}/${summary.onXTools}`);
    console.log(`  onX Tools Missing:     ${summary.missingTools > 0 ? colors.red(String(summary.missingTools)) : '0'}`);
    console.log(`  Other Tools:           ${summary.otherTools}`);
    console.log(`  Checks Passed:         ${colors.green(String(summary.passedChecks))}`);
    console.log(`  Checks Failed:         ${summary.failedChecks > 0 ? colors.red(String(summary.failedChecks)) : '0'}`);
    console.log(`  Warnings:              ${summary.warnings > 0 ? colors.yellow(String(summary.warnings)) : '0'}`);

    console.log();
  }

  private printToolResults(report: ComplianceReport): void {
    console.log(colors.bold('─── Tool Details ────────────────────────────────────────────────'));
    console.log();

    for (const toolName of ONX_TOOLS) {
      const result = report.tools.find(t => t.tool === toolName);
      this.printToolResult(toolName, result);
    }

    const extraTools = report.tools.filter(
      t => !ONX_TOOLS.includes(t.tool as any)
    );
    if (extraTools.length > 0) {
      console.log(colors.dim('  Additional Tools:'));
      for (const tool of extraTools) {
        console.log(`    ${colors.dim('○')} ${colors.dim(tool.tool)}`);
      }
      console.log();
    }
  }

  private printToolResult(toolName: string, result?: ToolValidationResult): void {
    if (!result || !result.exists) {
      console.log(`  ${colors.red('✗')} ${toolName} ${colors.red('(missing)')}`);
      return;
    }

    const allPassed = result.schemaValid && result.functionalValid && result.errors.length === 0;
    const icon = allPassed ? colors.green('✓') : colors.yellow('◐');
    const status = allPassed ? '' : colors.yellow(`(${result.errors.length} issues)`);

    console.log(`  ${icon} ${toolName} ${status}`);

    for (const error of result.errors.filter(e => !e.passed)) {
      console.log(`      ${colors.red('└─')} ${error.message}`);
    }

    for (const warning of result.warnings) {
      console.log(`      ${colors.yellow('└─')} ${warning.message}`);
    }
  }

  private printFooter(report: ComplianceReport): void {
    console.log(colors.bold('═══════════════════════════════════════════════════════════════'));

    if (report.compliance === 'full') {
      console.log();
      console.log(colors.green('  ✓ This server is fully compliant with the onX MCP specification.'));
      console.log();
    } else {
      console.log();
      console.log(colors.yellow('  ⚠ This server has compliance issues. See details above.'));
      console.log();
    }
  }

  private formatScore(score: number): string {
    const bar = this.createProgressBar(score, 20);
    let color = colors.green;
    if (score < 50) color = colors.red;
    else if (score < 80) color = colors.yellow;

    return `${color(bar)} ${score}%`;
  }

  private createProgressBar(percent: number, width: number): string {
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }
}
