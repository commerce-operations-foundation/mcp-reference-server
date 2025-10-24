import { z } from 'zod';

import { AddressSchema, ObjectProps, TagsSchema, OrderLineItemSchema, CustomFieldsSchema } from '../common.js';
import { makeZodFieldMap } from '../utils/schema-util.js';

export const FulfillmentBaseSchema = z
  .object({
    shippingAddress: AddressSchema.describe('Shipping address'),
    customFields: CustomFieldsSchema,
    expectedDeliveryDate: z.iso.datetime().describe('Expected delivery date'),
    expectedShipDate: z.iso.datetime().describe('Expected date the order will be shipped'),
    giftNote: z.string(),
    incoterms: z.string(),
    lineItems: z.array(OrderLineItemSchema).describe('Items included in this fulfillment'),
    locationId: z.string(),
    orderId: z.string().describe('Order ID'),
    shipByDate: z.iso.datetime(),
    shippingCarrier: z.string().describe('Shipping carrier name'),
    shippingClass: z.string(),
    shippingCode: z.string(),
    shippingLabels: z.array(z.string()),
    shippingNote: z.string().describe('Additional shipping notes'),
    shippingPrice: z.number().describe('Shipping cost'),
    status: z.string(),
    tags: TagsSchema,
    trackingNumber: z.string().describe('Tracking number from carrier'),
  })
  .partial()
  .required(makeZodFieldMap(['orderId', 'lineItems', 'trackingNumber'] as const));

/**
 * Fulfillment entity schema.
 */
export const FulfillmentSchema = FulfillmentBaseSchema.extend(ObjectProps.shape).describe('Fulfillment');

export type Fulfillment = z.infer<typeof FulfillmentSchema>;
