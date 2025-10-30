import { z } from 'zod';
import { Order, OrderSchema } from '../entities/order.js';
import { makeZodFieldMap } from '../utils/schema-util.js';

const immutableOrderFields = ['id', 'createdAt', 'updatedAt', 'tenantId'] as const satisfies (keyof Order)[];
export const CreateSalesOrderInputSchema = z.object({
  order: OrderSchema.omit(makeZodFieldMap(immutableOrderFields)),
});
export type CreateSalesOrderInput = z.infer<typeof CreateSalesOrderInputSchema>;
