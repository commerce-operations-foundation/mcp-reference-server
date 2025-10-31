import { BaseTool } from '../base-tool.js';
import { JSONSchema } from '../../types/mcp.js';
import { toJsonSchema } from '../../schemas/utils/schema-util.js';
import { UpdateOrderInputSchema, UpdateOrderInput } from '../../schemas/tool-inputs/index.js';

export class UpdateOrderTool extends BaseTool {
  name = 'update-order';

  description =
    'Modifies order details when corrections or changes are needed before fulfillment. Use when: correcting addresses, updating quantities, changing shipping methods, or adding notes. Restrictions apply based on order status - shipped orders have limited editability. Check order status first with get-order.';

  inputSchema: JSONSchema = toJsonSchema(UpdateOrderInputSchema);

  async execute(input: UpdateOrderInput): Promise<any> {
    return this.serviceLayer.updateOrder(input);
  }
}
