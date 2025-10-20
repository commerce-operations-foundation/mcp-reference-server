/**
 * Get Product Variants Tool
 * Retrieves SKU-level variant details for catalog products.
 */

import { BaseTool } from '../base-tool.js';
import { JSONSchema } from '../../types/mcp.js';
import { toJsonSchema } from '../../schemas/utils/schema-util.js';
import {
  GetProductVariantsInput,
  GetProductVariantsInputSchema,
} from '../../schemas/tool-inputs/index.js';

export class GetProductVariantsTool extends BaseTool {
  name = 'get-product-variants';

  description =
    'Retrieves detailed SKU-level product variant information, including option selections, pricing, and inventory tracking flags. Use when you need variant-specific data for merchandising, order validation, or inventory operations. Supports lookups by variant ID, SKU, or parent product ID.';

  inputSchema: JSONSchema = toJsonSchema(GetProductVariantsInputSchema);

  async execute(input: GetProductVariantsInput): Promise<any> {
    return this.serviceLayer.getProductVariants(input);
  }
}
