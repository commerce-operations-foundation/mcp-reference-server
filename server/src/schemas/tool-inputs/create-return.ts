import { z } from 'zod';
import { Return, ReturnSchema } from '../entities/return.js';
import { makeZodFieldMap } from '../utils/schema-util.js';

const immutableReturnFields = ['id', 'createdAt', 'updatedAt', 'tenantId'] as const satisfies (keyof Return)[];
export const CreateReturnInputSchema = z.object({
  return: ReturnSchema.omit(makeZodFieldMap(immutableReturnFields)),
});
export type CreateReturnInput = z.infer<typeof CreateReturnInputSchema>;
