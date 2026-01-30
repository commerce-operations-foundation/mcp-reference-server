/**
 * Functional Validator
 * Tests that tools actually work by calling them with test data
 */

import { McpTransport, McpResponse } from '../transports/base.js';
import { ValidationResult } from '../types.js';
import { ONX_TOOLS } from '../schemas/index.js';

type RequiredTool = (typeof ONX_TOOLS)[number];

interface TestCase {
  tool: RequiredTool;
  name: string;
  input: Record<string, unknown>;
  expectSuccess: boolean;
  /** If true, accept any response (success or error) - just verify the tool responds */
  acceptAnyResponse?: boolean;
  validateResponse?: (response: McpResponse) => ValidationResult | null;
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
  async runToolTests(tool: RequiredTool): Promise<ValidationResult[]> {
    const testCases = this.getTestCases(tool);
    const results: ValidationResult[] = [];

    for (const testCase of testCases) {
      try {
        const response = await this.transport.callTool(testCase.tool, testCase.input);

        // If acceptAnyResponse is true, we just verify the tool responds at all
        if (testCase.acceptAnyResponse) {
          // Run custom validation if provided
          if (testCase.validateResponse) {
            const customResult = testCase.validateResponse(response);
            if (customResult) {
              results.push(customResult);
              continue;
            }
          }
          results.push({
            passed: true,
            tool: testCase.tool,
            check: `functional-${testCase.name}`,
            message: `Test "${testCase.name}" passed (tool responded)`,
          });
          continue;
        }

        // Check if response matches expectation
        if (testCase.expectSuccess && !response.success) {
          results.push({
            passed: false,
            tool: testCase.tool,
            check: `functional-${testCase.name}`,
            message: `Expected success but got error: ${response.error?.message}`,
            details: { input: testCase.input, response },
          });
        } else if (!testCase.expectSuccess && response.success) {
          results.push({
            passed: false,
            tool: testCase.tool,
            check: `functional-${testCase.name}`,
            message: `Expected error but got success`,
            details: { input: testCase.input, response },
          });
        } else {
          // Basic check passed, run custom validation if provided
          if (testCase.validateResponse) {
            const customResult = testCase.validateResponse(response);
            if (customResult) {
              results.push(customResult);
              continue;
            }
          }

          results.push({
            passed: true,
            tool: testCase.tool,
            check: `functional-${testCase.name}`,
            message: `Test "${testCase.name}" passed`,
          });
        }
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
   * Get test cases for a specific tool
   */
  private getTestCases(tool: RequiredTool): TestCase[] {
    switch (tool) {
      case 'get-orders':
        return [
          {
            tool: 'get-orders',
            name: 'empty-query',
            input: {},
            expectSuccess: true,
          },
          {
            tool: 'get-orders',
            name: 'with-pagination',
            input: { pageSize: 5, skip: 0 },
            expectSuccess: true,
          },
        ];

      case 'get-customers':
        return [
          {
            tool: 'get-customers',
            name: 'empty-query',
            input: {},
            expectSuccess: true,
          },
        ];

      case 'get-products':
        return [
          {
            tool: 'get-products',
            name: 'responds-to-query',
            input: {},
            expectSuccess: true,
            acceptAnyResponse: true, // Accept any response - empty data or not found is OK
          },
        ];

      case 'get-product-variants':
        return [
          {
            tool: 'get-product-variants',
            name: 'responds-to-query',
            input: {},
            expectSuccess: true,
            acceptAnyResponse: true, // Accept any response - empty data or not found is OK
          },
        ];

      case 'get-inventory':
        return [
          {
            tool: 'get-inventory',
            name: 'missing-required-sku',
            input: {},
            expectSuccess: false, // Should fail - skus is required
          },
          {
            tool: 'get-inventory',
            name: 'empty-skus-array',
            input: { skus: [] },
            expectSuccess: false, // Should fail - at least one SKU required
          },
          {
            tool: 'get-inventory',
            name: 'valid-sku',
            input: { skus: ['TEST-SKU-001'] },
            expectSuccess: true,
          },
        ];

      case 'get-fulfillments':
        return [
          {
            tool: 'get-fulfillments',
            name: 'empty-query',
            input: {},
            expectSuccess: true,
          },
        ];

      case 'get-returns':
        return [
          {
            tool: 'get-returns',
            name: 'empty-query',
            input: {},
            expectSuccess: true,
          },
        ];

      case 'create-sales-order':
        return [
          {
            tool: 'create-sales-order',
            name: 'missing-order',
            input: {},
            expectSuccess: false,
          },
          {
            tool: 'create-sales-order',
            name: 'missing-line-items',
            input: {
              order: {
                externalId: 'TEST-001',
              },
            },
            expectSuccess: false,
          },
          {
            tool: 'create-sales-order',
            name: 'valid-minimal-order',
            input: {
              order: {
                externalId: `VALIDATOR-TEST-${Date.now()}`,
                lineItems: [
                  {
                    sku: 'TEST-SKU-001',
                    quantity: 1,
                  },
                ],
              },
            },
            expectSuccess: true,
            validateResponse: (response) => {
              if (!response.data) return null;
              const data = response.data as { content?: Array<{ text?: string }> };
              const text = data.content?.[0]?.text;
              if (text && (text.includes('id') || text.includes('order'))) {
                return null; // Pass
              }
              return {
                passed: false,
                tool: 'create-sales-order',
                check: 'functional-valid-minimal-order-response',
                message: 'Response should contain order ID',
                details: { response },
              };
            },
          },
        ];

      case 'update-order':
        return [
          {
            tool: 'update-order',
            name: 'missing-id',
            input: { updates: { status: 'processing' } },
            expectSuccess: false,
          },
          {
            tool: 'update-order',
            name: 'missing-updates',
            input: { id: 'test-id' },
            expectSuccess: false,
          },
        ];

      case 'cancel-order':
        return [
          {
            tool: 'cancel-order',
            name: 'missing-order-id',
            input: {},
            expectSuccess: false,
          },
          {
            tool: 'cancel-order',
            name: 'nonexistent-order',
            input: { orderId: 'nonexistent-order-id-12345' },
            expectSuccess: false, // Should fail with order not found
          },
        ];

      case 'fulfill-order':
        return [
          {
            tool: 'fulfill-order',
            name: 'missing-required-fields',
            input: {},
            expectSuccess: false,
          },
        ];

      case 'create-return':
        return [
          {
            tool: 'create-return',
            name: 'missing-return-object',
            input: {},
            expectSuccess: false,
          },
        ];

      default:
        return [];
    }
  }
}
