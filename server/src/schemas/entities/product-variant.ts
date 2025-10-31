import { z } from 'zod';

import { CustomFieldsSchema, ObjectProps, TagsSchema } from '../common.js';
import { makeZodFieldMap } from '../utils/schema-util.js';

export const variantSelectionSchema = z
  .object({
    name: z.string().describe('Name of the option dimension selected by this variant, e.g. Size'),
    value: z.string().describe('Value for the option dimension, e.g. Medium'),
  })
  .describe('Specific option selections for a product variant');

export type VariantSelection = z.infer<typeof variantSelectionSchema>;

/**
 * Product variant. Any field that overlaps with Product and is present
 * here overrides the product-level default for this specific variant.
 */
export const ProductVariantSchema = z
  .object({
    productId: z.string().describe('ID of the parent product'),
    externalProductId: z
      .string()
      .describe('External product identifier when provided alongside a distinct variant externalId'),
    sku: z.string().describe('Variant SKU or stock keeping unit'),
    barcode: z.string().describe('General barcode or GTIN value; use `upc` when a UPC-format code is available'),
    upc: z.string().describe('UPC-format code; when present it overrides any product-level default for this variant'),
    title: z.string().describe('Variant display name'),
    selectedOptions: z.array(variantSelectionSchema).describe('Selected option values describing this variant'),
    price: z.number().describe('Current selling price for the variant'),
    currency: z.string().describe('ISO currency code for the price'),
    compareAtPrice: z.number().describe('List or compare-at price, if available'),
    cost: z.number().describe('Unit cost attributed to this variant'),
    costCurrency: z.string().describe('Currency for the unit cost'),
    inventoryNotTracked: z.boolean(),
    weight: z.object({
      value: z.number(),
      unit: z.enum(['lb', 'oz', 'kg', 'g']),
    }),
    dimensions: z.object({
      length: z.number(),
      width: z.number(),
      height: z.number(),
      unit: z.enum(['cm', 'in', 'ft']),
    }),
    imageURLs: z
      .array(z.url())
      .describe('Publicly accessible HTTP URLs for images of the variant. First image should be the primary image.'),
    taxable: z.boolean(),
    tags: TagsSchema,
    customFields: CustomFieldsSchema,
  })
  .partial()
  .required(makeZodFieldMap(['productId', 'sku'] as const))
  .extend(ObjectProps.shape)
  .describe('Product variant');

export type ProductVariant = z.infer<typeof ProductVariantSchema>;
