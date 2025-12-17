/**
 * Basic Usage Example for YourFulfillment Adapter
 * 
 * This example demonstrates basic operations with the adapter.
 */

import { YourFulfillmentAdapter } from '../src/adapter';

async function main() {
  // Initialize the adapter
  const adapter = new YourFulfillmentAdapter({
    apiUrl: process.env.API_URL || 'https://api.yourfulfillment.com',
    apiKey: process.env.API_KEY || 'your-api-key',
    workspace: process.env.WORKSPACE || 'default',
    timeout: 30000,
    debugMode: true
  });

  try {
    // 1. Connect to the Fulfillment System
    console.log('Connecting to YourFulfillment...');
    await adapter.connect();
    console.log('✓ Connected successfully\n');

    // 2. Check health status
    console.log('Checking health status...');
    const health = await adapter.healthCheck();
    console.log('Health Status:', health.status);
    console.log('Checks:', health.checks);
    console.log('');

    // 3. Create an order
    console.log('Creating a new order...');
    const orderResult = await adapter.captureOrder({
      extOrderId: 'EXT-' + Date.now(),
      customer: {
        customerId: 'CUST-001',
        email: 'customer@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890'
      },
      lineItems: [
        {
          sku: 'PROD-001',
          name: 'Sample Product',
          quantity: 2,
          price: 29.99,
          discount: 5.00,
          tax: 2.50
        },
        {
          sku: 'PROD-002',
          name: 'Another Product',
          quantity: 1,
          price: 49.99,
          tax: 4.00
        }
      ],
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        address1: '123 Main Street',
        address2: 'Suite 100',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
        phone: '+1234567890'
      },
      billingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        address1: '123 Main Street',
        address2: 'Suite 100',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
        phone: '+1234567890'
      },
      totalPrice: 111.47,
      currency: 'USD',
      orderNote: 'Please handle with care',
      orderSource: 'website'
    });

    console.log('✓ Order created successfully!');
    console.log('  Order ID:', orderResult.orderId);
    console.log('  Order Number:', orderResult.orderNumber);
    console.log('  Status:', orderResult.status);
    console.log('');

    // 4. Get order details
    console.log('Fetching order details...');
    const order = await adapter.getOrder({ 
      orderId: orderResult.orderId 
    });
    console.log('Order Details:');
    console.log('  External ID:', order.extOrderId);
    console.log('  Customer:', order.customer?.email);
    console.log('  Total:', order.totalPrice, order.currency);
    console.log('  Status:', order.status);
    console.log('');

    // 5. Check inventory
    console.log('Checking inventory for PROD-001...');
    const inventory = await adapter.getInventory('PROD-001');
    console.log('Inventory:');
    console.log('  Available:', inventory.available);
    console.log('  Reserved:', inventory.reserved);
    console.log('  Total:', inventory.total);
    if (inventory.locations) {
      console.log('  Locations:');
      inventory.locations.forEach(loc => {
        console.log(`    ${loc.locationId}: ${loc.available} available`);
      });
    }
    console.log('');

    // 6. Update order
    console.log('Updating order notes...');
    const updateResult = await adapter.updateOrder(
      orderResult.orderId,
      {
        notes: 'Updated: Gift wrap requested',
        tags: ['gift', 'priority']
      }
    );
    console.log('✓ Order updated successfully');
    console.log('  Updated fields:', updateResult.updatedFields.join(', '));
    console.log('');

    // 7. Reserve inventory
    console.log('Reserving inventory...');
    const reservation = await adapter.reserveInventory(
      [
        { sku: 'PROD-001', quantity: 2 },
        { sku: 'PROD-002', quantity: 1 }
      ],
      15 // 15 minutes
    );
    console.log('✓ Inventory reserved');
    console.log('  Reservation ID:', reservation.reservationId);
    console.log('  Expires at:', reservation.expiresAt);
    console.log('');

    // 8. Hold order (optional - comment out if not testing)
    /*
    console.log('Placing order on hold...');
    const holdResult = await adapter.holdOrder(
      orderResult.orderId,
      {
        reason: 'Payment verification required',
        until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        autoRelease: true,
        notes: 'Waiting for payment processor confirmation'
      }
    );
    console.log('✓ Order placed on hold');
    console.log('  Hold ID:', holdResult.holdId);
    */

    // 9. Ship order (optional - comment out if not testing)
    /*
    console.log('Creating shipment...');
    const shipmentResult = await adapter.shipOrder(
      orderResult.orderId,
      {
        carrier: 'UPS',
        service: 'Ground',
        trackingNumber: 'TRK' + Date.now(),
        items: [
          { sku: 'PROD-001', quantity: 2 },
          { sku: 'PROD-002', quantity: 1 }
        ]
      }
    );
    console.log('✓ Shipment created');
    console.log('  Shipment ID:', shipmentResult.shipmentId);
    console.log('  Tracking:', shipmentResult.trackingNumber);
    console.log('  Tracking URL:', shipmentResult.trackingUrl);
    */

    // 10. Disconnect
    console.log('\nDisconnecting from YourFulfillment...');
    await adapter.disconnect();
    console.log('✓ Disconnected successfully');

  } catch (error) {
    console.error('Error:', error);
    
    // Always disconnect on error
    try {
      await adapter.disconnect();
    } catch (disconnectError) {
      console.error('Failed to disconnect:', disconnectError);
    }
    
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export { main };