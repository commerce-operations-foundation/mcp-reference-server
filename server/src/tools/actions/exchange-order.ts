/**
 * Exchange Order Tool
 * Processes exchanges for order items
 */

import { BaseTool } from '../base-tool.js';
import { JSONSchema } from '../../types/mcp.js';

export class ExchangeOrderTool extends BaseTool {
  name = 'exchange-order';

  description = 'Processes item exchanges when customers want different products instead of refunds. Use when: swapping sizes/colors, replacing defective items, or upgrading products. Handles both return and new order creation atomically. Calculates price differences and processes adjustments. More efficient than separate return + new order.';

  inputSchema: JSONSchema = {
    type: 'object',
    properties: {
      orderId: {
        type: 'string',
        description: 'Unique identifier of the original order (required)'
      },
      returnItems: {
        type: 'array',
        description: 'Items being returned for exchange',
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
              description: 'Product SKU being returned'
            },
            quantity: {
              type: 'number',
              minimum: 1,
              description: 'Quantity to return'
            },
            reason: {
              type: 'string',
              description: 'Reason for exchange',
              enum: [
                'wrong_size',
                'wrong_color',
                'defective',
                'damaged',
                'customer_preference',
                'quality_issue',
                'not_as_described',
                'other'
              ]
            }
          },
          required: ['sku', 'quantity', 'reason']
        }
      },
      exchangeItems: {
        type: 'array',
        description: 'New items to send in exchange',
        minItems: 1,
        items: {
          type: 'object',
          properties: {
            sku: {
              type: 'string',
              description: 'Product SKU for new item'
            },
            quantity: {
              type: 'number',
              minimum: 1,
              description: 'Quantity of new item'
            },
            unitPrice: {
              type: 'number',
              minimum: 0,
              description: 'Price of new item (for price difference calculation)'
            },
            name: {
              type: 'string',
              description: 'Product name'
            }
          },
          required: ['sku', 'quantity']
        }
      },
      shippingAddress: {
        type: 'object',
        description: 'Shipping address for exchange items (if different from original)',
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
      exchangeReason: {
        type: 'string',
        description: 'Overall reason for the exchange'
      },
      notes: {
        type: 'string',
        description: 'Additional notes about the exchange'
      }
    },
    required: ['orderId', 'returnItems', 'exchangeItems']
  };

  async execute(input: any): Promise<any> {
    // Delegate to service layer
    const exchangeParams = {
      orderId: input.orderId,
      returnItems: input.returnItems,
      newItems: input.exchangeItems,
      shippingAddress: input.shippingAddress,
      reason: input.exchangeReason
    };

    return this.serviceLayer.exchangeOrder(exchangeParams);
  }
}
