import { z } from 'zod';

import { ObjectProps, TagsSchema, OrderLineItemSchema, CustomFieldsSchema, ShippingInfoSchema } from '../common.js';
import { makeZodFieldMap } from '../utils/schema-util.js';

/**
 * Fulfillment entity core schema
 */
const FulfillmentCoreSchema = z
  .object({
    customFields: CustomFieldsSchema,
    expectedDeliveryDate: z.iso.datetime().describe('Expected delivery date'),
    expectedShipDate: z.iso.datetime().describe('Expected date the order will be shipped'),
    lineItems: z.array(OrderLineItemSchema).describe('Items included in this fulfillment'),
    locationId: z.string(),
    orderId: z.string().describe('Order ID'),
    shipByDate: z.iso.datetime(),
    status: z.string(),
    tags: TagsSchema,
    trackingNumbers: z.array(z.string()).describe('Tracking numbers from carrier'),
  })
  .extend(ShippingInfoSchema.shape)
  .partial()
  .required(makeZodFieldMap(['orderId', 'lineItems', 'trackingNumbers'] as const))
  .extend(ObjectProps.shape)
  .describe('Fulfillment');

/**
 * Fulfillment entity schema.
 */
export const FulfillmentSchema = ObjectProps.extend(FulfillmentCoreSchema.shape).describe('Fulfillment');

export type Fulfillment = z.infer<typeof FulfillmentSchema>;
