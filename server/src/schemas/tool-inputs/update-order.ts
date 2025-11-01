import { z } from 'zod';
import { Order, OrderSchema } from '../entities/order.js';
import { makeZodFieldMap } from '../utils/schema-util.js';
import { OrderLineItem, OrderLineItemSchema } from '../common.js';

const immutableOrderFields = ['id', 'createdAt', 'updatedAt'] as const satisfies (keyof Order)[];
const immutableLineItemFields = [] as const satisfies (keyof OrderLineItem)[];
const updateLineItemSchema = OrderLineItemSchema.omit(makeZodFieldMap(immutableLineItemFields))
  .partial()
  .required({ sku: true, quantity: true, unitPrice: true });

const orderUpdatePayloadSchema = OrderSchema.omit(makeZodFieldMap(immutableOrderFields))
  .extend({
    lineItems: z.array(updateLineItemSchema).optional(),
  })
  .partial()
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'At least one update field is required',
      });
    }
  });

export const UpdateOrderInputSchema = z.object({
  id: z.string().describe('Order ID'),
  updates: orderUpdatePayloadSchema.describe('Fields to update'),
});
export type UpdateOrderInput = z.infer<typeof UpdateOrderInputSchema>;
