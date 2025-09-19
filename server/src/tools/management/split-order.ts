/**
 * Split Order Tool
 * Splits an order into multiple separate orders
 */

import { BaseTool } from '../base-tool.js';
import { JSONSchema } from '../../types/mcp.js';

export class SplitOrderTool extends BaseTool {
  name = 'split-order';
  
  description = 'Divides a single order into multiple orders for optimized fulfillment. Use when: items ship from different warehouses, partial inventory available, expediting some items, different shipping methods needed, or dropshipping part of order. Creates child orders maintaining parent reference. Specify split criteria: by location, availability, shipping speed, or custom grouping.';
  
  inputSchema: JSONSchema = {
    type: 'object',
    properties: {
      orderId: {
        type: 'string',
        description: 'Unique identifier of the order to split (required)'
      },
      splits: {
        type: 'array',
        description: 'Split specifications',
        minItems: 2,
        items: {
          type: 'object',
          properties: {
            splitName: {
              type: 'string',
              description: 'Name or identifier for this split'
            },
            items: {
              type: 'array',
              description: 'Line items to include in this split',
              minItems: 1,
              items: {
                type: 'object',
                properties: {
                  lineItemId: {
                    type: 'string',
                    description: 'Line item ID from original order'
                  },
                  sku: {
                    type: 'string',
                    description: 'Product SKU'
                  },
                  quantity: {
                    type: 'number',
                    minimum: 1,
                    description: 'Quantity for this split'
                  }
                },
                required: ['sku', 'quantity']
              }
            },
            locationId: {
              type: 'string',
              description: 'Fulfillment location for this split'
            },
            shippingMethod: {
              type: 'string',
              description: 'Shipping method for this split',
              enum: [
                'standard',
                'expedited', 
                'overnight',
                'ground',
                'priority',
                'economy',
                'pickup'
              ]
            },
            shippingAddress: {
              type: 'object',
              description: 'Shipping address for this split (if different)',
              properties: {
                address1: { type: 'string' },
                address2: { type: 'string' },
                city: { type: 'string' },
                stateOrProvince: { type: 'string' },
                zipCodeOrPostalCode: { type: 'string' },
                country: { type: 'string' },
                phone: { type: 'string' }
              }
            },
            priority: {
              type: 'string',
              description: 'Priority level for this split',
              enum: ['low', 'normal', 'high', 'urgent'],
              default: 'normal'
            },
            notes: {
              type: 'string',
              description: 'Notes specific to this split'
            }
          },
          required: ['items']
        }
      },
      splitReason: {
        type: 'string',
        description: 'Reason for splitting the order',
        enum: [
          'inventory_availability',
          'shipping_location',
          'shipping_method',
          'fulfillment_capacity',
          'customer_request',
          'delivery_schedule',
          'product_category',
          'vendor_dropship',
          'other'
        ]
      },
      preserveOriginalOrder: {
        type: 'boolean',
        description: 'Whether to keep the original order record',
        default: false
      },
      notifyCustomer: {
        type: 'boolean',
        description: 'Whether to notify customer about the split',
        default: true
      },
      recalculateShipping: {
        type: 'boolean',
        description: 'Whether to recalculate shipping costs for each split',
        default: true
      }
    },
    required: ['orderId', 'splits', 'splitReason']
  };

  async execute(input: any): Promise<any> {
    // Delegate to service layer
    return this.serviceLayer.splitOrder(input.orderId, input.splits);
  }
}