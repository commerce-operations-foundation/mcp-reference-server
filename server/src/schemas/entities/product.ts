import { z } from 'zod';

import { CustomFieldsSchema, ObjectProps, TagsSchema } from '../common.js';
import { makeZodFieldMap } from '../utils/schema-util.js';

export const ProductOptionSchema = z
  .object({
    name: z.string().describe('Option dimension name, e.g. size or color'),
    values: z.array(z.string()).describe('Optional merchandising hints for valid option values'),
  })
  .describe('Definition for a selectable product option');

export type ProductOption = z.infer<typeof ProductOptionSchema>;

/**
 * Catalog-level product data. Fields shared with ProductVariant act as defaults.
 * When a variant also supplies those fields, the variant values take precedence for that variant.
 */
const ProductCoreSchema = z
  .object({
    externalProductId: z.string(),
    name: z.string().describe('Product display name'),
    description: z.string(),
    handle: z.string().describe('URL-friendly identifier or slug'),
    status: z.string().describe('Adapter-defined status for the product as a whole'),
    tags: TagsSchema,
    vendor: z.string(),
    categories: z.array(z.string()),
    options: z.array(ProductOptionSchema).describe('Declares which option dimensions exist for the product'),
    imageURLs: z.array(z.string()).describe('Fallback imagery used when variants omit their own images'),
    hsCode: z.string().describe('HTS or HS code of the product, up to 14 digits'),
    countryOfOrigin: z.string().describe('ISO-2 letter country code'),
    eccn: z
      .string()
      .describe('Export Control Classification Number, 5 character alphanumeric, required for exports from the USA'),
    unNumber: z.string().describe('Four digit UN number for hazmat materials identification'),
    unPackingGroup: z.string().describe('Identifies the degree of danger - values I, II or III'),
    unPackingInstruction: z.string().describe('Usually five characters, letters and numbers'),
    nmfc: z.string().describe('National Motor Freight Classification, used in the US only in lieu of UN codes'),
    customFields: CustomFieldsSchema,
  })
  .partial()
  .required(makeZodFieldMap(['name', 'options'] as const))
  .extend(ObjectProps.shape)
  .describe('Product');

export const ProductSchema = ObjectProps.extend(ProductCoreSchema.shape).describe('Product');

export type Product = z.infer<typeof ProductSchema>;
