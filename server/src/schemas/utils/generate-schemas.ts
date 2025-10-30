import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

import {
  OrderSchema,
  CustomerSchema,
  productSchema,
  InventoryItemSchema,
  FulfillmentSchema,
  ProductVariantSchema,
} from '../index.js';
import {
  CreateSalesOrderInputSchema,
  CancelOrderInputSchema,
  UpdateOrderInputSchema,
  FulfillOrderInputSchema,
  GetOrdersInputSchema,
  GetCustomersInputSchema,
  GetProductsInputSchema,
  GetInventoryInputSchema,
  GetFulfillmentsInputSchema,
} from '../tool-inputs/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Output directory (root-level /schemas)
const SCHEMAS_DIR = join(__dirname, '../../../../schemas');

const schemaDefinitions = [
  {
    name: 'order.json',
    schema: OrderSchema,
    title: 'Order',
    description: 'Order entity schema',
  },
  {
    name: 'customer.json',
    schema: CustomerSchema,
    title: 'Customer',
    description: 'Customer entity schema',
  },
  {
    name: 'product.json',
    schema: productSchema,
    title: 'Product',
    description: 'Product entity schema',
  },
  {
    name: 'product-variant.json',
    schema: ProductVariantSchema,
    title: 'Product Variant',
    description: 'Product Variant entity schema',
  },
  {
    name: 'inventory.json',
    schema: InventoryItemSchema,
    title: 'Inventory',
    description: 'Inventory entity schema',
  },
  {
    name: 'fulfillment.json',
    schema: FulfillmentSchema,
    title: 'Fulfillment',
    description: 'Fulfillment entity schema',
  },
  {
    name: 'tool-inputs/create-sales-order.json',
    schema: CreateSalesOrderInputSchema,
    title: 'create-sales-order',
    description: 'Input schema for creating a sales order',
  },
  {
    name: 'tool-inputs/cancel-order.json',
    schema: CancelOrderInputSchema,
    title: 'cancel-order',
    description: 'Input schema for canceling an order',
  },
  {
    name: 'tool-inputs/update-order.json',
    schema: UpdateOrderInputSchema,
    title: 'update-order',
    description: 'Input schema for updating an order',
  },
  {
    name: 'tool-inputs/fulfill-order.json',
    schema: FulfillOrderInputSchema,
    title: 'fulfill-order',
    description: 'Input schema for fulfilling an order',
  },
  {
    name: 'tool-inputs/get-orders.json',
    schema: GetOrdersInputSchema,
    title: 'get-orders',
    description: 'Input schema for querying orders',
  },
  {
    name: 'tool-inputs/get-customers.json',
    schema: GetCustomersInputSchema,
    title: 'get-customers',
    description: 'Input schema for querying customers',
  },
  {
    name: 'tool-inputs/get-products.json',
    schema: GetProductsInputSchema,
    title: 'get-products',
    description: 'Input schema for querying products',
  },
  {
    name: 'tool-inputs/get-inventory.json',
    schema: GetInventoryInputSchema,
    title: 'get-inventory',
    description: 'Input schema for querying inventory',
  },
  {
    name: 'tool-inputs/get-fulfillments.json',
    schema: GetFulfillmentsInputSchema,
    title: 'get-fulfillments',
    description: 'Input schema for querying fulfillments',
  },
] as const;

function generateJSONSchema(schema: z.ZodTypeAny, title: string, description: string) {
  const jsonSchema = z.toJSONSchema(schema, {
    target: 'draft-7',
  });

  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title,
    description,
    ...jsonSchema,
  };
}

function generateSchemas() {
  console.log('Generating JSON schemas from Zod schemas...\n');

  mkdirSync(SCHEMAS_DIR, { recursive: true });

  for (const { name, schema, title, description } of schemaDefinitions) {
    try {
      console.log(`Generating ${name}...`);
      const jsonSchema = generateJSONSchema(schema, title, description);
      const outputPath = join(SCHEMAS_DIR, name);

      // Ensure the directory for this file exists
      const outputDir = dirname(outputPath);
      mkdirSync(outputDir, { recursive: true });

      writeFileSync(outputPath, JSON.stringify(jsonSchema, null, 2) + '\n', 'utf-8');
      console.log(`✓ Generated ${name}`);
    } catch (error) {
      console.error(`✗ Failed to generate ${name}:`, error);
      process.exit(1);
    }
  }

  console.log('\n✓ All schemas generated successfully!');
  console.log(`Output directory: ${SCHEMAS_DIR}`);
}

generateSchemas();
