import { z } from 'zod';

export const GetInventoryInputSchema = z
  .object({
    skus: z.array(z.string()).describe('Product SKU to get inventory for (required)'),
    locationIds: z
      .array(z.string())
      .optional()
      .describe('Specific warehouse/location ID (optional - if not provided, returns aggregated inventory)'),
  })
  .refine((data) => data.skus.length > 0, {
    message: 'At least one SKU is required',
  });
export type GetInventoryInput = z.infer<typeof GetInventoryInputSchema>;
