import { z } from 'zod';
import { OrderLineItemSchema } from '../common.js';
import { makeZodFieldMap } from '../utils/schema-util.js';

const cancelLineItemSchema = z.object({
  id: OrderLineItemSchema.shape.id,
  quantity: OrderLineItemSchema.shape.quantity,
});

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
