import { z } from 'zod';

import { AddressSchema, OrderLineItemSchema } from '../common.js';
import { makeZodFieldMap } from '../utils/schema-util.js';

const shipmentDimensionsSchema = z.object({
  length: z.number().min(0).optional(),
  width: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  unit: z.enum(['in', 'cm']).optional().default('in'),
});

const shippingInfoSchema = z
  .object({
    carrier: z.string().describe('Shipping carrier name'),
    service: z.string().describe('Shipping service level'),
    trackingNumber: z.string().describe('Tracking number from carrier'),
    trackingUrl: z.string().describe('URL to track shipment'),
    estimatedDelivery: z.string().describe('Expected delivery date'),
    shippingCost: z.number().min(0).describe('Actual shipping cost'),
    weight: z.number().min(0).describe('Package weight in pounds'),
    dimensions: shipmentDimensionsSchema,
  })
  .partial();

const shipmentLineItemSchema = z.object({
  id: OrderLineItemSchema.shape.id.optional(),
  sku: OrderLineItemSchema.shape.sku.describe('Product SKU'),
  quantity: OrderLineItemSchema.shape.quantity.describe('Quantity being shipped'),
});

export const FulfillOrderInputSchema = z
  .object({
    orderId: z.string().describe('Order ID to ship'),
    shippingInfo: shippingInfoSchema.describe('Shipping details'),
    items: z.array(shipmentLineItemSchema).describe('Items included in this shipment (for partial shipments)'),
    shippingAddress: AddressSchema.describe('Shipping address (if different from order address)'),
    notifyCustomer: z.boolean().describe('Whether to send shipping notification to customer'),
    notes: z.string().describe('Additional shipping notes'),
  })
  .partial()
  .required(makeZodFieldMap(['orderId', 'shippingInfo', 'items', 'shippingAddress'] as const));
export type FulfillOrderInput = z.infer<typeof FulfillOrderInputSchema>;
