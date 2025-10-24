import { BaseTool } from '../base-tool.js';
import { JSONSchema } from '../../types/mcp.js';
import { toJsonSchema } from '../../schemas/utils/schema-util.js';
import { GetProductsInputSchema, GetProductsInput } from '../../schemas/tool-inputs/index.js';

export class GetProductsTool extends BaseTool {
  name = 'get-products';

  description =
    'Retrieves product details including pricing, descriptions, and attributes when you need to display product information, validate SKUs, or check product availability. Use when: adding items to orders, verifying product existence, displaying catalogs, or calculating pricing. Searches by product ID or SKU.';

  inputSchema: JSONSchema = toJsonSchema(GetProductsInputSchema);

  async execute(input: GetProductsInput): Promise<any> {
    return this.serviceLayer.getProducts(input);
  }
}
