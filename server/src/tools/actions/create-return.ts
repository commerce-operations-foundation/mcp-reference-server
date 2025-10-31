import { BaseTool } from '../base-tool.js';
import { JSONSchema } from '../../types/mcp.js';
import { toJsonSchema } from '../../schemas/utils/schema-util.js';
import { CreateReturnInputSchema, CreateReturnInput } from '../../schemas/tool-inputs/index.js';

export class CreateReturnTool extends BaseTool {
  name = 'create-return';

  description =
    'Creates a new return for items from an existing order. Use when: processing customer return requests, initiating RMA workflows, or creating exchange transactions. Tracks return status, refund amounts, and item conditions. Required: order ID, return line items with SKUs and quantities, and return outcome (refund/exchange).';

  inputSchema: JSONSchema = toJsonSchema(CreateReturnInputSchema);

  async execute(input: CreateReturnInput): Promise<any> {
    return this.serviceLayer.createReturn(input);
  }
}
