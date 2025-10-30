import { z } from 'zod';
import { OrderLineItemSchema } from '../common.js';
import { makeZodFieldMap } from '../utils/schema-util.js';

const cancelLineItemSchema = OrderLineItemSchema.pick({ sku: true, quantity: true, id: true })
  .partial()
  .required(makeZodFieldMap(['sku', 'quantity'] as const));

export const CancelOrderInputSchema = z
  .object({
    orderId: z.string().describe('id of the order to cancel'),
    reason: z.string().describe('Reason for cancellation'),
    notifyCustomer: z.boolean().describe('Whether to send cancellation notification to customer'),
    notes: z.string().describe('Additional cancellation notes'),
    lineItems: z.array(cancelLineItemSchema).describe('Specific line items to cancel (omit to cancel entire order)'),
  })
  .partial()
  .required(makeZodFieldMap(['orderId'] as const));
export type CancelOrderInput = z.infer<typeof CancelOrderInputSchema>;
