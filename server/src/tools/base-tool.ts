/**
 * Base Tool Abstract Class
 * All tools extend this base class
 */

import { ServiceOrchestrator } from '../services/service-orchestrator.js';
import { JSONSchema } from '../types/index.js';
import { Validator } from '../services/validator.js';

export abstract class BaseTool<TInput = any, TOutput = any> {
  abstract name: string;
  abstract description: string;
  abstract inputSchema: JSONSchema;
  outputSchema?: JSONSchema;
  protected serviceLayer: ServiceOrchestrator;
  private validator: Validator;

  constructor(serviceLayer: ServiceOrchestrator) {
    this.serviceLayer = serviceLayer;
    this.validator = new Validator();
  }

  async validateInput(input: unknown): Promise<TInput> {
    return this.validator.validate(input, this.inputSchema);
  }

  abstract execute(input: TInput): Promise<TOutput>;

  /**
   * Get tool description for MCP protocol
   */
  getDescription(): {
    name: string;
    description: string;
    inputSchema: JSONSchema;
  } {
    return {
      name: this.name,
      description: this.description,
      inputSchema: this.inputSchema,
    };
  }
}
