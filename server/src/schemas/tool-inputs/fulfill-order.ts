/**
 * TODO: Make this just a fulfillment schema with the immutable fields removed
 */
import { z } from 'zod';

import { FulfillmentSchema } from '../entities/fulfillment.js';

export const FulfillOrderInputSchema = FulfillmentSchema;

export type FulfillOrderInput = z.infer<typeof FulfillOrderInputSchema>;
