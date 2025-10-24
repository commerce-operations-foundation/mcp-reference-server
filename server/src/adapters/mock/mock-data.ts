/**
 * Mock Data
 * Realistic mock data generation and storage for testing
 */

import { DateUtils } from '../../utils/index.js';
import { Customer, InventoryItem, Order, Product, ProductVariant } from '../../schemas/index.js';

const tenantId = 'tenant_001';

export class MockData {
  private orders: Map<string, any> = new Map();
  private ordersByNumber: Map<string, any> = new Map();
  private products: Map<string, Product> = new Map();
  private productAliases: Map<string, string> = new Map();
  private productVariants: Map<string, ProductVariant> = new Map();
  private variantAliases: Map<string, string> = new Map();
  private customers: Map<string, Customer> = new Map();
  private inventory: Map<string, InventoryItem> = new Map();

  constructor() {
    this.generateSampleData();
  }

  /**
   * Generate realistic sample data
   */
  private generateSampleData(): void {
    this.generateSampleProducts();
    this.generateSampleCustomers();
    this.generateSampleInventory();
    this.generateSampleOrders();
  }

  /**
   * Generate sample products
   */
  private generateSampleProducts(): void {
    const sampleCatalog: Array<{ product: Product; variants: ProductVariant[] }> = [
      {
        product: {
          id: 'prod_001',
          externalId: 'ext_prod_001',
          externalProductId: 'ext_prod_001',
          name: 'Wireless Bluetooth Headphones',
          description: 'Premium wireless headphones with noise cancellation',
          status: 'active',
          tags: ['electronics', 'audio'],
          vendor: 'TechBrand',
          categories: ['Electronics', 'Audio'],
          options: [
            {
              name: 'Color',
              values: ['Black'],
            },
          ],
          imageURLs: ['https://cdn.example.com/products/prod_001/headphones-black.jpg'],
          customFields: [
            { name: 'warranty', value: '2 years' },
            { name: 'feature', value: 'noise-cancellation' },
          ],
          createdAt: DateUtils.format(DateUtils.addDays(-90)),
          updatedAt: DateUtils.format(DateUtils.addDays(-5)),
          tenantId,
        },
        variants: [
          {
            id: 'variant_001',
            productId: 'prod_001',
            externalId: 'ext_var_001',
            externalProductId: 'ext_prod_001',
            sku: 'WID-001',
            barcode: '123456789012',
            upc: '123456789012',
            title: 'Wireless Headphones - Black',
            selectedOptions: [{ name: 'Color', value: 'Black' }],
            price: 199.99,
            currency: 'USD',
            compareAtPrice: 229.99,
            cost: 120,
            costCurrency: 'USD',
            weight: { value: 0.8, unit: 'lb' },
            dimensions: { length: 8, width: 7, height: 3, unit: 'in' },
            imageURLs: ['https://cdn.example.com/products/prod_001/headphones-black.jpg'],
            taxable: true,
            customFields: [
              { name: 'battery-life', value: '30 hours' },
              { name: 'color', value: 'Black' },
            ],
            inventoryNotTracked: false,
            createdAt: DateUtils.format(DateUtils.addDays(-90)),
            updatedAt: DateUtils.format(DateUtils.addDays(-5)),
            tenantId,
          },
        ],
      },
      {
        product: {
          id: 'prod_002',
          externalId: 'ext_prod_002',
          externalProductId: 'ext_prod_002',
          name: 'Organic Cotton T-Shirt',
          description: 'Comfortable 100% organic cotton t-shirt',
          status: 'active',
          tags: ['apparel', 'organic'],
          vendor: 'EcoWear',
          categories: ['Apparel'],
          options: [
            {
              name: 'Size',
              values: ['S', 'M', 'L', 'XL'],
            },
            {
              name: 'Color',
              values: ['Natural'],
            },
          ],
          imageURLs: ['https://cdn.example.com/products/prod_002/tshirt-natural.jpg'],
          customFields: [
            { name: 'material', value: '100% Organic Cotton' },
            { name: 'fit', value: 'Unisex' },
          ],
          createdAt: DateUtils.format(DateUtils.addDays(-120)),
          updatedAt: DateUtils.format(DateUtils.addDays(-10)),
          tenantId,
        },
        variants: [
          {
            id: 'variant_002',
            productId: 'prod_002',
            externalId: 'ext_var_002',
            externalProductId: 'ext_prod_002',
            sku: 'TSH-002',
            barcode: '223456789012',
            upc: '223456789012',
            title: 'Organic Cotton T-Shirt - Medium',
            selectedOptions: [
              { name: 'Size', value: 'M' },
              { name: 'Color', value: 'Natural' },
            ],
            price: 29.99,
            currency: 'USD',
            compareAtPrice: 34.99,
            cost: 12.5,
            costCurrency: 'USD',
            weight: { value: 0.2, unit: 'lb' },
            dimensions: { length: 12, width: 8, height: 1, unit: 'in' },
            imageURLs: ['https://cdn.example.com/products/prod_002/tshirt-natural.jpg'],
            taxable: true,
            customFields: [
              { name: 'gender', value: 'Unisex' },
              { name: 'collection', value: 'Spring' },
            ],
            inventoryNotTracked: false,
            createdAt: DateUtils.format(DateUtils.addDays(-120)),
            updatedAt: DateUtils.format(DateUtils.addDays(-10)),
            tenantId,
          },
        ],
      },
      {
        product: {
          id: 'prod_003',
          externalId: 'ext_prod_003',
          externalProductId: 'ext_prod_003',
          name: 'Premium Coffee Beans',
          description: 'Single-origin coffee beans from Colombia',
          status: 'active',
          tags: ['grocery', 'coffee'],
          vendor: 'CoffeeCo',
          categories: ['Food & Beverage'],
          options: [
            {
              name: 'Roast',
              values: ['Medium'],
            },
          ],
          imageURLs: ['https://cdn.example.com/products/prod_003/coffee-medium.jpg'],
          customFields: [
            { name: 'origin', value: 'Colombia' },
            { name: 'weight', value: '1 lb' },
          ],
          createdAt: DateUtils.format(DateUtils.addDays(-60)),
          updatedAt: DateUtils.format(DateUtils.addDays(-3)),
          tenantId,
        },
        variants: [
          {
            id: 'variant_003',
            productId: 'prod_003',
            externalId: 'ext_var_003',
            externalProductId: 'ext_prod_003',
            sku: 'COF-003',
            barcode: '323456789012',
            upc: '323456789012',
            title: 'Premium Coffee Beans - 1lb Bag',
            selectedOptions: [{ name: 'Roast', value: 'Medium' }],
            price: 24.99,
            currency: 'USD',
            cost: 10.0,
            costCurrency: 'USD',
            weight: { value: 1.0, unit: 'lb' },
            dimensions: { length: 6, width: 4, height: 2, unit: 'in' },
            imageURLs: ['https://cdn.example.com/products/prod_003/coffee-medium.jpg'],
            taxable: false,
            customFields: [
              { name: 'fair-trade', value: 'true' },
              { name: 'grind', value: 'Whole Bean' },
            ],
            inventoryNotTracked: false,
            createdAt: DateUtils.format(DateUtils.addDays(-60)),
            updatedAt: DateUtils.format(DateUtils.addDays(-3)),
            tenantId,
          },
        ],
      },
    ];

    sampleCatalog.forEach(({ product, variants }) => {
      if (product.id) {
        this.products.set(product.id, product);
      }

      if (product.externalId) {
        this.productAliases.set(product.externalId, product.id!);
      }

      if (product.externalProductId) {
        this.productAliases.set(product.externalProductId, product.id!);
      }

      variants.forEach((variant) => {
        if (variant.id) {
          this.productVariants.set(variant.id, variant);
        }

        if (variant.sku) {
          this.variantAliases.set(variant.sku, variant.id!);
          this.productAliases.set(variant.sku, variant.productId);
        }

        if (variant.externalId) {
          this.variantAliases.set(variant.externalId, variant.id!);
        }

        if (variant.externalProductId) {
          this.variantAliases.set(`${variant.externalProductId}:${variant.id}`, variant.id!);
        }
      });
    });
  }

  /**
   * Generate sample customers
   */
  private generateSampleCustomers(): void {
    const sampleCustomers: Customer[] = [
      {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tenantId,
        id: 'cust_001',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        phone: '555-0101',
        type: 'individual',
        addresses: [
          {
            name: 'home',
            address: {
              address1: '123 Main St',
              address2: 'Apt 4B',
              city: 'New York',
              stateOrProvince: 'NY',
              zipCodeOrPostalCode: '10001',
              country: 'US',
              company: 'N/A',
              email: 'john.smith@example.com',
              firstName: 'John',
              lastName: 'Smith',
            },
          },
        ],
        customFields: [
          { name: 'vip_status', value: 'gold' },
          { name: 'marketing_opt_in', value: 'true' },
        ],
      },
      {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tenantId,
        id: 'cust_002',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@example.com',
        phone: '555-0102',
        type: 'individual',
        addresses: [
          {
            name: 'home',
            address: {
              address1: '456 Oak Ave',
              city: 'Los Angeles',
              stateOrProvince: 'CA',
              zipCodeOrPostalCode: '90210',
              country: 'US',
              company: 'N/A',
              email: 'sarah.johnson@example.com',
              firstName: 'Sarah',
              lastName: 'Johnson',
            },
          },
        ],
        customFields: [{ name: 'customer_since', value: '2020-01-15' }],
      },
    ];

    sampleCustomers.forEach((customer) => {
      if (customer.id) {
        this.customers.set(customer.id, customer);
      }
      if (customer.email) {
        this.customers.set(customer.email, customer);
      }
    });
  }

  /**
   * Generate sample inventory
   */
  private generateSampleInventory(): void {
    const skus = ['WID-001', 'TSH-002', 'COF-003'];
    const warehouses = ['WH001', 'WH002', 'WH003'];

    skus.forEach((sku) => {
      warehouses.forEach((locationId) => {
        const onHand = Math.floor(Math.random() * 100) + 10;
        const unavailable = Math.floor(Math.random() * 20);

        this.inventory.set(`${sku}_${locationId}`, {
          tenantId,
          sku,
          locationId,
          onHand,
          unavailable,
          available: onHand - unavailable,
        });
      });
    });
  }

  /**
   * Generate sample orders
   */
  private generateSampleOrders(): void {
    const sampleOrders: Order[] = [
      {
        id: 'order_001',
        externalId: 'EXT-001',
        status: 'confirmed',
        customer: this.customers.get('cust_001'),
        lineItems: [
          {
            id: 'line_001',
            sku: 'WID-001',
            quantity: 1,
            unitPrice: 199.99,
            totalPrice: 199.99,
            customFields: [],
          },
        ],
        billingAddress: {
          address1: '123 Main St',
          address2: 'Apt 4B',
          city: 'New York',
          stateOrProvince: 'NY',
          zipCodeOrPostalCode: '10001',
          country: 'US',
          company: 'N/A',
          email: 'john.smith@example.com',
          firstName: 'John',
          lastName: 'Smith',
        },
        shippingAddress: {
          address1: '123 Main St',
          address2: 'Apt 4B',
          city: 'New York',
          stateOrProvince: 'NY',
          zipCodeOrPostalCode: '10001',
          country: 'US',
          company: 'N/A',
          email: 'john.smith@example.com',
          firstName: 'John',
          lastName: 'Smith',
        },
        currency: 'USD',
        subTotalPrice: 199.99,
        orderTax: 16.0,
        shippingPrice: 0.0,
        totalPrice: 215.99,
        createdAt: DateUtils.format(DateUtils.addDays(-5)),
        updatedAt: DateUtils.format(DateUtils.addDays(-5)),
        customFields: [
          { name: 'priority', value: 'standard' },
          { name: 'source', value: 'website' },
        ],
        tenantId,
      },
      {
        id: 'order_002',
        externalId: 'ORD-1001', // Common format users might expect
        status: 'processing',
        customer: this.customers.get('cust_002'),
        lineItems: [
          {
            id: 'line_002',
            sku: 'TSH-002',
            quantity: 2,
            unitPrice: 29.99,
            totalPrice: 59.98,
            customFields: [],
          },
        ],
        billingAddress: {
          address1: '456 Oak Ave',
          city: 'Los Angeles',
          stateOrProvince: 'CA',
          zipCodeOrPostalCode: '90001',
          country: 'US',
          company: 'N/A',
          email: 'sarah.johnson@example.com',
          firstName: 'Sarah',
          lastName: 'Johnson',
        },
        shippingAddress: {
          address1: '456 Oak Ave',
          city: 'Los Angeles',
          stateOrProvince: 'CA',
          zipCodeOrPostalCode: '90001',
          country: 'US',
          company: 'N/A',
          email: 'sarah.johnson@example.com',
          firstName: 'Sarah',
          lastName: 'Johnson',
        },
        currency: 'USD',
        subTotalPrice: 59.98,
        orderTax: 4.8,
        shippingPrice: 5.99,
        totalPrice: 70.77,
        createdAt: DateUtils.format(DateUtils.addDays(-3)),
        updatedAt: DateUtils.format(DateUtils.addDays(-2)),
        customFields: [{ name: 'priority', value: 'express' }],
        tenantId,
      },
      {
        id: 'order_003',
        externalId: 'WEB-2024-1002', // Different format example
        status: 'shipped',
        customer: this.customers.get('cust_001'),
        lineItems: [
          {
            id: 'line_003',
            sku: 'COF-003',
            quantity: 3,
            unitPrice: 24.99,
            totalPrice: 74.97,
            customFields: [],
          },
        ],
        billingAddress: {
          address1: '123 Main St',
          address2: 'Apt 4B',
          city: 'New York',
          stateOrProvince: 'NY',
          zipCodeOrPostalCode: '10001',
          country: 'US',
          company: 'N/A',
          email: 'john.smith@example.com',
          firstName: 'John',
          lastName: 'Smith',
        },
        shippingAddress: {
          address1: '789 Pine St',
          city: 'Chicago',
          stateOrProvince: 'IL',
          zipCodeOrPostalCode: '60601',
          country: 'US',
          company: 'N/A',
          email: 'john.smith@example.com',
          firstName: 'John',
          lastName: 'Smith',
        },
        currency: 'USD',
        subTotalPrice: 74.97,
        orderTax: 6.0,
        shippingPrice: 8.99,
        totalPrice: 89.96,
        tenantId,
        createdAt: DateUtils.format(DateUtils.addDays(-7)),
        updatedAt: DateUtils.format(DateUtils.addDays(-1)),
        customFields: [{ name: 'gift', value: 'true' }],
      },
    ];

    sampleOrders.forEach((order) => {
      this.orders.set(order.id, order);
    });
  }

  /**
   * Add new order to mock data
   */
  addOrder(order: any): void {
    this.orders.set(order.orderId, order);
    // orderNumber not in schema
    // if (order.orderNumber) {
    //   this.ordersByNumber.set(order.orderNumber, order);
    // }
  }

  /**
   * Get order by ID
   */
  getOrder(orderId: string): Order | undefined {
    return this.orders.get(orderId);
  }

  /**
   * Get order by order number
   */
  getOrderByNumber(orderNumber: string | undefined): any | undefined {
    if (!orderNumber) {
      return undefined;
    }
    // orderNumber not in schema - search through all orders for compatibility
    // This is kept for backward compatibility with OrderIdentifier interface
    for (const order of this.orders.values()) {
      if ((order as any).orderNumber === orderNumber) {
        return order;
      }
    }
    return undefined;
  }

  /**
   * Get order by external order ID
   */
  getOrderByExtOrderId(extOrderId: string | undefined): any | undefined {
    if (!extOrderId) {
      return undefined;
    }
    for (const order of this.orders.values()) {
      if (order.extOrderId === extOrderId) {
        return order;
      }
    }
    return undefined;
  }

  /**
   * Get product by ID or SKU
   */
  getProduct(identifier: string | undefined): Product {
    if (!identifier) {
      throw new Error('Product identifier is required');
    }

    const resolvedProductId = this.resolveProductId(identifier);
    if (resolvedProductId) {
      const product = this.products.get(resolvedProductId);
      if (product) {
        return product;
      }
    }

    return this.createDynamicProductAndVariant(identifier).product;
  }

  getProductVariant(identifier: string | undefined): ProductVariant {
    if (!identifier) {
      throw new Error('Product variant identifier is required');
    }

    const variant = this.findVariant(identifier);
    if (variant) {
      return variant;
    }

    // If identifier refers to a product, return the first known variant or create one dynamically
    const productId = this.resolveProductId(identifier);
    if (productId) {
      const variants = this.getProductVariantsByProductId(productId);
      if (variants.length > 0) {
        return variants[0];
      }

      return this.createAdHocVariant(identifier, productId);
    }

    // Fall back to dynamically generating both product and variant for unknown identifiers
    return this.createDynamicProductAndVariant(identifier).variant;
  }

  getProductVariantsByProductId(productId: string): ProductVariant[] {
    return Array.from(this.productVariants.values()).filter((variant) => variant.productId === productId);
  }

  private resolveProductId(identifier: string): string | undefined {
    if (this.products.has(identifier)) {
      return identifier;
    }

    const alias = this.productAliases.get(identifier);
    if (alias) {
      return alias;
    }

    const variant = this.findVariant(identifier);
    if (variant) {
      return variant.productId;
    }

    return undefined;
  }

  private findVariant(identifier: string): ProductVariant | undefined {
    if (this.productVariants.has(identifier)) {
      return this.productVariants.get(identifier);
    }

    const variantId = this.variantAliases.get(identifier);
    if (variantId) {
      return this.productVariants.get(variantId);
    }

    return undefined;
  }

  private createDynamicProductAndVariant(identifier: string): { product: Product; variant: ProductVariant } {
    const productId = `prod_${identifier}`;
    const variantId = `variant_${identifier}`;

    const product: Product = {
      id: productId,
      externalId: productId,
      externalProductId: productId,
      name: `Dynamic Product ${identifier}`,
      description: `Auto-generated product for ${identifier}`,
      status: 'active',
      tags: ['generated'],
      vendor: 'DynamicVendor',
      categories: ['Generated'],
      options: [],
      imageURLs: [],
      customFields: [
        { name: 'generated', value: 'true' },
        { name: 'timestamp', value: DateUtils.now() },
      ],
      createdAt: DateUtils.now(),
      updatedAt: DateUtils.now(),
      tenantId: 'tenant_dynamic',
    };

    const variant: ProductVariant = {
      id: variantId,
      productId,
      externalId: variantId,
      externalProductId: productId,
      sku: identifier,
      title: `Dynamic Variant ${identifier}`,
      barcode: identifier,
      price: 0,
      currency: 'USD',
      cost: 0,
      costCurrency: 'USD',
      weight: { value: 0.5, unit: 'lb' },
      imageURLs: [],
      selectedOptions: [],
      inventoryNotTracked: true,
      taxable: false,
      customFields: [{ name: 'generated', value: 'true' }],
      createdAt: DateUtils.now(),
      updatedAt: DateUtils.now(),
      tenantId: 'tenant_dynamic',
    };

    this.products.set(productId, product);
    this.productAliases.set(productId, productId);

    this.productVariants.set(variantId, variant);
    this.variantAliases.set(identifier, variantId);
    this.productAliases.set(identifier, productId);

    if (variant.externalId) {
      this.variantAliases.set(variant.externalId, variantId);
    }

    return { product, variant };
  }

  private createAdHocVariant(identifier: string, productId: string): ProductVariant {
    const variantId = `variant_${productId}_${Date.now()}`;
    const externalVariantId = `ext_variant_${productId}_${Date.now()}`;
    const variant: ProductVariant = {
      id: variantId,
      externalId: externalVariantId,
      externalProductId: productId,
      productId,
      sku: identifier,
      title: `Generated Variant ${identifier}`,
      createdAt: DateUtils.now(),
      updatedAt: DateUtils.now(),
      tenantId: 'tenant_dynamic',
    };

    this.productVariants.set(variantId, variant);
    this.variantAliases.set(identifier, variantId);
    this.productAliases.set(identifier, productId);

    if (variant.id) {
      this.variantAliases.set(variant.id, variantId);
    }

    return variant;
  }

  /**
   * Get customer by ID or email
   */
  getCustomer(identifier: string | undefined): Customer {
    if (!identifier) {
      throw new Error('Customer identifier is required');
    }

    const customer = this.customers.get(identifier);
    if (!customer) {
      // Generate a dynamic customer if not found
      return {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tenantId,
        id: `cust_${identifier}`,
        firstName: 'Generated',
        lastName: 'Customer',
        email: identifier.includes('@') ? identifier : `${identifier}@example.com`,
        phone: '555-0100',
        type: 'individual',
        addresses: [
          {
            name: 'home',
            address: {
              address1: '123 Generic St',
              city: 'Sample City',
              stateOrProvince: 'CA',
              zipCodeOrPostalCode: '90210',
              country: 'US',
              company: 'N/A',
              email: identifier.includes('@') ? identifier : `${identifier}@example.com`,
              firstName: 'Generated',
              lastName: 'Customer',
            },
          },
        ],
        customFields: [
          { name: 'generated', value: 'true' },
          { name: 'timestamp', value: DateUtils.now() },
        ],
      };
    }

    return customer;
  }

  /**
   * Get inventory for SKU and warehouse
   */
  getInventory(sku: string, locationId: string = 'WH001'): InventoryItem {
    const key = `${sku}_${locationId}`;
    const inventory = this.inventory.get(key);

    if (!inventory) {
      const unavailable = Math.floor(Math.random() * 20);
      const onHand = unavailable + Math.floor(Math.random() * 100) + 10;
      const available = onHand - unavailable;

      return {
        sku,
        locationId,
        onHand,
        unavailable,
        available,
        tenantId,
      };
    }

    return inventory;
  }

  /**
   * Get data size for health checks
   */
  getSize(): { orders: number; products: number; productVariants: number; customers: number; inventory: number } {
    return {
      orders: this.orders.size,
      products: this.products.size,
      productVariants: this.productVariants.size,
      customers: this.customers.size,
      inventory: this.inventory.size,
    };
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.orders.clear();
    this.ordersByNumber.clear();
    this.products.clear();
    this.productAliases.clear();
    this.productVariants.clear();
    this.variantAliases.clear();
    this.customers.clear();
    this.inventory.clear();
  }

  /**
   * Reset to sample data (for testing)
   */
  reset(): void {
    this.clear();
    this.generateSampleData();
  }
}
