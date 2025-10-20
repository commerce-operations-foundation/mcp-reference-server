import { z } from 'zod';
import { Order, orderSchema } from '../entities/order.js';
import { makeZodFieldMap } from '../utils/schema-util.js';

const immutableOrderFields = [
  'id',
  'createdAt',
  'updatedAt',
  'tenantId',
  // TODO: Should status be something updated via dedicated methods e.g. cancel, fulfill, etc?
  'status',
] as const satisfies (keyof Order)[];
export const CreateSalesOrderInputSchema = z.object({
  order: orderSchema.omit(makeZodFieldMap(immutableOrderFields)),
});
export type CreateSalesOrderInput = z.infer<typeof CreateSalesOrderInputSchema>;
