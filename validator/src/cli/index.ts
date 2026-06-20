#!/usr/bin/env node

import { Command } from 'commander';
import { OnxValidator } from '../validator.js';
import { ComplianceReport } from '../types.js';

function exitWithCompliance(report: ComplianceReport): never {
  if (report.compliance === 'full') {
    process.exit(0);
  } else if (report.compliance === 'partial') {
    process.exit(1);
  } else {
    process.exit(2);
  }
}

const program = new Command();

program
  .name('onx-validate')
  .description('Validate MCP servers against the onX specification')
  .version('1.0.0');

program
  .command('stdio')
  .description('Validate a stdio-based MCP server')
  .argument('<command>', 'Command to start the MCP server')
  .option('-a, --args <args...>', 'Arguments to pass to the server command')
  .option('-e, --env <env...>', 'Environment variables (KEY=VALUE)')
  .option('--no-functional', 'Skip functional tests')
  .option('-f, --format <format>', 'Output format (console, json)', 'console')
  .option('-v, --verbose', 'Verbose output')
  .action(async (command: string, options: {
    args?: string[];
    env?: string[];
    functional: boolean;
    format: string;
    verbose?: boolean;
  }) => {
    const env: Record<string, string> = {};
    if (options.env) {
      for (const envVar of options.env) {
        const [key, ...valueParts] = envVar.split('=');
        if (key && valueParts.length > 0) {
          env[key] = valueParts.join('=');
        }
      }
    }

    const validator = OnxValidator.create(
      { type: 'stdio', command, args: options.args, env },
      { functionalTests: options.functional, format: options.format as 'console' | 'json', verbose: options.verbose }
    );

    try {
      const report = await validator.run();
      exitWithCompliance(report);
    } catch (error) {
      console.error('Validation failed:', error instanceof Error ? error.message : error);
      process.exit(3);
    }
  });

program
  .command('http')
  .description('Validate an HTTP-based MCP server')
  .argument('<url>', 'URL of the MCP server endpoint')
  .option('-H, --header <headers...>', 'HTTP headers (Header: Value)')
  .option('--no-functional', 'Skip functional tests')
  .option('-f, --format <format>', 'Output format (console, json)', 'console')
  .option('-v, --verbose', 'Verbose output')
  .action(async (url: string, options: {
    header?: string[];
    functional: boolean;
    format: string;
    verbose?: boolean;
  }) => {
    const headers: Record<string, string> = {};
    if (options.header) {
      for (const header of options.header) {
        const colonIndex = header.indexOf(':');
        if (colonIndex > 0) {
          const key = header.substring(0, colonIndex).trim();
          const value = header.substring(colonIndex + 1).trim();
          headers[key] = value;
        }
      }
    }

    const validator = OnxValidator.create(
      { type: 'http', url, headers: Object.keys(headers).length > 0 ? headers : undefined },
      { functionalTests: options.functional, format: options.format as 'console' | 'json', verbose: options.verbose }
    );

    try {
      const report = await validator.run();
      exitWithCompliance(report);
    } catch (error) {
      console.error('Validation failed:', error instanceof Error ? error.message : error);
      process.exit(3);
    }
  });

if (process.argv.length < 3) {
  program.help();
}

program.parse();
