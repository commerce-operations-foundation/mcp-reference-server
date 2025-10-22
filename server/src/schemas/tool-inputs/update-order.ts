import { z } from 'zod';
import { Order, orderSchema } from '../entities/order.js';
import { makeZodFieldMap } from '../utils/schema-util.js';
import { OrderLineItem, OrderLineItemSchema } from '../common.js';

const immutableOrderFields = [
  'id',
  'createdAt',
  'updatedAt',
  'tenantId',
  'externalId',
  // TODO: Should status be something updated via dedicated methods e.g. cancel, fulfill, etc?
  'status',
] as const satisfies (keyof Order)[];
const immutableLineItemFields = ['id'] as const satisfies (keyof OrderLineItem)[];
const updateLineItemSchema = OrderLineItemSchema.omit(makeZodFieldMap(immutableLineItemFields))
  .partial()
  .required({ sku: true, quantity: true, unitPrice: true });

const orderUpdatePayloadSchema = orderSchema
  .omit(makeZodFieldMap(immutableOrderFields))
  .extend({
    lineItems: z.array(updateLineItemSchema).optional(),
  })
  .partial()
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one update field is required',
      });
    }
  });

export const UpdateOrderInputSchema = z.object({
  id: z.string().describe('Order ID'),
  updates: orderUpdatePayloadSchema.describe('Fields to update'),
});
export type UpdateOrderInput = z.infer<typeof UpdateOrderInputSchema>;
