/**
 * Test fixture data for testing
 */

export const TEST_ORDER_PARAMS = {
  extOrderId: 'TEST-ORDER-001',
  customer: {
    customerId: 'CUST-001',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1-555-0123'
  },
  billing: {
    address1: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zip: '12345',
    country: 'US'
  },
  shipping: {
    address1: '123 Test St',
    city: 'Test City', 
    state: 'TS',
    zip: '12345',
    country: 'US'
  },
  items: [
    {
      sku: 'TEST-SKU-001',
      quantity: 2,
      unitPrice: 25.99
    }
  ],
  totals: {
    subtotal: 51.98,
    tax: 4.16,
    shipping: 5.99,
    total: 62.13
  }
};

export const TEST_CUSTOMER = {
  customerId: 'CUST-001',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1-555-0123',
  createdAt: '2025-01-01T00:00:00Z'
};

export const TEST_PRODUCT = {
  sku: 'TEST-SKU-001',
  name: 'Test Product',
  description: 'A test product for testing',
  price: 25.99,
  category: 'Test Category',
  weight: 1.5,
  dimensions: {
    length: 10,
    width: 8,
    height: 2
  }
};

export const TEST_INVENTORY = {
  sku: 'TEST-SKU-001',
  warehouseId: 'WH-001',
  available: 100,
  reserved: 10,
  inTransit: 5,
  lastUpdated: '2025-01-01T00:00:00Z'
};

export const TEST_ORDER_RESULT = {
  success: true,
  orderId: 'ORD-001',
  orderNumber: 'ORDER-001',
  status: 'pending',
  createdAt: '2025-01-01T00:00:00Z'
};

export const TEST_MCP_REQUEST = {
  jsonrpc: '2.0' as const,
  method: 'tools/call',
  params: {
    name: 'capture-order',
    arguments: TEST_ORDER_PARAMS
  },
  id: 'test-request-1'
};

export const TEST_MCP_RESPONSE = {
  jsonrpc: '2.0' as const,
  result: TEST_ORDER_RESULT,
  id: 'test-request-1'
};

export const TEST_SHIPMENT = {
  shipmentId: 'SHIP-001',
  orderId: 'ORD-001',
  carrier: 'UPS',
  trackingNumber: '1Z123456789',
  status: 'shipped',
  shippedAt: '2025-01-01T00:00:00Z',
  items: [
    {
      sku: 'TEST-SKU-001',
      quantity: 2
    }
  ]
};

export const TEST_BUYER = {
  buyerId: 'BUYER-001',
  name: 'Test Buyer Corp',
  type: 'corporate',
  email: 'orders@testbuyer.com',
  status: 'active'
};