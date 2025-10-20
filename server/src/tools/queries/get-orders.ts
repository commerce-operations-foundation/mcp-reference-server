/**
 * Get Order Tool
 * Retrieves order information by ID or external ID
 */

import { BaseTool } from '../base-tool.js';
import { JSONSchema } from '../../types/mcp.js';
import { toJsonSchema } from '../../schemas/utils/schema-util.js';
import { GetOrdersInputSchema, GetOrdersInput } from '../../schemas/tool-inputs/index.js';

export class GetOrdersTool extends BaseTool {
  name = 'get-orders';

  description =
    'Retrieves orders details when you need to check order status, view line items, track fulfillment progress, or investigate customer inquiries. Use when: displaying order information, verifying order existence, checking shipping status, or before performing order modifications. Accepts order ID, external ID, or order number.';

  inputSchema: JSONSchema = toJsonSchema(GetOrdersInputSchema);

  async execute(input: GetOrdersInput): Promise<any> {
    // Delegate to service layer
    return this.serviceLayer.getOrders(input);
  }
}
