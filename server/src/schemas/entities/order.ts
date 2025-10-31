import { z } from 'zod';

import {
  AddressSchema,
  OrderLineItemSchema,
  ObjectProps,
  TagsSchema,
  CustomFieldsSchema,
  ShippingInfoSchema,
} from '../common.js';
import { makeZodFieldMap } from '../utils/schema-util.js';
import { CustomerSchema } from './customer.js';

/**
 * Order entity schema definition.
 */
export const OrderSchema = z
  .object({
    name: z.string().describe('Order name'),
    status: z.string().describe('Order status'),
    billingAddress: AddressSchema.describe('Billing address'),
    currency: z.string().describe('Order currency code'),
    customFields: CustomFieldsSchema,
    customer: CustomerSchema.describe('Order customer information'),
    discounts: z.array(z.looseObject({})).describe('Discounts'),
    lineItems: z.array(OrderLineItemSchema),
    orderDiscount: z.number().describe('Order Discount'),
    orderNote: z.string().describe('Order Notes'),
    orderSource: z.string().describe('The original order platform, walmart, etsy, etc'),
    orderTax: z.number().describe('Order Tax'),
    paymentStatus: z.string().describe('status of the payment'),
    payments: z.array(z.looseObject({})).describe('Payments'),
    refunds: z.array(z.looseObject({})).describe('Refunds'),
    subTotalPrice: z.number().describe('Sub Total Price'),
    tags: TagsSchema,
    totalPrice: z.number().describe('Total Price'),
  })
  .extend(ShippingInfoSchema.shape)
  .partial()
  .required(makeZodFieldMap(['lineItems'] as const))
  .extend(ObjectProps.shape)
  .describe('Sales Order');

export type Order = z.infer<typeof OrderSchema>;
