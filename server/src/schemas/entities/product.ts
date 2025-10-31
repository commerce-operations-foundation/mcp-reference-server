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
export const productSchema = z
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
    customFields: CustomFieldsSchema,
  })
  .partial()
  .required(makeZodFieldMap(['name', 'options'] as const))
  .extend(ObjectProps.shape)
  .describe('Product');

export type Product = z.infer<typeof productSchema>;
