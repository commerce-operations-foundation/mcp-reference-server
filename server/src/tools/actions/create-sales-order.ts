/**
 * Capture Order Tool
 * Creates a new order in the system
 */

import { BaseTool } from '../base-tool.js';
import { JSONSchema } from '../../types/mcp.js';
import { toJsonSchema } from '../../schemas/utils/schema-util.js';
import { CreateSalesOrderInputSchema, CreateSalesOrderInput } from '../../schemas/tool-inputs/index.js';

export class CreateSalesOrderTool extends BaseTool {
  name = 'create-sales-order';

  description =
    'Creates a new order when a customer completes checkout or when importing orders from external systems. Use when: processing new purchases, migrating orders from other platforms, or creating manual orders. Automatically reserves inventory and initiates fulfillment workflow. Required: external order ID and line items with SKUs, quantities, and prices.';

  inputSchema: JSONSchema = toJsonSchema(CreateSalesOrderInputSchema);

  async execute(input: CreateSalesOrderInput): Promise<any> {
    // Delegate to service layer
    return this.serviceLayer.createSalesOrder(input);
  }
}
