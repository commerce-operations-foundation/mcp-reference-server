/**
 * TODO: Make this just a fulfillment schema with the immutable fields removed
 */
import { z } from 'zod';

import { FulfillmentBaseSchema } from '../entities/fulfillment.js';

export const FulfillOrderInputSchema = FulfillmentBaseSchema;

export type FulfillOrderInput = z.infer<typeof FulfillOrderInputSchema>;
