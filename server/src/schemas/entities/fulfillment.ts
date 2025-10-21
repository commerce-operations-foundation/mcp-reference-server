import { z } from 'zod';

import { AddressSchema, ObjectProps, TagsSchema, OrderLineItemSchema, CustomFieldsSchema } from '../common.js';
import { makeZodFieldMap } from '../utils/schema-util.js';

/**
 * Fulfillment entity schema.
 */
export const FulfillmentSchema = z
  .object({
    shippingAddress: AddressSchema.describe('Destination address'),
    customFields: CustomFieldsSchema,
    expectedDeliveryDate: z.iso.datetime(),
    expectedShipDate: z.iso.datetime(),
    giftNote: z.string(),
    incoterms: z.string(),
    lineItems: z.array(OrderLineItemSchema),
    locationId: z.string(),
    orderId: z.string(),
    shipByDate: z.iso.datetime(),
    shippingCarrier: z.string(),
    shippingClass: z.string(),
    shippingCode: z.string(),
    shippingLabels: z.array(z.string()),
    shippingNote: z.string(),
    shippingPrice: z.number(),
    status: z.string(),
    tags: TagsSchema,
    trackingNumber: z.string(),
  })
  .partial()
  .required(makeZodFieldMap(['orderId', 'lineItems'] as const))
  .extend(ObjectProps.shape)
  .describe('Fulfillment');

export type Fulfillment = z.infer<typeof FulfillmentSchema>;
