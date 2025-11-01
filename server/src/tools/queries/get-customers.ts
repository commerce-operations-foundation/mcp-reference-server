import { BaseTool } from '../base-tool.js';
import { JSONSchema } from '../../types/mcp.js';
import { toJsonSchema } from '../../schemas/utils/schema-util.js';
import { GetCustomersInputSchema, GetCustomersInput } from '../../schemas/tool-inputs/index.js';

export class GetCustomersTool extends BaseTool {
  name = 'get-customers';

  description = 'Get customers by their ID or email';

  inputSchema: JSONSchema = toJsonSchema(GetCustomersInputSchema);

  async execute(input: GetCustomersInput): Promise<any> {
    return this.serviceLayer.getCustomers(input);
  }
}
