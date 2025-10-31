import { BaseTool } from '../base-tool.js';
import { JSONSchema } from '../../types/mcp.js';
import { toJsonSchema } from '../../schemas/utils/schema-util.js';
import { CancelOrderInputSchema, CancelOrderInput } from '../../schemas/tool-inputs/index.js';

export class CancelOrderTool extends BaseTool {
  name = 'cancel-order';

  description =
    'Cancels an order to stop fulfillment and release reserved inventory. Use when: customer requests cancellation, payment fails, fraud is detected, or items become unavailable. Only works for orders not yet shipped. Triggers: inventory release, refund processing, and customer notifications based on configuration.';

  inputSchema: JSONSchema = toJsonSchema(CancelOrderInputSchema);

  async execute(input: CancelOrderInput): Promise<any> {
    // Delegate to service layer
    return this.serviceLayer.cancelOrder(input);
  }
}
