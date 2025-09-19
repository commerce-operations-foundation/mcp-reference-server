/**
 * Mock Data
 * Realistic mock data generation and storage for testing
 */

import { DateUtils } from '../../utils/index.js';
import * as types from '../../types/index.js';

export class MockData {
  private orders: Map<string, any> = new Map();
  private ordersByNumber: Map<string, any> = new Map();
  private products: Map<string, types.Product> = new Map();
  private customers: Map<string, types.Customer> = new Map();
  private inventory: Map<string, types.Inventory> = new Map();

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
    const sampleProducts = [
      {
        productId: 'prod_001',
        sku: 'WID-001',
        name: 'Wireless Bluetooth Headphones',
        description: 'Premium wireless headphones with noise cancellation',
        category: 'Electronics',
        brand: 'TechBrand',
        price: 199.99,
        weight: 0.8,
        dimensions: { length: 8, width: 7, height: 3 },
        customFields: [
          { name: 'color', value: 'Black' },
          { name: 'warranty', value: '2 years' }
        ]
      },
      {
        productId: 'prod_002',
        sku: 'TSH-002',
        name: 'Organic Cotton T-Shirt',
        description: 'Comfortable 100% organic cotton t-shirt',
        category: 'Apparel',
        brand: 'EcoWear',
        price: 29.99,
        weight: 0.2,
        dimensions: { length: 12, width: 8, height: 1 },
        customFields: [
          { name: 'size', value: 'M' },
          { name: 'material', value: '100% Organic Cotton' }
        ]
      },
      {
        productId: 'prod_003',
        sku: 'COF-003',
        name: 'Premium Coffee Beans',
        description: 'Single-origin coffee beans from Colombia',
        category: 'Food & Beverage',
        brand: 'CoffeeCo',
        price: 24.99,
        weight: 1.0,
        dimensions: { length: 6, width: 4, height: 2 },
        customFields: [
          { name: 'origin', value: 'Colombia' },
          { name: 'roast', value: 'Medium' }
        ]
      }
    ];

    sampleProducts.forEach(product => {
      this.products.set(product.productId, product);
      this.products.set(product.sku, product);
    });
  }

  /**
   * Generate sample customers
   */
  private generateSampleCustomers(): void {
    const sampleCustomers = [
      {
        customerId: 'cust_001',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        phone: '555-0101',
        type: 'individual' as const,
        addresses: [
          {
            type: 'billing' as const,
            address1: '123 Main St',
            address2: 'Apt 4B',
            city: 'New York',
            stateOrProvince: 'NY',
            zipCodeOrPostalCode: '10001',
            country: 'US'
          }
        ],
        customFields: [
          { name: 'vip_status', value: 'gold' },
          { name: 'marketing_opt_in', value: 'true' }
        ]
      },
      {
        customerId: 'cust_002',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@example.com',
        phone: '555-0102',
        type: 'individual' as const,
        addresses: [
          {
            type: 'shipping' as const,
            address1: '456 Oak Ave',
            city: 'Los Angeles',
            stateOrProvince: 'CA',
            zipCodeOrPostalCode: '90210',
            country: 'US'
          }
        ],
        customFields: [
          { name: 'customer_since', value: '2020-01-15' }
        ]
      }
    ];

    sampleCustomers.forEach(customer => {
      this.customers.set(customer.customerId, customer);
      this.customers.set(customer.email, customer);
    });
  }

  /**
   * Generate sample inventory
   */
  private generateSampleInventory(): void {
    const skus = ['WID-001', 'TSH-002', 'COF-003'];
    const warehouses = ['WH001', 'WH002', 'WH003'];

    skus.forEach(sku => {
      warehouses.forEach(locationId => {
        const available = Math.floor(Math.random() * 100) + 10;
        const reserved = Math.floor(Math.random() * 20);

        this.inventory.set(`${sku}_${locationId}`, {
          sku,
          locationId: locationId,  // Use locationId as per schema
          onHand: available + reserved,
          available: available,
          quantity: available + reserved,
          customFields: [
            { name: 'location', value: `Aisle ${Math.floor(Math.random() * 20) + 1}` }
          ]
        });
      });
    });
  }

  /**
   * Generate sample orders
   */
  private generateSampleOrders(): void {
    const sampleOrders = [
      {
        orderId: 'order_001',
        // orderNumber not in schema - tool will map orderNumber to extOrderId/orderId
        extOrderId: 'EXT-001',
        status: 'confirmed',
        customer: this.customers.get('cust_001'),
        lineItems: [
          {
            lineItemId: 'line_001',
            sku: 'WID-001',
            quantity: 1,
            unitPrice: 199.99,
            totalPrice: 199.99,
            customFields: []
          }
        ],
        billingAddress: {
          address1: '123 Main St',
          address2: 'Apt 4B',
          city: 'New York',
          stateOrProvince: 'NY',
          zipCodeOrPostalCode: '10001',
          country: 'US'
        },
        shippingAddress: {
          address1: '123 Main St',
          address2: 'Apt 4B',
          city: 'New York',
          stateOrProvince: 'NY',
          zipCodeOrPostalCode: '10001',
          country: 'US'
        },
        currency: 'USD',
        subTotalPrice: 199.99,
        orderTax: 16.00,
        shippingPrice: 0.00,
        totalPrice: 215.99,
        createdAt: DateUtils.format(DateUtils.addDays(-5)),
        updatedAt: DateUtils.format(DateUtils.addDays(-5)),
        customFields: [
          { name: 'priority', value: 'standard' },
          { name: 'source', value: 'website' }
        ]
      },
      {
        orderId: 'order_002',
        extOrderId: 'ORD-1001',  // Common format users might expect
        status: 'processing',
        customer: this.customers.get('cust_002'),
        lineItems: [
          {
            lineItemId: 'line_002',
            sku: 'TSH-002',
            quantity: 2,
            unitPrice: 29.99,
            totalPrice: 59.98,
            customFields: []
          }
        ],
        billingAddress: {
          address1: '456 Oak Ave',
          city: 'Los Angeles',
          stateOrProvince: 'CA',
          zipCodeOrPostalCode: '90001',
          country: 'US'
        },
        shippingAddress: {
          address1: '456 Oak Ave',
          city: 'Los Angeles',
          stateOrProvince: 'CA',
          zipCodeOrPostalCode: '90001',
          country: 'US'
        },
        currency: 'USD',
        subTotalPrice: 59.98,
        orderTax: 4.80,
        shippingPrice: 5.99,
        totalPrice: 70.77,
        createdAt: DateUtils.format(DateUtils.addDays(-3)),
        updatedAt: DateUtils.format(DateUtils.addDays(-2)),
        customFields: [
          { name: 'priority', value: 'express' }
        ]
      },
      {
        orderId: 'order_003',
        extOrderId: 'WEB-2024-1002',  // Different format example
        status: 'shipped',
        customer: this.customers.get('cust_001'),
        lineItems: [
          {
            lineItemId: 'line_003',
            sku: 'COF-003',
            quantity: 3,
            unitPrice: 24.99,
            totalPrice: 74.97,
            customFields: []
          }
        ],
        billingAddress: {
          address1: '123 Main St',
          address2: 'Apt 4B',
          city: 'New York',
          stateOrProvince: 'NY',
          zipCodeOrPostalCode: '10001',
          country: 'US'
        },
        shippingAddress: {
          address1: '789 Pine St',
          city: 'Chicago',
          stateOrProvince: 'IL',
          zipCodeOrPostalCode: '60601',
          country: 'US'
        },
        currency: 'USD',
        subTotalPrice: 74.97,
        orderTax: 6.00,
        shippingPrice: 8.99,
        totalPrice: 89.96,
        createdAt: DateUtils.format(DateUtils.addDays(-7)),
        updatedAt: DateUtils.format(DateUtils.addDays(-1)),
        customFields: [
          { name: 'gift', value: 'true' }
        ]
      }
    ];

    sampleOrders.forEach(order => {
      this.orders.set(order.orderId, order);
      // orderNumber not in schema
      // this.ordersByNumber.set(order.orderNumber, order);
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
  getOrder(orderId: string): any | undefined {
    return this.orders.get(orderId);
  }

  /**
   * Get order by order number
   */
  getOrderByNumber(orderNumber: string | undefined): any | undefined {
    if (!orderNumber) { return undefined; }
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
    if (!extOrderId) { return undefined; }
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
  getProduct(identifier: string | undefined): types.Product {
    if (!identifier) {
      throw new Error('Product identifier is required');
    }

    const product = this.products.get(identifier);
    if (!product) {
      // Generate a dynamic product if not found
      return {
        productId: `prod_${identifier}`,
        sku: identifier,
        name: `Dynamic Product ${identifier}`,
        description: `Auto-generated product for ${identifier}`,
        weight: Math.round((Math.random() * 2 + 0.1) * 100) / 100,
        customFields: [
          { name: 'generated', value: 'true' },
          { name: 'timestamp', value: DateUtils.now() }
        ]
      };
    }

    return product;
  }

  /**
   * Get customer by ID or email
   */
  getCustomer(identifier: string | undefined): types.Customer {
    if (!identifier) {
      throw new Error('Customer identifier is required');
    }

    const customer = this.customers.get(identifier);
    if (!customer) {
      // Generate a dynamic customer if not found
      return {
        customerId: `cust_${identifier}`,
        firstName: 'Generated',
        lastName: 'Customer',
        email: identifier.includes('@') ? identifier : `${identifier}@example.com`,
        phone: '555-0100',
        type: 'individual' as const,
        addresses: [
          {
            type: 'billing' as const,
            address1: '123 Generic St',
            city: 'Sample City',
            stateOrProvince: 'CA',
            zipCodeOrPostalCode: '90210',
            country: 'US'
          }
        ],
        customFields: [
          { name: 'generated', value: 'true' },
          { name: 'timestamp', value: DateUtils.now() }
        ]
      };
    }

    return customer;
  }

  /**
   * Get inventory for SKU and warehouse
   */
  getInventory(sku: string, locationId: string = 'WH001'): types.Inventory {
    const key = `${sku}_${locationId}`;
    const inventory = this.inventory.get(key);

    if (!inventory) {
      // Generate dynamic inventory if not found
      const available = Math.floor(Math.random() * 100) + 10;
      const reserved = Math.floor(Math.random() * 20);

      return {
        sku,
        locationId: locationId,  // Use locationId as per schema
        onHand: available + reserved,
        available: available,
        quantity: available + reserved,
        customFields: [
          { name: 'generated', value: 'true' },
          { name: 'location', value: `Aisle ${Math.floor(Math.random() * 20) + 1}` }
        ]
      };
    }

    return inventory;
  }

  /**
   * Get data size for health checks
   */
  getSize(): { orders: number; products: number; customers: number; inventory: number } {
    return {
      orders: this.orders.size,
      products: this.products.size,
      customers: this.customers.size,
      inventory: this.inventory.size
    };
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.orders.clear();
    this.ordersByNumber.clear();
    this.products.clear();
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
