/**
 * Ship Order Tool
 * Processes shipment of an order
 */

import { BaseTool } from '../base-tool.js';
import { JSONSchema } from '../../types/mcp.js';
import { toJsonSchema } from '../../schemas/utils/schema-util.js';
import { FulfillOrderInputSchema, FulfillOrderInput } from '../../schemas/tool-inputs/index.js';

export class FulfillOrderTool extends BaseTool {
  name = 'fulfill-order';

  description =
    'Marks an order as shipped and creates tracking records when items leave the warehouse. Use when: warehouse confirms dispatch, carrier picks up package, or dropshipper provides tracking. Creates shipment record with tracking info and updates order status. Required: order ID, carrier, tracking number, and shipped items.';

  inputSchema: JSONSchema = toJsonSchema(FulfillOrderInputSchema);

  async execute(input: FulfillOrderInput): Promise<any> {
    // Delegate to service layer
    return this.serviceLayer.fulfillOrder(input);
  }
}
