import { z } from 'zod';
import { makeZodFieldMap } from './utils/schema-util.js';

export const systemFields = ['id', 'createdAt', 'updatedAt', 'tenantId'] as const;
export const externalIdSchema = z
  .string()
  .describe("ID of the entity in the client's system. Must be unique within the tenant.");

/**
 * Shared field schemas used across multiple domain entities.
 */
export const customFieldSchema = z.object({
  name: z.string(),
  value: z.string(),
});
export type CustomField = z.infer<typeof customFieldSchema>;
export const CustomFieldsSchema = z
  .array(customFieldSchema)
  .describe(
    'Custom Fields - allows for arbitrary key-value pairs to be added to an entity. Useful for storing any custom data that is not covered by the other fields.'
  );

export const AddressSchema = z
  .object({
    address1: z.string().describe('Primary street address (e.g., "123 Main Street")'),
    address2: z
      .string()
      .describe('Secondary address information such as apartment, suite, or unit number (e.g., "Apt 4B")'),
    city: z.string().describe('City or town name'),
    company: z.string().describe('Company or organization name associated with this address'),
    country: z.string().describe('Country code in ISO 3166-1 alpha-2 format (2 letters, e.g., "US", "CA", "GB")'),
    email: z.email().describe('Email address for contact at this location'),
    firstName: z.string().describe('First name of the person at this address'),
    lastName: z.string().describe('Last name of the person at this address'),
    phone: z.string().describe('Phone number including country code if applicable (e.g., "+1-555-123-4567")'),
    stateOrProvince: z
      .string()
      .describe(
        'State or province. For US addresses, use 2-letter state code (e.g., "CA", "NY"). For other countries, use full province name or local standard.'
      ),
    zipCodeOrPostalCode: z.string().describe('ZIP code (US) or postal code (international) for the address'),
  })
  .partial()
  .required(makeZodFieldMap([] as const));
export type Address = z.infer<typeof AddressSchema>;

export const CustomerAddressSchema = z.object({
  name: z.string().optional().describe('Description of the address e.g. home, work, billing, shipping, etc'),
  address: AddressSchema,
});
export type CustomerAddress = z.infer<typeof CustomerAddressSchema>;

export const OrderLineItemSchema = z
  .object({
    id: z.string().describe('Unique identifier for this line item within the order'),
    sku: z.string().min(1).describe('Product Variant SKU'),
    quantity: z.number().min(1).describe('Quantity ordered'),
    unitPrice: z.number().min(0).describe('Price per unit'),
    totalPrice: z.number().min(0).describe('Total price (calculated if not provided)'),
    name: z.string().describe('Product name for display'),
    customFields: CustomFieldsSchema,
  })
  .partial()
  .required(makeZodFieldMap(['sku', 'quantity'] as const));
export type OrderLineItem = z.infer<typeof OrderLineItemSchema>;

/**
 * Timestamp schemas used across all entity types.
 */
export const createdAtSchema = z.iso.datetime().describe('ISO 8601 timestamp when the entity was created (read-only)');
export const updatedAtSchema = z.iso
  .datetime()
  .describe('ISO 8601 timestamp when the entity was last updated (read-only)');

/**
 * Tenant identifier schema used across all entity types.
 */
export const tenantIdSchema = z.string().describe('Unique identifier for the tenant that owns this entity (read-only)');

export const ObjectProps = z.object({
  id: z.string().describe('Unique system-generated identifier for this entity (read-only)'),
  externalId: externalIdSchema.optional(),
  createdAt: createdAtSchema,
  updatedAt: updatedAtSchema,
  tenantId: tenantIdSchema,
});

export const TagsSchema = z
  .array(z.string())
  .describe(
    'Tags for categorization and filtering. Useful for organizing entities with custom labels (e.g., "priority", "wholesale", "gift")'
  );
