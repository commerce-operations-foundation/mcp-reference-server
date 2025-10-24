import { z } from 'zod';

import { TemporalPaginationSchema } from './shared/filters.js';

export const GetOrdersInputSchema = z
  .object({
    ids: z.array(z.string()).describe('Internal order ID, could be a comma separated list'),
    externalIds: z.array(z.string()).describe('External order ID from source system, could be a comma separated list'),
    statuses: z.array(z.string()).describe('Order status'),
    names: z.array(z.string()).describe('Friendly Order identifier'),
    includeLineItems: z.boolean().default(true).describe('Whether to include detailed line item information'),
    includeShipments: z.boolean().default(true).describe('Whether to include shipment information'),
    includePayments: z.boolean().default(false).describe('Whether to include payment information'),
    includeHistory: z.boolean().default(false).describe('Whether to include order status history'),
  })
  .partial()
  .extend(TemporalPaginationSchema.shape);
export type GetOrdersInput = z.infer<typeof GetOrdersInputSchema>;
