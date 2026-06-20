import { McpTransport, McpToolResult } from '../transports/index.js';
import { ValidationResult, JSONSchema } from '../types.js';
import { ONX_TOOLS, getToolInputSchema } from '@onx/schemas';

interface TestCase {
  tool: string;
  name: string;
  input: Record<string, unknown>;
  expectIsError?: boolean;
}

export class FunctionalValidator {
  private transport: McpTransport;

  constructor(transport: McpTransport) {
    this.transport = transport;
  }

  /**
   * Run functional tests for all tools
   */
  async runAllTests(): Promise<Map<string, ValidationResult[]>> {
    const results = new Map<string, ValidationResult[]>();

    for (const tool of ONX_TOOLS) {
      const toolResults = await this.runToolTests(tool);
      results.set(tool, toolResults);
    }

    return results;
  }

  /**
   * Run tests for a specific tool
   */
  async runToolTests(tool: string): Promise<ValidationResult[]> {
    const testCases = this.generateTestCases(tool);
    const results: ValidationResult[] = [];

    for (const testCase of testCases) {
      try {
        const response = await this.transport.callTool(testCase.tool, testCase.input);
        const validation = this.validateResponse(response, testCase);
        results.push(validation);
      } catch (error) {
        results.push({
          passed: false,
          tool: testCase.tool,
          check: `functional-${testCase.name}`,
          message: `Test threw exception: ${error instanceof Error ? error.message : String(error)}`,
          details: { input: testCase.input },
        });
      }
    }

    return results;
  }

  /**
   * Validate an MCP tool response against test expectations
   */
  private validateResponse(response: McpToolResult, testCase: TestCase): ValidationResult {
    // Check response has required structure
    if (!Array.isArray(response.content)) {
      return {
        passed: false,
        tool: testCase.tool,
        check: `functional-${testCase.name}`,
        message: 'Response missing content array',
        details: { input: testCase.input, response },
      };
    }

    if (typeof response.isError !== 'boolean') {
      return {
        passed: false,
        tool: testCase.tool,
        check: `functional-${testCase.name}`,
        message: 'Response missing isError boolean',
        details: { input: testCase.input, response },
      };
    }

    // If we have a specific expectation for isError, validate it
    if (testCase.expectIsError !== undefined) {
      if (response.isError !== testCase.expectIsError) {
        const expected = testCase.expectIsError ? 'error' : 'success';
        const got = response.isError ? 'error' : 'success';
        const errorText = response.content.find(c => c.type === 'text')?.text || '';
        return {
          passed: false,
          tool: testCase.tool,
          check: `functional-${testCase.name}`,
          message: `Expected ${expected} but got ${got}${errorText ? `: ${errorText}` : ''}`,
          details: { input: testCase.input, response },
        };
      }
    }

    // Response is valid
    return {
      passed: true,
      tool: testCase.tool,
      check: `functional-${testCase.name}`,
      message: `Test "${testCase.name}" passed`,
    };
  }

  /**
   * Generate test cases automatically from the tool's JSON schema
   */
  private generateTestCases(tool: string): TestCase[] {
    const schema = getToolInputSchema(tool) as JSONSchema | null;
    if (!schema) {
      return [];
    }

    const testCases: TestCase[] = [];
    const required = schema.required || [];

    // Test 1: Empty input - should error if there are required fields
    if (required.length > 0) {
      testCases.push({
        tool,
        name: 'empty-input',
        input: {},
        expectIsError: true,
      });
    }

    // Test 2: For each required field, test with it missing - should error
    for (const field of required) {
      const minimalValid = this.buildMinimalValidInput(schema);
      delete minimalValid[field];

      testCases.push({
        tool,
        name: `missing-required-${field}`,
        input: minimalValid,
        expectIsError: true,
      });
    }

    // Test 3: Minimal valid input - should get a valid response (don't care about isError)
    testCases.push({
      tool,
      name: 'schema-valid-input',
      input: this.buildMinimalValidInput(schema),
      expectIsError: undefined, // Any response is fine - "not found" is valid
    });

    return testCases;
  }

  /**
   * Build a minimal valid input object based on schema requirements
   */
  private buildMinimalValidInput(schema: JSONSchema, path = ''): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const required = schema.required || [];
    const properties = schema.properties || {};

    for (const field of required) {
      const propSchema = properties[field] as JSONSchema | undefined;
      if (!propSchema) continue;

      result[field] = this.generateValueForSchema(propSchema, `${path}.${field}`);
    }

    return result;
  }

  /**
   * Generate a valid value for a given schema type
   */
  private generateValueForSchema(schema: JSONSchema, path: string): unknown {
    switch (schema.type) {
      case 'string':
        return `test-${path.replace(/\./g, '-')}`;

      case 'number':
      case 'integer':
        return schema.minimum ?? 1;

      case 'boolean':
        return true;

      case 'array': {
        const itemSchema = schema.items as JSONSchema | undefined;
        if (itemSchema) {
          return [this.generateValueForSchema(itemSchema, `${path}[0]`)];
        }
        return [];
      }

      case 'object': {
        return this.buildMinimalValidInput(schema, path);
      }

      default:
        return null;
    }
  }
}
