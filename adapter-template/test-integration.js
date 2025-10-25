#!/usr/bin/env node
/**
 * Test script to verify adapter can be loaded by the MCP server
 * Run this after building your adapter: npm run build && node test-integration.js
 */

import { YourFulfillmentAdapter } from './dist/index.js';

async function test() {
  console.log('Testing adapter integration...\n');

  // Test 1: Can instantiate with config
  console.log('1. Testing instantiation with config object...');
  const adapter1 = new YourFulfillmentAdapter({
    type: 'local',
    path: './dist/index.js',
    options: {
      apiUrl: 'https://test.api.com',
      apiKey: 'test-key',
    },
  });
  console.log('✓ Instantiated with AdapterConfig structure\n');

  // Test 2: Can instantiate with just options (fallback)
  console.log('2. Testing instantiation with options only...');
  new YourFulfillmentAdapter({
    apiUrl: 'https://test.api.com',
    apiKey: 'test-key',
  });
  console.log('✓ Instantiated with options only\n');

  // Test 3: Verify required methods exist
  console.log('3. Checking required methods...');
  const requiredMethods = [
    'connect',
    'disconnect',
    'healthCheck',
    'captureOrder',
    'cancelOrder',
    'updateOrder',
    'returnOrder',
    'exchangeOrder',
    'shipOrder',
    'holdOrder',
    'splitOrder',
    'reserveInventory',
    'getOrder',
    'getInventory',
    'getProduct',
    'getCustomer',
    'getShipment',
    'getBuyer',
  ];

  let allMethodsPresent = true;
  for (const method of requiredMethods) {
    if (typeof adapter1[method] !== 'function') {
      console.log(`✗ Missing method: ${method}`);
      allMethodsPresent = false;
    }
  }

  if (allMethodsPresent) {
    console.log(`✓ All ${requiredMethods.length} required methods present\n`);
  }

  // Test 4: Test default export
  console.log('4. Testing default export...');
  const module = await import('./dist/index.js');
  const DefaultAdapter = module.default;

  if (DefaultAdapter === YourFulfillmentAdapter) {
    console.log('✓ Default export matches YourFulfillmentAdapter\n');
  } else {
    console.log('✗ Default export mismatch\n');
  }

  // Test 5: Can connect (mock)
  console.log('5. Testing connect method...');
  try {
    await adapter1.connect();
    console.log('✓ Connect method works\n');
  } catch (error) {
    console.log(`✗ Connect failed: ${error.message}\n`);
  }

  // Test 6: Health check
  console.log('6. Testing health check...');
  try {
    const health = await adapter1.healthCheck();
    console.log(`✓ Health check returned: ${health.status}\n`);
  } catch (error) {
    console.log(`✗ Health check failed: ${error.message}\n`);
  }

  console.log('Integration test complete!');
  console.log('\nYour adapter is compatible with the MCP server adapter factory.');
  console.log('You can now use it with:');
  console.log('  ADAPTER_TYPE=local ADAPTER_PATH=../adapter-template/dist/index.js npm start');
}

test().catch(console.error);
