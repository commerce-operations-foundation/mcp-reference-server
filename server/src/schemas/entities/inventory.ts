import { z } from 'zod';

import { ObjectProps } from '../common.js';

/**
 * Inventory entity schema.
 */
export const inventorySchema = z
  .object({
    available: z.number(),
    availableToPromise: z.number(),
    commitShip: z.number(),
    commitXfer: z.number(),
    committed: z.number(),
    committedFuture: z.number(),
    damaged: z.number(),
    future: z.number(),
    hold: z.number(),
    incoming: z.number(),
    inventoryNotTracked: z.boolean(),
    label: z.string(),
    locationId: z.string(),
    onHand: z.number(),
    quantity: z.number(),
    sku: z.string(),
    unavailable: z.number(),
  })
  .partial()
  .required({
    sku: true,
    locationId: true,
  })
  .extend(ObjectProps.shape)
  .describe('Inventory Item');

export type Inventory = z.infer<typeof inventorySchema>;
