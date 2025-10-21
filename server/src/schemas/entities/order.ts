import { z } from 'zod';

import { AddressSchema, OrderLineItemSchema, ObjectProps, TagsSchema, CustomFieldsSchema } from '../common.js';
import { makeZodFieldMap } from '../utils/schema-util.js';
import { CustomerSchema } from './customer.js';

/**
 * Order entity schema definition.
 */
export const orderSchema = z
  .object({
    status: z.string().describe('Order status'),
    billingAddress: AddressSchema.describe('Purchaser Address'),
    currency: z.string().describe('Order currency code'),
    customFields: CustomFieldsSchema,
    customer: CustomerSchema.describe('Order customer information'),
    discounts: z.array(z.looseObject({})).describe('Discounts'),
    giftNote: z.string().describe('Order Gift note'),
    incoterms: z.string().describe('International Commercial Terms'),
    lineItems: z.array(OrderLineItemSchema),
    orderDiscount: z.number().describe('Order Discount'),
    orderNote: z.string().describe('Order Notes'),
    orderSource: z.string().describe('The original order platform, walmart, etsy, etc'),
    orderTax: z.number().describe('Order Tax'),
    paymentStatus: z.string().describe('status of the payment'),
    payments: z.array(z.looseObject({})).describe('Payments'),
    refunds: z.array(z.looseObject({})).describe('Refunds'),
    shippingAddress: AddressSchema.describe('Recipient Address'),
    shippingClass: z.string().describe('Required with ShippingCarrier, 2nd Priority'),
    shippingCode: z.string().describe('1st Priority'),
    shippingPrice: z.number().describe('Shipping price'),
    subTotalPrice: z.number().describe('Sub Total Price'),
    tags: TagsSchema,
    totalPrice: z.number().describe('Total Price'),
  })
  .partial()
  .required(makeZodFieldMap(['lineItems'] as const))
  .extend(ObjectProps.shape)
  .describe('Sales Order');

export type Order = z.infer<typeof orderSchema>;
