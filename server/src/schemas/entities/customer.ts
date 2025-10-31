import { z } from 'zod';

import { CustomerAddressSchema, TagsSchema, ObjectProps, CustomFieldsSchema } from '../common.js';

export const CustomerSchema = z
  .object({
    addresses: z
      .array(CustomerAddressSchema)
      .describe('List of addresses associated with the customer (e.g., shipping, billing, home, work)'),
    email: z.email().describe('Primary email address for the customer'),
    firstName: z.string().describe("Customer's first name"),
    lastName: z.string().describe("Customer's last name"),
    notes: z.string().describe('Internal notes about the customer for reference (not visible to the customer)'),
    phone: z.string().describe('Primary phone number including country code if applicable (e.g., "+1-555-123-4567")'),
    status: z.string().describe('Customer account status (e.g., "active", "inactive", "suspended")'),
    type: z
      .string()
      .describe('Customer type (e.g., "individual" for personal customers or "company" for business customers)'),
    customFields: CustomFieldsSchema,
    tags: TagsSchema,
  })
  .partial()
  .required({})
  .extend(ObjectProps.shape)
  .describe('Customer');

export type Customer = z.infer<typeof CustomerSchema>;
