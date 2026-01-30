/**
 * Main Validator Orchestrator
 * Coordinates all validation steps and generates report
 */

import { McpTransport } from './transports/base.js';
import { StdioTransport } from './transports/stdio.js';
import { HttpTransport } from './transports/http.js';
import { ToolValidator, FunctionalValidator } from './validators/index.js';
import { ReportGenerator, ConsoleReporter } from './reporters/index.js';
import { ComplianceReport, StdioTransportConfig, HttpTransportConfig } from './types.js';

export interface ValidatorOptions {
  /** Run functional tests (calls tools with test data) */
  functionalTests?: boolean;
  /** Output format */
  format?: 'console' | 'json';
  /** Verbose output */
  verbose?: boolean;
}

const defaultOptions: ValidatorOptions = {
  functionalTests: true,
  format: 'console',
  verbose: false,
};

export class OnxValidator {
  private transport: McpTransport;
  private transportType: 'stdio' | 'http';
  private options: ValidatorOptions;

  private constructor(transport: McpTransport, transportType: 'stdio' | 'http', options: ValidatorOptions) {
    this.transport = transport;
    this.transportType = transportType;
    this.options = { ...defaultOptions, ...options };
  }

  /**
   * Create validator for a stdio-based MCP server
   */
  static forStdio(config: StdioTransportConfig, options: ValidatorOptions = {}): OnxValidator {
    const transport = new StdioTransport(config);
    return new OnxValidator(transport, 'stdio', options);
  }

  /**
   * Create validator for an HTTP-based MCP server
   */
  static forHttp(config: HttpTransportConfig, options: ValidatorOptions = {}): OnxValidator {
    const transport = new HttpTransport(config);
    return new OnxValidator(transport, 'http', options);
  }

  /**
   * Run the full validation suite
   */
  async validate(): Promise<ComplianceReport> {
    const toolValidator = new ToolValidator();
    const reportGenerator = new ReportGenerator();

    try {
      // Connect to server
      if (this.options.verbose) {
        console.log('Connecting to MCP server...');
      }
      await this.transport.connect();

      // Get server info
      const serverInfo = await this.transport.getServerInfo();
      if (this.options.verbose) {
        console.log(`Connected to ${serverInfo.name} v${serverInfo.version}`);
      }

      // List tools
      if (this.options.verbose) {
        console.log('Fetching tool list...');
      }
      const tools = await this.transport.listTools();
      if (this.options.verbose) {
        console.log(`Found ${tools.length} tools`);
      }

      // Validate tool presence and schemas
      if (this.options.verbose) {
        console.log('Validating tool schemas...');
      }
      const toolResults = toolValidator.validateAll(tools);

      // Run functional tests if enabled
      let functionalResults = new Map<string, any[]>();
      if (this.options.functionalTests) {
        if (this.options.verbose) {
          console.log('Running functional tests...');
        }
        const functionalValidator = new FunctionalValidator(this.transport);
        functionalResults = await functionalValidator.runAllTests();
      }

      // Generate report
      const report = reportGenerator.generate(
        serverInfo,
        toolResults,
        functionalResults,
        this.transportType
      );

      return report;
    } finally {
      // Always disconnect
      await this.transport.disconnect();
    }
  }

  /**
   * Run validation and print results
   */
  async run(): Promise<ComplianceReport> {
    const report = await this.validate();

    if (this.options.format === 'json') {
      const generator = new ReportGenerator();
      console.log(generator.toJSON(report));
    } else {
      const consoleReporter = new ConsoleReporter();
      consoleReporter.print(report);
    }

    return report;
  }
}
