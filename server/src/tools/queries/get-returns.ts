import { BaseTool } from '../base-tool.js';
import { JSONSchema } from '../../types/mcp.js';
import { toJsonSchema } from '../../schemas/utils/schema-util.js';
import { GetReturnsInputSchema, GetReturnsInput } from '../../schemas/tool-inputs/index.js';

export class GetReturnsTool extends BaseTool {
  name = 'get-returns';

  description =
    'Retrieves return records with filtering by return ID, order ID, return number, status, or outcome. Use when: tracking return status, finding returns for specific orders, or generating return reports.';

  inputSchema: JSONSchema = toJsonSchema(GetReturnsInputSchema);

  async execute(input: GetReturnsInput): Promise<any> {
    return this.serviceLayer.getReturns(input);
  }
}
