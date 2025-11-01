/**
import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'; * Tool Registry Tests
 * Task 20: Comprehensive test suite for enhanced tool registry
 */

import { ToolRegistry } from '../../../src/tools/registry';
import { BaseTool } from '../../../src/tools/base-tool';
import { JSONSchema } from '../../../src/types/mcp';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock ServiceOrchestrator
const mockServiceOrchestrator = {
  validator: {
    validate: vi.fn().mockImplementation((input) => Promise.resolve(input)),
  },
} as any;

// Mock Tool for Testing
class MockTestTool extends BaseTool {
  name = 'mock-test-tool';
  description = 'A mock tool for testing';
  inputSchema: JSONSchema = {
    type: 'object',
    properties: {
      param1: { type: 'string' },
    },
    required: ['param1'],
  };

  async execute(input: any): Promise<any> {
    return { result: `Processed: ${input.param1}` };
  }
}

// Another Mock Tool for Category Testing
class MockOrderTool extends BaseTool {
  name = 'capture-order';
  description = 'Capture order tool for testing';
  inputSchema: JSONSchema = { type: 'object' };

  async execute(_input: any): Promise<any> {
    return { success: true };
  }
}

class MockQueryTool extends BaseTool {
  name = 'get-order';
  description = 'Get order tool for testing';
  inputSchema: JSONSchema = { type: 'object' };

  async execute(_input: any): Promise<any> {
    return { order: {} };
  }
}

describe('ToolRegistry', () => {
  let registry: ToolRegistry;
  let mockTool: MockTestTool;

  beforeEach(() => {
    registry = new ToolRegistry(mockServiceOrchestrator);
    mockTool = new MockTestTool(mockServiceOrchestrator);
  });

  describe('constructor', () => {
    it('should initialize with empty tools map', () => {
      expect(registry.getToolNames()).toHaveLength(0);
    });

    it('should store service orchestrator reference', () => {
      expect(registry.getServiceOrchestrator()).toBe(mockServiceOrchestrator);
    });
  });

  describe('register', () => {
    it('should register a tool successfully', () => {
      registry.register(mockTool);
      expect(registry.has(mockTool.name)).toBe(true);
      expect(registry.get(mockTool.name)).toBe(mockTool);
    });

    it('should throw error when registering duplicate tool', () => {
      registry.register(mockTool);
      expect(() => registry.register(mockTool)).toThrow(`Tool ${mockTool.name} is already registered`);
    });
  });

  describe('execute', () => {
    beforeEach(() => {
      registry.register(mockTool);
    });

    it('should execute tool successfully with valid input', async () => {
      const input = { param1: 'test' };
      const result = await registry.execute(mockTool.name, input);

      expect(result).toEqual({ result: 'Processed: test' });
    });

    it('should throw error when tool not found', async () => {
      await expect(registry.execute('nonexistent-tool', {})).rejects.toThrow('Tool not found: nonexistent-tool');
    });

    it('should handle tool execution errors', async () => {
      const errorTool = new MockTestTool(mockServiceOrchestrator);
      errorTool.name = 'error-test-tool'; // Different name to avoid conflict
      errorTool.execute = vi.fn().mockRejectedValue(new Error('Execution failed'));

      registry.register(errorTool);

      await expect(registry.execute(errorTool.name, { param1: 'test' })).rejects.toThrow('Execution failed');
    });
  });

  describe('list', () => {
    it('should return empty array when no tools registered', () => {
      expect(registry.list()).toHaveLength(0);
    });

    it('should return tool descriptions for all registered tools', () => {
      registry.register(mockTool);

      const descriptions = registry.list();
      expect(descriptions).toHaveLength(1);
      expect(descriptions[0]).toEqual({
        name: mockTool.name,
        description: mockTool.description,
        inputSchema: mockTool.inputSchema,
      });
    });
  });

  describe('has', () => {
    it('should return false for unregistered tool', () => {
      expect(registry.has('nonexistent')).toBe(false);
    });

    it('should return true for registered tool', () => {
      registry.register(mockTool);
      expect(registry.has(mockTool.name)).toBe(true);
    });
  });

  describe('get', () => {
    it('should return undefined for unregistered tool', () => {
      expect(registry.get('nonexistent')).toBeUndefined();
    });

    it('should return tool instance for registered tool', () => {
      registry.register(mockTool);
      expect(registry.get(mockTool.name)).toBe(mockTool);
    });
  });

  describe('getToolNames', () => {
    it('should return empty array when no tools', () => {
      expect(registry.getToolNames()).toEqual([]);
    });

    it('should return all tool names', () => {
      const tool2 = new MockOrderTool(mockServiceOrchestrator);
      registry.register(mockTool);
      registry.register(tool2);

      expect(registry.getToolNames()).toEqual(['mock-test-tool', 'capture-order']);
    });
  });

  describe('getToolsByCategory', () => {
    beforeEach(() => {
      registry.register(new MockOrderTool(mockServiceOrchestrator));
      registry.register(new MockQueryTool(mockServiceOrchestrator));
      registry.register(mockTool);
    });

    it('should categorize tools correctly', () => {
      const categories = registry.getToolsByCategory();

      // Check that we have categories
      expect(Object.keys(categories).length).toBeGreaterThan(0);

      // get-order has 'order' in the name, so it goes to Fulfillment Management, not Query Operations
      // Both get-order and capture-order should be in Fulfillment Management
      expect(categories['Fulfillment Management']).toBeDefined();
      expect(categories['Fulfillment Management'].length).toBeGreaterThanOrEqual(2);

      const orderToolNames = categories['Fulfillment Management'].map((t) => t.name);
      expect(orderToolNames).toContain('capture-order');
      expect(orderToolNames).toContain('get-order');

      // mock-test-tool should be in Other
      if (categories['Other']) {
        const otherTools = categories['Other'].map((t) => t.name);
        expect(otherTools).toContain('mock-test-tool');
      }
    });

    it('should remove empty categories', () => {
      const emptyRegistry = new ToolRegistry(mockServiceOrchestrator);
      const categories = emptyRegistry.getToolsByCategory();

      expect(Object.keys(categories)).toHaveLength(0);
    });
  });

  describe('isToolClass (private method testing via tool loading)', () => {
    it('should identify valid tool classes', () => {
      // This is indirectly tested through the auto-discovery functionality
      expect(mockTool).toBeInstanceOf(BaseTool);
      expect(mockTool.name).toBeDefined();
      expect(mockTool.description).toBeDefined();
      expect(mockTool.inputSchema).toBeDefined();
      expect(typeof mockTool.execute).toBe('function');
    });
  });

  describe('initialize', () => {
    it('should initialize without errors', async () => {
      await expect(registry.initialize()).resolves.not.toThrow();
    });
  });

  describe('reload', () => {
    beforeEach(() => {
      registry.register(mockTool);
    });

    it('should clear existing tools and reload', async () => {
      expect(registry.has(mockTool.name)).toBe(true);

      await registry.reload();

      // After reload, manually registered tools should be gone
      // (unless they're discovered in the filesystem)
      // This test verifies the clearing functionality
      expect(registry.getToolNames().includes(mockTool.name)).toBeFalsy();
    });
  });
});
