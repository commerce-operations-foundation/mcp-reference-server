import { z } from 'zod';

import { TemporalPaginationSchema } from './shared/filters.js';

export const GetFulfillmentsInputSchema = z
  .object({
    ids: z.array(z.string()).describe('Unique shipment ID in the Fulfillment System'),
    orderIds: z.array(z.string()).describe('Order ID associated with the shipment'),
  })
  .partial()
  .extend(TemporalPaginationSchema.shape);
export type GetFulfillmentsInput = z.infer<typeof GetFulfillmentsInputSchema>;
