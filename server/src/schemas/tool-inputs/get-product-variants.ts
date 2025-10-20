import { z } from 'zod';

import { TemporalPaginationSchema } from './shared/filters.js';

export const GetProductVariantsInputSchema = z
  .object({
    variantIds: z.array(z.string()).describe('Unique variant IDs in the fulfillment system'),
    skus: z.array(z.string()).describe('Variant SKUs (Stock Keeping Units)'),
    productIds: z.array(z.string()).describe('Parent product IDs; returns all variants under each product'),
  })
  .partial()
  .extend(TemporalPaginationSchema.shape);

export type GetProductVariantsInput = z.infer<typeof GetProductVariantsInputSchema>;
