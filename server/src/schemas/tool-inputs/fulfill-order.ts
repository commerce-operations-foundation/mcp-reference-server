/**
 * Input schema for fulfilling an order - excludes system-generated fields
 */
import { z } from 'zod';

import { FulfillmentCoreSchema } from '../entities/fulfillment.js';

// Remove immutable system-generated fields (id, createdAt, updatedAt, tenantId)
// These are set by the system and should not be provided in the input
export const FulfillOrderInputSchema = FulfillmentCoreSchema;

export type FulfillOrderInput = z.infer<typeof FulfillOrderInputSchema>;
