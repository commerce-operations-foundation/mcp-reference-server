/**
 * Get Shipment Tool
 * Retrieves shipment information by identifier
 */

import { BaseTool } from '../base-tool.js';
import { JSONSchema } from '../../types/mcp.js';
import { GetFulfillmentsInputSchema, GetFulfillmentsInput } from '../../schemas/tool-inputs/index.js';
import { toJsonSchema } from '../../schemas/utils/schema-util.js';

export class GetFulfillments extends BaseTool {
  name = 'get-fulillments';

  description =
    'Retrieves shipping details and tracking information for customer updates or delivery verification. Use when: answering "where is my order" inquiries, providing tracking updates, verifying delivery completion, or investigating shipping issues. Searches by shipment ID, order ID, or carrier tracking number.';

  inputSchema: JSONSchema = toJsonSchema(GetFulfillmentsInputSchema);

  async execute(input: GetFulfillmentsInput): Promise<any> {
    // Delegate to service layer
    return this.serviceLayer.getFulfillments(input);
  }
}
