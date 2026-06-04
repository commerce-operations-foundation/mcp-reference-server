import { z } from 'zod';
import { Order, OrderSchema } from '../entities/order.js';
import { Customer, CustomerSchema } from '../entities/customer.js';
import { makeZodFieldMap } from '../utils/schema-util.js';

const immutableOrderFields = ['id', 'createdAt', 'updatedAt', 'tenantId'] as const satisfies (keyof Order)[];
const serverOnlyCustomerFields = ['createdAt', 'updatedAt', 'tenantId'] as const satisfies (keyof Customer)[];

export const CreateSalesOrderInputSchema = z.object({
  order: OrderSchema.omit(makeZodFieldMap(immutableOrderFields)).extend({
    customer: CustomerSchema.omit(makeZodFieldMap(serverOnlyCustomerFields)).optional(),
  }),
});
export type CreateSalesOrderInput = z.infer<typeof CreateSalesOrderInputSchema>;
